package main

import (
	"log"

	"github.com/Kontentski/todo-app/internal/handlers"
	"github.com/Kontentski/todo-app/internal/storage"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	store := storage.NewMemoryStore()
	handler := &handlers.TodoHandler{Storage: store}
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", handler.GetTasks)
	e.GET("/:id", handler.GetTaskByID)
	e.POST("/", handler.CreateTask)
	e.PUT("/:id", handler.UpdateTask)
	e.DELETE("/:id", handler.DeleteTask)
	log.Fatal(e.Start(":8080"))
}
