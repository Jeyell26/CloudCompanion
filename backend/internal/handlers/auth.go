// internal/handlers/auth.go — Authentication handler
//
// Endpoints:
//   POST /api/auth/login
//     Body:   { "roleArn": "...", "externalId": "...", "region": "..." }
//     Action: Calls sts:AssumeRole on the user's LogPulseReadRole via LogPulseAppRole.
//             Packs the temporary credentials into a signed JWT.
//     Errors: 401 on failed assumption, 400 on bad request, 500 on unexpected errors
//
// Dependencies:
//   - services.AuthService.AssumeRole(ctx, roleArn, externalId, region)
//   - jwt.NewWithClaims to produce the session token
//   - JWT_SECRET from environment

package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
	"github.com/golang-jwt/jwt/v5"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	authSvc   *services.AuthService
	jwtSecret string
}

// LoginRequest is the expected body for POST /api/auth/login.
type LoginRequest struct {
	RoleARN    string `json:"roleArn"`
	ExternalID string `json:"externalId"`
	Region     string `json:"region"`
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authSvc *services.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, jwtSecret: jwtSecret}
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}

	if req.RoleARN == "" || req.Region == "" {
		http.Error(w, `{"error":"roleArn and region are required"}`, http.StatusBadRequest)
		return
	}

	// Assume the user's LogPulseReadRole using LogPulseAppRole (default credential chain)
	creds, err := h.authSvc.AssumeRole(r.Context(), req.RoleARN, req.ExternalID, req.Region)
	if err != nil {
		http.Error(w, `{"error":"authentication error"}`, http.StatusUnauthorized)
		return
	}

	// create claims
	// TODO: Implement time
	claims := middleware.Claims{
		RoleARN:          req.RoleARN,
		ExternalID:       req.ExternalID,
		Region:           req.Region,
		AccountID:        creds.AccountID,
		ARN:              creds.ARN,
		TempAccessKeyID:  creds.AccessKeyID,
		TempSecretKey:    creds.SecretKey,
		TempSessionToken: creds.SessionToken,
	}

	// sign token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	// send back to client
	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(map[string]string{"token": signedToken}); err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}
