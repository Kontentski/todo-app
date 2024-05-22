package handlers

import (
	"net/http"
	"strconv"

	"github.com/Kontentski/todo-app/internal/models"
	"github.com/Kontentski/todo-app/internal/storage"
	"github.com/labstack/echo/v4"
)

type TodoHandler struct {
	Storage *storage.MemoryStore
}

func (h *TodoHandler) GetTasks(c echo.Context) error {
	todos := h.Storage.GetAll()
	return c.JSON(http.StatusOK, todos)
}

func (h *TodoHandler) GetTaskByID(c echo.Context) error {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err!= nil {
        return c.JSON(http.StatusBadRequest, "Invalid task ID")
    }
    todo, err := h.Storage.GetByID(id)
	if err!= nil {
        return c.JSON(http.StatusNotFound, err.Error())
    }
    return c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) CreateTask(c echo.Context) error {
	var todo models.Todo
	if err := c.Bind(&todo); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
    }
	createdTask := h.Storage.Create(todo)
	return c.JSON(http.StatusCreated, createdTask)
}

func (h *TodoHandler) UpdateTask(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err!= nil {
        return c.JSON(http.StatusBadRequest, "Invalid task ID")
    }
    var updtodo models.Todo
    if err := c.Bind(&updtodo); err != nil {
        return c.JSON(http.StatusBadRequest, err.Error())
    }
	err = h.Storage.Update(id, updtodo)
	if err!= nil {
        return c.JSON(http.StatusNotFound, err.Error())
    }
    return c.JSON(http.StatusOK, updtodo)
}

func (h *TodoHandler) DeleteTask(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err!= nil {
        return c.JSON(http.StatusBadRequest, "Invalid task ID")
    }
    err = h.Storage.Delete(id)
    if err!= nil {
        return c.JSON(http.StatusNotFound, err.Error())
    }
    return c.NoContent(http.StatusNoContent)
}