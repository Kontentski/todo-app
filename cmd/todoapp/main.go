package main

import (
	"log"
	"os"

	"github.com/Kontentski/todo-app/internal/handlers"
	"github.com/Kontentski/todo-app/internal/router"
	"github.com/Kontentski/todo-app/internal/storage"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	store, err := storage.NewPostgresStorage(dsn)
	if err != nil {
		log.Fatal("failed to connect to database", err)
	}
	store.StartHeartbeat()

	handler := &handlers.TodoHandler{Storage: store}
	r := router.NewRouter(handler, jwtSecret)
	r.SetupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not specified
	}

	// Start server
	log.Fatal(r.Start(port))
}
