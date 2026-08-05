// internal/middleware/auth.go — JWT verification middleware
//
// Attach to any chi route group that requires an authenticated session.
//
// Expected request header:
//   Authorization: Bearer <jwt>
//
// On success:
//   - Decodes the token and stores claims in the request context
//   - Calls next handler
//
// On failure:
//   - Returns HTTP 401 with a JSON error body

package middleware

import (
<<<<<<< Updated upstream
	"net/http"
=======
	"context"
	"errors"
	"net/http"
	"strings"
>>>>>>> Stashed changes

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// Claims represents the JWT payload issued at login.
type Claims struct {
<<<<<<< Updated upstream
	AccessKeyID string `json:"accessKeyId"`
	SecretKey   string `json:"secretAccessKey"`
	Region      string `json:"region"`
	AccountID   string `json:"accountId,omitempty"`
	ARN         string `json:"arn,omitempty"`
=======
	AccessKeyID  string `json:"accessKeyId"`
	SecretKey    string `json:"secretAccessKey"`
	Region       string `json:"region"`
	AccountID    string `json:"accountId,omitempty"`
	ARN          string `json:"arn,omitempty"`
	SessionToken string `json:"arn,omitempty"`
>>>>>>> Stashed changes
	jwt.RegisteredClaims
}

// AuthMiddleware provides JWT verification for protected routes.
type AuthMiddleware struct {
	secret []byte
}

// NewAuthMiddleware creates a new auth middleware with the given JWT secret.
func NewAuthMiddleware(secret string) *AuthMiddleware {
	return &AuthMiddleware{secret: []byte(secret)}
}

// Verify is a chi middleware that validates the Authorization Bearer token.
<<<<<<< Updated upstream
//
// TODO: implement
//   1. Read the Authorization header
//   2. Extract the Bearer token
//   3. Parse and validate with jwt.ParseWithClaims(tokenStr, &Claims{}, keyFunc)
//   4. Store claims in request context via context.WithValue(r.Context(), ClaimsKey, claims)
//   5. Call next.ServeHTTP on success, return 401 JSON on any failure
func (a *AuthMiddleware) Verify(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO
		http.Error(w, `{"error":"not implemented"}`, http.StatusNotImplemented)
=======
func (a *AuthMiddleware) Verify(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bearerToken := r.Header.Get("Authorization")
		bearer := strings.TrimPrefix(bearerToken, "Bearer ")

		// keyfunc to insert token
		keyfunc := func(token *jwt.Token) (interface{}, error) {
			return a.secret, nil
		}

		token, err := jwt.ParseWithClaims(bearer, &Claims{}, keyfunc)
		// Token Check
		if err != nil || !token.Valid {
			http.Error(w, `{"error":"authentication error"}`, http.StatusUnauthorized)
			return
		}

		// Unwrap and structure check
		claims, ok := token.Claims.(*Claims)
		if !ok {
			http.Error(w, `{"error":"authentication error"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), ClaimsKey, claims)

		next.ServeHTTP(w, r.WithContext(ctx))
>>>>>>> Stashed changes
	})
}

// VerifyQueryToken validates a JWT passed as a query parameter (for SSE/EventSource).
<<<<<<< Updated upstream
//
// TODO: implement
//   1. Parse tokenStr with jwt.ParseWithClaims
//   2. Return *Claims on success, error on failure
func (a *AuthMiddleware) VerifyQueryToken(tokenStr string) (*Claims, error) {
	// TODO
	return nil, nil
}

// GetClaims extracts the JWT claims from the request context.
func GetClaims(r *http.Request) *Claims {
	claims, _ := r.Context().Value(ClaimsKey).(*Claims)
	return claims
=======
func (a *AuthMiddleware) VerifyQueryToken(bearer string) (*Claims, error) {
	// keyfunc to insert token
	keyfunc := func(token *jwt.Token) (interface{}, error) {
		return a.secret, nil
	}

	token, err := jwt.ParseWithClaims(bearer, &Claims{}, keyfunc)
	// Token Check
	if err != nil || !token.Valid {
		return nil, err
	}

	// Unwrap and structure check
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid claims structure")
	}

	return claims, nil
>>>>>>> Stashed changes
}
