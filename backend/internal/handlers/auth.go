// internal/handlers/auth.go — Authentication handler
//
// Endpoints:
//   POST /api/auth/login
//     Body:   { "accessKeyId": "...", "secretAccessKey": "...", "region": "..." }
//     Errors: 401 on invalid credentials, 500 on unexpected errors
//
// Dependencies:
//   - services.AuthService.ValidateCredentials(ctx, accessKeyID, secretKey, region)
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

type UserKeys struct {
	AccessKeyId     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
	SessionToken    string `json:"sessionToken"`
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authSvc *services.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, jwtSecret: jwtSecret}
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var user UserKeys
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}
	// validate against aws
	caller, err := h.authSvc.ValidateCredentials(r.Context(), user.AccessKeyId, user.SecretAccessKey, user.Region, user.SessionToken)
	if err != nil {
		http.Error(w, `{"error":"authentication error"}`, http.StatusUnauthorized)
		return
	}

	// create claims
	// TODO: Implement time
	claims := middleware.Claims{
		AccessKeyID:  user.AccessKeyId,
		SecretKey:    user.SecretAccessKey,
		Region:       user.Region,
		SessionToken: user.SessionToken,
		AccountID:    caller.AccountID,
		ARN:          caller.ARN,
	}

	// sign token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	// send back to client
	w.Header().Set("Content-type", "application/json")
	err = json.NewEncoder(w).Encode(map[string]string{"token": signedToken})
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}
