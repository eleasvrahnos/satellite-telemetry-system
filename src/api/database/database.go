// database.go - Allows connection to the PostgreSQL database

package database

import (
	"fmt"
	"log"
	"os"
	"satellite-telemetry/src/api/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB // Declare DB variable with GORM

func InitDB() {
	var err error
	
	// Load environment variables from .env file - https://stackoverflow.com/questions/18771569/avoid-checking-if-error-is-nil-repetition
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Define environment variables
	host := os.Getenv("HOST")
	port := os.Getenv("PORT")
	user := os.Getenv("USER")
	dbname := os.Getenv("DB_NAME")
	password := os.Getenv("PASSWORD")

	// Create the connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable", host, port, user, dbname, password)

	// Open the database connection - https://gorm.io/docs/connecting_to_the_database.html
	DB, err = gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	// Auto-migrate the models
	if err := DB.AutoMigrate(&models.Telemetry{}); err != nil {
		log.Fatalf("Failed to migrate models: %v", err)
	}

	log.Println("Database connected and telemetry table migrated successfully.") // Printing confirmation of database connection and model integration
}
