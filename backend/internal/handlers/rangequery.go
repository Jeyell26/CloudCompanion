// internal/handlers/rangequery.go — Range query handler

package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// RangeQueryHandler handles range query HTTP requests.
type RangeQueryHandler struct {
	svc *services.RangeQueryService
}

// RangeQueryRequest handles json decoding
type RangeQueryRequest struct {
	Groups    []string `json:"groups"`
	Range     Ranges   `json:"range"`
	NextToken string   `json:"nextToken,omitempty"`
}

type Ranges struct {
	StartDate string `json:"startDate"`
	StartTime string `json:"startTime"`
	EndDate   string `json:"endDate"`
	EndTime   string `json:"endTime"`
}

func parseDateTime(dateStr, timeStr string) (time.Time, error) {
	combined := dateStr + "T" + timeStr
	if t, err := time.Parse("2006-01-02T15:04:05", combined); err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02T15:04", combined)
}

// NewRangeQueryHandler creates a new range query handler.
func NewRangeQueryHandler(svc *services.RangeQueryService) *RangeQueryHandler {
	return &RangeQueryHandler{svc: svc}
}

// Query handles POST /api/range-query
func (h *RangeQueryHandler) Query(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.ClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, `{"error":"unauthorized request"}`, http.StatusUnauthorized)
		return
	}

	var req RangeQueryRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Println("[RangeQuery] Error decoding body:", err)
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	// Epoch conversion
	startMs, err := parseDateTime(req.Range.StartDate, req.Range.StartTime)
	if err != nil {
		log.Println("[RangeQuery] Error parsing startDate/startTime:", err, "Combined:", req.Range.StartDate+"T"+req.Range.StartTime)
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	endMs, err := parseDateTime(req.Range.EndDate, req.Range.EndTime)
	if err != nil {
		log.Println("[RangeQuery] Error parsing endDate/endTime:", err, "Combined:", req.Range.EndDate+"T"+req.Range.EndTime)
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	logEvents, err := h.svc.QueryRange(
		r.Context(),
		req.Groups,
		startMs.UnixMilli(),
		endMs.UnixMilli(),
		req.NextToken,
		claims.Region,
		claims.TempAccessKeyID,
		claims.TempSecretKey,
		claims.TempSessionToken,
	)
	if err != nil {
		log.Println("[RangeQuery] Error in QueryRange:", err)
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-type", "application/json")
	err = json.NewEncoder(w).Encode(logEvents)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}
