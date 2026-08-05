// internal/handlers/loggroups.go — Log group listing handler
//
// Endpoints:
//   GET /api/log-groups
//     Headers: Authorization: Bearer <jwt>
//     Action:  Fetch all CloudWatch log groups visible to the IAM principal
//              encoded in the JWT.
//     Returns: [{ "name": "...", "arn": "...", "storedBytes": N, "retentionDays": N }, ...]
//     Errors:  401 if token missing/invalid, 500 on AWS errors
//
// Dependencies:
//   - middleware.GetClaims(r) to extract credentials from JWT context
//   - services.LogGroupsService.ListLogGroups(ctx, region, accessKeyID, secretKey)

package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// LogGroupsHandler handles log group listing HTTP requests.
type LogGroupsHandler struct {
	svc *services.LogGroupsService
}

// NewLogGroupsHandler creates a new log groups handler.
func NewLogGroupsHandler(svc *services.LogGroupsService) *LogGroupsHandler {
	return &LogGroupsHandler{svc: svc}
}

// List handles GET /api/log-groups
func (h *LogGroupsHandler) List(w http.ResponseWriter, r *http.Request) {
	// extract claims from context
	claims, ok := r.Context().Value(middleware.ClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, `{"error":"unauthorized request"}`, http.StatusUnauthorized)
		return
	}

	// get log group from service
	logGroups, err := h.svc.ListLogGroups(r.Context(), claims.Region, claims.AccessKeyID, claims.SecretKey, claims.SessionToken)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	// encode in json and send
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(logGroups)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}
