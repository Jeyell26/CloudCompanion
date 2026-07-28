// cmd/server/main.go — LogPulse backend entry point
//
// Responsibilities:
//   - Load environment variables from .env via godotenv
//   - Initialise service layer (AWSClient → AuthService, LogGroupsService, etc.)
//   - Create auth middleware with JWT_SECRET
//   - Build the chi router with CORS, logging, and recovery middleware
//   - Mount all feature handlers under /api:
//       POST /api/auth/login        → handlers.AuthHandler.Login       (no JWT)
//       GET  /api/log-groups        → handlers.LogGroupsHandler.List   (JWT required)
//       GET  /api/live-tail         → handlers.LiveTailHandler.Stream  (JWT via query param)
//       POST /api/range-query       → handlers.RangeQueryHandler.Query (JWT required)
//   - Start the HTTP server on PORT (default 5000)
//
// Usage:
//   go run ./cmd/server

package main

// TODO: implement
//   1. Load .env via godotenv.Load()
//   2. Read PORT, JWT_SECRET, CORS_ORIGIN from os.Getenv
//   3. Initialise services:
//        awsSvc        := services.NewAWSClient()
//        authSvc       := services.NewAuthService(awsSvc)
//        logGroupsSvc  := services.NewLogGroupsService(awsSvc)
//        liveTailSvc   := services.NewLiveTailService(awsSvc)
//        rangeQuerySvc := services.NewRangeQueryService(awsSvc)
//   4. Create auth middleware:
//        authMW := middleware.NewAuthMiddleware(jwtSecret)
//   5. Build chi router with global middleware (Logger, Recoverer, CORS)
//   6. Mount routes:
//        r.Route("/api", func(r chi.Router) {
//            r.Post("/auth/login", handlers.NewAuthHandler(authSvc, jwtSecret).Login)
//            r.Group(func(r chi.Router) {
//                r.Use(authMW.Verify)
//                r.Get("/log-groups", handlers.NewLogGroupsHandler(logGroupsSvc).List)
//                r.Post("/range-query", handlers.NewRangeQueryHandler(rangeQuerySvc).Query)
//            })
//            r.Get("/live-tail", handlers.NewLiveTailHandler(liveTailSvc, jwtSecret).Stream)
//        })
//   7. Start http.ListenAndServe on :PORT

func main() {
	// TODO
}
