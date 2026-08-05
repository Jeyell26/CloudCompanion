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

<<<<<<< Updated upstream
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
=======
import (
	"log"
	"net/http"
	"os"

	"github.com/Jeyell26/CloudCompanion/backend/internal/handlers"
	"github.com/Jeyell26/CloudCompanion/backend/internal/middleware"
	"github.com/Jeyell26/CloudCompanion/backend/internal/services"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	PORT := os.Getenv("PORT")
	JWT_SECRET := os.Getenv("JWT_SECRET")
	CORS_ORIGIN := os.Getenv("CORS_ORIGIN")
	if PORT == "" || JWT_SECRET == "" || CORS_ORIGIN == "" {
		log.Fatal("missing required environment variables (PORT, JWT_SECRET, CORS_ORIGIN)")
	}

	awsSvc := services.NewAWSClient()
	mockerSvc := services.NewMockerService(awsSvc)
	authSvc := services.NewAuthService(awsSvc, mockerSvc)
	logGroupsSvc := services.NewLogGroupsService(awsSvc)
	liveTailSvc := services.NewLiveTailService(awsSvc)
	rangeQuerySvc := services.NewRangeQueryService(awsSvc)

	hMW := middleware.NewAuthMiddleware(JWT_SECRET)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{CORS_ORIGIN},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(corsMiddleware.Handler)

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/login", handlers.NewAuthHandler(authSvc, JWT_SECRET).Login)
		r.Group(func(r chi.Router) {
			r.Use(hMW.Verify)
			r.Get("/log-groups", handlers.NewLogGroupsHandler(logGroupsSvc).List)
			r.Post("/range-query", handlers.NewRangeQueryHandler(rangeQuerySvc).Query)
		})
		r.Get("/live-tail", handlers.NewLiveTailHandler(liveTailSvc, JWT_SECRET).Stream)
	})

	log.Println("Server running on port: ", PORT)
	err = http.ListenAndServe(":"+PORT, r)
	if err != nil {
		log.Fatal(err)
	}
>>>>>>> Stashed changes
}
