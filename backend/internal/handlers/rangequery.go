// internal/handlers/rangequery.go — Range query handler
<<<<<<< Updated upstream
//
// Endpoints:
//   POST /api/range-query
//     Headers: Authorization: Bearer <jwt>
//     Body:    { "groups": ["..."], "range": { "startDate", "startTime", "endDate", "endTime" }, "nextToken"?: "..." }
//     Action:  Run a CloudWatch Logs FilterLogEvents query for the given
//              groups and time window, returning one page of results.
//     Returns: { "events": LogEvent[], "nextToken"?: "..." }
//     Errors:  400 on invalid range, 401 on bad token, 500 on AWS errors
//
// Time conversion:
//   The frontend sends ISO date strings (YYYY-MM-DD + HH:MM:SS).
//   Convert to epoch milliseconds before passing to the service.
//
// Dependencies:
//   - middleware.GetClaims(r) to extract credentials from JWT context
//   - services.RangeQueryService.QueryRange(ctx, groups, startMs, endMs, nextToken, region, accessKeyID, secretKey)
=======
>>>>>>> Stashed changes

package handlers

import (
<<<<<<< Updated upstream
	"net/http"

=======
	"encoding/json"
	"net/http"
	"time"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
>>>>>>> Stashed changes
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// RangeQueryHandler handles range query HTTP requests.
type RangeQueryHandler struct {
	svc *services.RangeQueryService
}

<<<<<<< Updated upstream
=======
// RangeQueryRequest handles json decoding
type RangeQueryRequest struct {
	Groups []string `json:"groups"`
	Range  Ranges   `json:"range"`
}

type Ranges struct {
	StartDate string `json:"startDate"`
	StartTime string `json:"startTime"`
	EndDate   string `json:"endDate"`
	EndTime   string `json:"endTime"`
}

>>>>>>> Stashed changes
// NewRangeQueryHandler creates a new range query handler.
func NewRangeQueryHandler(svc *services.RangeQueryService) *RangeQueryHandler {
	return &RangeQueryHandler{svc: svc}
}

// Query handles POST /api/range-query
<<<<<<< Updated upstream
//
// TODO: implement
//   1. Extract claims from context via middleware.GetClaims(r)
//   2. Decode JSON body: { groups: []string, range: { startDate, startTime, endDate, endTime }, nextToken?: string }
//   3. Validate: end > start, range does not exceed max time window
//   4. Convert range strings to epoch ms:
//        time.Parse("2006-01-02T15:04:05", startDate+"T"+startTime) → .UnixMilli()
//   5. Call h.svc.QueryRange(ctx, groups, startMs, endMs, nextToken, claims.Region, claims.AccessKeyID, claims.SecretKey)
//   6. Return JSON: { events: [...], nextToken: "..." }
//   7. On error → return 400 or 500 JSON
func (h *RangeQueryHandler) Query(w http.ResponseWriter, r *http.Request) {
	// TODO
	http.Error(w, `{"error":"not implemented"}`, http.StatusNotImplemented)
=======
func (h *RangeQueryHandler) Query(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.ClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, `{"error":"unauthorized request"}`, http.StatusUnauthorized)
		return
	}

	var req RangeQueryRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	// Epoch conversion
	startCombined := req.Range.StartDate + "T" + req.Range.StartTime
	endCombined := req.Range.EndDate + "T" + req.Range.EndTime

	startMs, err := time.Parse("2006-01-02T15:04:05", startCombined)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	endMs, err := time.Parse("2006-01-02T15:04:05", endCombined)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	logEvents, err := h.svc.QueryRange(
		r.Context(),
		req.Groups,
		startMs.UnixMilli(),
		endMs.UnixMilli(),
		claims.Region,
		claims.AccessKeyID,
		claims.SecretKey,
		claims.SessionToken,
	)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-type", "application/json")
	err = json.NewEncoder(w).Encode(logEvents)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
>>>>>>> Stashed changes
}
