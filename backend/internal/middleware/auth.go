// internal/middleware/auth.go — JWT verification middleware
//
// Claims now hold the assumed role's temporary credentials
// (from sts:AssumeRole), NOT static IAM access keys.

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
// Temporary credentials are the result of sts:AssumeRole on the user's LogPulseReadRole.
type Claims struct {
	RoleARN          string `json:"roleArn"`
	ExternalID       string `json:"externalId,omitempty"`
	Region           string `json:"region"`
	AccountID        string `json:"accountId,omitempty"`
	ARN              string `json:"arn,omitempty"`
	TempAccessKeyID  string `json:"tempAccessKeyId"`
	TempSecretKey    string `json:"tempSecretKey"`
	TempSessionToken string `json:"tempSessionToken"`
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
