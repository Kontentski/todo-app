package router

import (
	"github.com/Kontentski/todo-app/internal/handlers"
	customMiddleware "github.com/Kontentski/todo-app/internal/middleware"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Router struct {
	e       *echo.Echo
	handler *handlers.TodoHandler
	jwtSecret string
}

func NewRouter(handler *handlers.TodoHandler, jwtSecret string) *Router {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	return &Router{
		e:       e,
        handler: handler,
        jwtSecret: jwtSecret,
	}
}


func (r *Router) SetupRoutes() {
	r.e.Static("/", "./www")

	// JWT Auth middleware for API routes
	api := r.e.Group("/api/v2")
	api.Use(customMiddleware.JWTAuth(r.jwtSecret))

	// API routes
	api.GET("/tasks", r.handler.GetTasks)
	api.GET("/tasks/:id", r.handler.GetTaskByID)
	api.POST("/tasks", r.handler.CreateTask)
	api.PUT("/tasks/:id", r.handler.UpdateTask)
	api.DELETE("/tasks/:id", r.handler.DeleteTask)
	api.DELETE("/tasks/delete-checked", r.handler.DeleteCheckedTasks)
}

func (r *Router) Start(port string) error {
	return r.e.Start(":" + port)
}