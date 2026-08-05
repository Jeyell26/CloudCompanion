// internal/handlers/auth.go — Authentication handler
//
// Endpoints:
//   POST /api/auth/login
//     Body:   { "accessKeyId": "...", "secretAccessKey": "...", "region": "..." }
<<<<<<< Updated upstream
//     Action: Validate credentials via STS GetCallerIdentity,
//             sign a JWT on success, return { "token": "..." }
=======
>>>>>>> Stashed changes
//     Errors: 401 on invalid credentials, 500 on unexpected errors
//
// Dependencies:
//   - services.AuthService.ValidateCredentials(ctx, accessKeyID, secretKey, region)
//   - jwt.NewWithClaims to produce the session token
//   - JWT_SECRET from environment

package handlers

import (
<<<<<<< Updated upstream
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
=======
	"encoding/json"
	"net/http"

	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
	"github.com/golang-jwt/jwt/v5"
>>>>>>> Stashed changes
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	authSvc   *services.AuthService
	jwtSecret string
}

<<<<<<< Updated upstream
=======
type UserKeys struct {
	AccessKeyId     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
	SessionToken    string `json:"sessionToken"`
}

>>>>>>> Stashed changes
// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authSvc *services.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, jwtSecret: jwtSecret}
}

// Login handles POST /api/auth/login
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
}
