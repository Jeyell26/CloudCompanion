// internal/handlers/livetail.go — Live tail SSE handler
//
// Endpoints:
//   GET /api/live-tail?groups=<group>&token=<jwt>
//     Protocol: Server-Sent Events (text/event-stream)
//     Query:    groups — one or more log group names
//               token  — JWT passed as query param because EventSource
//                        cannot set custom headers in the browser
//     Action:   Open a CloudWatch Logs StartLiveTail stream and forward
//               each LogEvent as an SSE `data:` frame to the client.
//     Teardown: When the client disconnects (request context Done), cancel
//               the AWS stream to avoid resource leaks.
//
// Notes:
//   - Disable response buffering: set headers before streaming.
//   - Keep-alive: send a comment line (": ping\n\n") every ~15s to prevent
//     proxy/load balancer timeouts.
//   - Use http.Flusher to push data immediately.
//
// Dependencies:
//   - middleware.AuthMiddleware.VerifyQueryToken(tokenStr) for inline JWT check
//   - services.LiveTailService.StartLiveTail(ctx, groups, region, accessKeyID, secretKey, onEvent)

package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// LiveTailHandler handles live tail SSE streaming HTTP requests.
type LiveTailHandler struct {
	svc    *services.LiveTailService
	authMW *middleware.AuthMiddleware
}

// NewLiveTailHandler creates a new live tail handler.
func NewLiveTailHandler(svc *services.LiveTailService, jwtSecret string) *LiveTailHandler {
	return &LiveTailHandler{
		svc:    svc,
		authMW: middleware.NewAuthMiddleware(jwtSecret),
	}
}

// Stream handles GET /api/live-tail
//
// TODO: implement
//  1. Verify JWT from r.URL.Query().Get("token") via h.authMW.VerifyQueryToken
//  2. Extract groups[] from query params: r.URL.Query()["groups[]"]
//  3. Set SSE response headers:
//     Content-Type: text/event-stream
//     Cache-Control: no-cache
//     Connection: keep-alive
//  4. Assert http.Flusher support
//  5. Start a goroutine for keepalive pings every 15s: fmt.Fprintf(w, ": ping\n\n") + flush
//  6. Call h.svc.StartLiveTail with a cancellable context (derived from r.Context())
//     In onEvent: fmt.Fprintf(w, "data: %s\n\n", json.Marshal(event)) + flush
//  7. Block until r.Context().Done() (client disconnect)
//  8. Cancel the context to stop the AWS stream
func (h *LiveTailHandler) Stream(w http.ResponseWriter, r *http.Request) {
	// check claims via middleware
	claims, err := h.authMW.VerifyQueryToken(r.URL.Query().Get("token"))
	if err != nil {
		http.Error(w, `{"error":"unauthorized request"}`, http.StatusUnauthorized)
		return
	}

	// retrieve groups from query
	logGroups := r.URL.Query()["groups"]
	log.Println("[LiveTail] Opening SSE stream for groups:", logGroups)

	// set sse http writer
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// check http flusher if streaming is supported
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, `{"error":"streaming not supported"}`, http.StatusInternalServerError)
		return
	}

	// keep-alive
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-r.Context().Done():
				return
			case <-ticker.C:
				fmt.Fprintf(w, ": ping\n\n")
				flusher.Flush()
			}
		}
	}()

	// anonymous function declaration
	jsonOnEvent := func(event services.LogEvent) {
		marshal, err := json.Marshal(event)
		if err != nil {
			return
		}
		fmt.Fprintf(w, "data: %s\n\n", marshal)
		flusher.Flush()
	}

	// live tail start
	err = h.svc.StartLiveTail(
		r.Context(),
		logGroups,
		claims.Region,
		claims.AccessKeyID,
		claims.SecretKey,
		claims.SessionToken,
		jsonOnEvent,
	)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}
