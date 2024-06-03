package storage

import (
	"errors"
	"sync"

	"github.com/Kontentski/todo-app/internal/models"
)

//depricated ;)

type MemoryStore struct {
	mu     sync.Mutex
	todos  map[int64]*models.Todo
	nextID int64
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		todos:  make(map[int64]*models.Todo),
		nextID: 1,
	}
}

func (s *MemoryStore) Create(todo models.Todo) models.Todo {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo.ID = s.nextID
	s.nextID++
	s.todos[todo.ID] = &todo
	return todo
}

func (s *MemoryStore) GetAll() []models.Todo {
	s.mu.Lock()
	defer s.mu.Unlock()

	todos := make([]models.Todo, 0, len(s.todos))
	for _, todo := range s.todos {
		todos = append(todos, *todo)
	}
	return todos
}

func (s *MemoryStore) GetByID(id int64) (*models.Todo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, ok := s.todos[id]
	if !ok {
		return &models.Todo{}, errors.New("task not found")
	}
	return todo, nil
}

func (s *MemoryStore) Update(id int64, updated models.Todo) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, ok := s.todos[id]
	if !ok {
		return errors.New("task not found")
	}
	if updated.Title != "" {
		todo.Title = updated.Title
	}
	todo.Complete = updated.Complete
	return nil
}

func (s *MemoryStore) Delete(id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, ok := s.todos[id]
	if !ok {
		return errors.New("task not found")
	}
	delete(s.todos, id)
	return nil
}
