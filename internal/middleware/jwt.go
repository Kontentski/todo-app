package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

func JWTAuth(jwtSecret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
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
	}
}
