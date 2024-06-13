package handlers

import (
	"net/http"
	"strconv"

	"github.com/Kontentski/todo-app/internal/models"
	"github.com/Kontentski/todo-app/internal/storage"
	"github.com/labstack/echo/v4"
)

type TodoHandler struct {
	Storage *storage.PostgresStore
}

func (h *TodoHandler) GetTasks(c echo.Context) error {
	userID := c.Get("user_id").(string)
	todos := h.Storage.GetByUserID(userID)
	return c.JSON(http.StatusOK, todos)
}

func (h *TodoHandler) GetTaskByID(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid task ID")
	}
	userID := c.Get("user_id").(string)
	todo, err := h.Storage.GetByIDAndUserID(id, userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) CreateTask(c echo.Context) error {
	var todo models.Todo
	if err := c.Bind(&todo); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}
	todo.UserID = c.Get("user_id").(string)
	createdTask := h.Storage.Create(todo)
	return c.JSON(http.StatusCreated, createdTask)
}

func (h *TodoHandler) UpdateTask(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid task ID")
	}
	var updtodo models.Todo
	if err := c.Bind(&updtodo); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}
	userID := c.Get("user_id").(string)
	updtodo.UserID = userID
	err = h.Storage.Update(id, updtodo, userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, updtodo)
}

func (h *TodoHandler) DeleteTask(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid task ID")
	}
	userID := c.Get("user_id").(string)
	err = h.Storage.Delete(id, userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *TodoHandler) DeleteCheckedTasks(c echo.Context) error {
	userID := c.Get("user_id").(string)
    err := h.Storage.DeleteChecked(userID)
    if err!= nil {
        return c.JSON(http.StatusNotFound, err.Error())
    }
    return c.NoContent(http.StatusNoContent)
}