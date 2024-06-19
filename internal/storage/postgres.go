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
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  connectionString,
		PreferSimpleProtocol: true, // Use simple protocol, avoiding prepared statements
	}), &gorm.Config{
        NamingStrategy: schema.NamingStrategy{
            TablePrefix:   "",    // schema name
            SingularTable: false, // use singular table name, struct `User` -> table `user`
        },
    })
    if err != nil {
        return nil, err
    }

    log.Println("Database connection successful")
    return &PostgresStore{DB: db}, nil
}

func (s *PostgresStore) Create(todo models.Todo) (*models.Todo, error) {
    if err := s.DB.Create(&todo).Error; err != nil {
        log.Printf("Error creating todo: %v", err)
        return nil, err
    }
    return &todo, nil
}


func (s *PostgresStore) GetAll() []models.Todo {
	var todos []models.Todo
	s.DB.Order("created_at asc").Find(&todos)
	return todos
}

func (s *PostgresStore) GetByUserID(userID string) []models.Todo {
	var todos []models.Todo
	s.DB.Where("user_id = ?", userID).Order("created_at asc").Find(&todos)
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

func (s *PostgresStore) DeleteChecked(userId string) error {
	result := s.DB.Where("complete = true AND user_id =?", userId).Delete(&models.Todo{})
    if result.Error!= nil {
        return result.Error
    }
    if result.RowsAffected == 0 {
        return errors.New("task not found or not authorized")
    }
    return nil
}
