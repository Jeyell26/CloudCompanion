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
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// Claims represents the JWT payload issued at login.
type Claims struct {
	AccessKeyID  string `json:"accessKeyId"`
	SecretKey    string `json:"secretAccessKey"`
	Region       string `json:"region"`
	AccountID    string `json:"accountId,omitempty"`
	ARN          string `json:"arn,omitempty"`
	SessionToken string `json:"arn,omitempty"`
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
	})
}

// VerifyQueryToken validates a JWT passed as a query parameter (for SSE/EventSource).
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
}
