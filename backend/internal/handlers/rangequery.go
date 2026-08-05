// internal/handlers/rangequery.go — Range query handler

package handlers

import (
	"encoding/json"
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
	Groups []string `json:"groups"`
	Range  Ranges   `json:"range"`
}

type Ranges struct {
	StartDate string `json:"startDate"`
	StartTime string `json:"startTime"`
	EndDate   string `json:"endDate"`
	EndTime   string `json:"endTime"`
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
}
