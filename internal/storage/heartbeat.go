package storage

import (
	"log"
	"time"
)

type Heartbeat struct {
	ID        int64     `gorm:"primaryKey"`
	Timestamp time.Time `gorm:"not null"`
}

func (s *PostgresStore) SendHeartbeat() error {
	Heartbeat := Heartbeat{
		Timestamp: time.Now(),
	}

	if err := s.DB.Create(&Heartbeat).Error; err != nil {
		log.Printf("Error creating heartbeat: %v", err)

		return err
	}
	return nil
}

func (s *PostgresStore) StartHeartbeat() {
	ticker := time.NewTicker(24 * time.Hour)

	go func() {
		for range ticker.C {
			if err := s.SendHeartbeat(); err != nil {
				log.Println("Failed to send heartbeat:", err)
			} else {
				log.Println("Heartbeat sent successfully")
			}
		}
	}()
	if err := s.SendHeartbeat(); err != nil {
		log.Println("Failed to send initial heartbeat:", err)
	}
}
