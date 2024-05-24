package storage

import (
	"github.com/Kontentski/todo-app/internal/models"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresStore struct {
	DB *gorm.DB
}

func NewPostgreStore(connectionString string) (*PostgresStore, error) {
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})
	if err != nil {
		return nil, err
    }
	db.AutoMigrate(&models.Todo{})
	return &PostgresStore{DB: db}, nil
}

func (s *PostgresStore) Create(todo models.Todo) models.Todo {
}
