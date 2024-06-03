package storage

import (
	"errors"
	"log"

	"github.com/Kontentski/todo-app/internal/models"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresStore struct {
	DB *gorm.DB
}

func NewPostgresStorage(connectionString string) (*PostgresStore, error) {
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	err = db.AutoMigrate(&models.Todo{})
	if err != nil {
		return nil, err
	}

	log.Println("Database connection and migration successful")
	return &PostgresStore{DB: db}, nil
}

func (s *PostgresStore) Create(todo models.Todo) models.Todo {
	s.DB.Create(&todo)
	return todo
}

func (s *PostgresStore) GetAll() []models.Todo {
	var todos []models.Todo
	s.DB.Find(&todos)
	return todos
}

func (s *PostgresStore) GetByID(id int64) (*models.Todo, error) {
	var todo models.Todo
	result := s.DB.First(&todo, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &todo, nil
}

func (s *PostgresStore) Update(id int64, updated models.Todo) error {
	result := s.DB.Model(&models.Todo{}).Where("id = ?", id).Select("title","completed").Updates(updated)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("task not found")
	}
	return nil
}

func (s *PostgresStore) Delete(id int64) error {
	result := s.DB.Delete(&models.Todo{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("task not found")
	}
	return nil
}
