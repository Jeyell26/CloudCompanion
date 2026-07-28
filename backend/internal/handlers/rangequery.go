// internal/handlers/rangequery.go — Range query handler
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

package handlers

import (
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// RangeQueryHandler handles range query HTTP requests.
type RangeQueryHandler struct {
	svc *services.RangeQueryService
}

// NewRangeQueryHandler creates a new range query handler.
func NewRangeQueryHandler(svc *services.RangeQueryService) *RangeQueryHandler {
	return &RangeQueryHandler{svc: svc}
}

// Query handles POST /api/range-query
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
}
