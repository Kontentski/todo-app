package models

import (
	"time"
)

type Todo struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Complete  bool      `gorm:"default:false" json:"complete"`
	UserID    string    `gorm:"not null" json:"userid"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
