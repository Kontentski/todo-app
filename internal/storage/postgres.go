package storage

import (
	"errors"
	"log"

	"github.com/Kontentski/todo-app/internal/models"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

type PostgresStore struct {
	DB *gorm.DB
}

func NewPostgresStorage(connectionString string) (*PostgresStore, error) {
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",    // schema name
			SingularTable: false, // use singular table name, struct `User` -> table `user`
		},
	})
	if err != nil {
		return nil, err
	}

	// Log current tables
	var tables []string
	db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").Scan(&tables)
	log.Println("Current tables in the database:", tables)
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
	s.DB.Order("id asc").Find(&todos)
	return todos
}

func (s *PostgresStore) GetByUserID(userID string) []models.Todo {
	var todos []models.Todo
	s.DB.Where("user_id = ?", userID).Order("id asc").Find(&todos)
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

func (s *PostgresStore) GetByIDAndUserID(id int64, userID string) (*models.Todo, error) {
	var todo models.Todo
	result := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&todo)
	if result.Error != nil {
		return nil, result.Error
	}
	return &todo, nil
}

func (s *PostgresStore) Update(id int64, updated models.Todo, userID string) error {
	result := s.DB.Model(&models.Todo{}).Select("title", "complete").Where("id = ? AND user_id = ?", id, userID).Updates(updated)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("task not found or not authorized")
	}
	return nil
}

func (s *PostgresStore) Delete(id int64, userID string) error {
	result := s.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Todo{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("task not found or not authorized")
	}
	return nil
}
