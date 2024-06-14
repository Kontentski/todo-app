package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Kontentski/todo-app/internal/handlers"
	"github.com/Kontentski/todo-app/internal/storage"
	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	store, err := storage.NewPostgresStorage(dsn)
	if err != nil {
		log.Fatal("failed to connect to database", err)
	}

	handler := &handlers.TodoHandler{Storage: store}
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Static("/", "../../")

	// JWT Auth middleware for API routes
	api := e.Group("/api")
	api.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, "missing authorization header")
			}

			if !strings.HasPrefix(authHeader, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, "invalid authorization header")
			}

			tokenString := authHeader[len("Bearer "):]
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil {
				return c.JSON(http.StatusUnauthorized, err.Error())
			}

			if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
				// Check token expiration
				if int64(claims["exp"].(float64)) < time.Now().Unix() {
					return c.JSON(http.StatusUnauthorized, "token expired")
				}
				c.Set("user_id", claims["sub"])
				userMetadata, ok := claims["user_metadata"].(map[string]interface{})
				if !ok {
					return c.JSON(http.StatusUnauthorized, "user_metadata missing in token")
				}

				if name, ok := userMetadata["name"].(string); ok {
					c.Set("name", name)
				} else {
					return c.JSON(http.StatusUnauthorized, "name claim missing in user_metadata")
				}

			} else {
				return c.JSON(http.StatusUnauthorized, "invalid token")
			}

			return next(c)
		}
	})

	// API routes
	api.GET("/tasks", handler.GetTasks)
	api.GET("/tasks/:id", handler.GetTaskByID)
	api.POST("/tasks", handler.CreateTask)
	api.PUT("/tasks/:id", handler.UpdateTask)
	api.DELETE("/tasks/:id", handler.DeleteTask)
	api.DELETE("/tasks/delete-checked", handler.DeleteCheckedTasks)

	log.Fatal(e.Start(":8080"))
}
