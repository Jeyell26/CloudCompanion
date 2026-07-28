// internal/handlers/auth.go — Authentication handler
//
// Endpoints:
//   POST /api/auth/login
//     Body:   { "accessKeyId": "...", "secretAccessKey": "...", "region": "..." }
//     Action: Validate credentials via STS GetCallerIdentity,
//             sign a JWT on success, return { "token": "..." }
//     Errors: 401 on invalid credentials, 500 on unexpected errors
//
// Dependencies:
//   - services.AuthService.ValidateCredentials(ctx, accessKeyID, secretKey, region)
//   - jwt.NewWithClaims to produce the session token
//   - JWT_SECRET from environment

package handlers

import (
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	authSvc   *services.AuthService
	jwtSecret string
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authSvc *services.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, jwtSecret: jwtSecret}
}

// Login handles POST /api/auth/login
//
// TODO: implement
//   1. Decode JSON body: { accessKeyId, secretAccessKey, region }
//   2. Call s.authSvc.ValidateCredentials(ctx, accessKeyID, secretKey, region)
//   3. On error → return 401 JSON
//   4. Build JWT claims (middleware.Claims) with accessKeyId, region, accountId, arn
//   5. Sign with jwt.NewWithClaims(jwt.SigningMethodHS256, claims) and s.jwtSecret
//   6. Return 200 JSON: { "token": "<signed jwt>" }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// TODO
	http.Error(w, `{"error":"not implemented"}`, http.StatusNotImplemented)
}
