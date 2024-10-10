// main.go - Runs the GO server, database, and API, holding two handler functions for querying the database

package main

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"satellite-telemetry/src/api/database"
	"satellite-telemetry/src/api/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	database.InitDB()
	router := gin.Default()
	router.Use(cors.Default()) // Allow different ports to interact with each other

	// Define GET routes to be accessed by operators (with satellite ID and without it)
	router.GET("/telemetry/satellite/:id", getTelemetry) // with specified satellite ID
	router.GET("/telemetry/satellite", getTelemetry) // without specified satellite ID

	// Start the server
	if err := router.Run(":3000"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

// Returns a JSON of table rows by creating a query through building on the provided parameters
func getTelemetry(c *gin.Context) {

    idStr := c.Param("id") // Gets satellite ID from parameter
    var telemetryRecords []models.Telemetry
    var err error

    query := "1=1" // Base for adding conditions (makes adding AND CONDITION easier)
    params := []interface{}{} // Params to collect along the way

    // Case where satellite ID is provided
    if idStr != "" {
        satelliteID, err := strconv.Atoi(idStr)
        if err != nil { // Happens when satellitle ID is not a valid integer type
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid satellite ID"})
            return
        }
        // If valid, add satellite ID condition to the query and satelliteID to params
        query += " AND satellite_id = ?"
        params = append(params, satelliteID)
    }

    // Get the timestamp range from the query parameters
    startTimeStr := c.Query("start")
    endTimeStr := c.Query("end")

    // Case where startDate is provided
    if startTimeStr != "" {
        startTime, err := time.Parse(time.RFC3339, startTimeStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time"})
            return
        }
        // If valid, add start date condition to the query and start date to params
        query += " AND timestamp >= ?"
        params = append(params, startTime)
    }
    // Case where endDate is provided
    if endTimeStr != "" {
        endTime, err := time.Parse(time.RFC3339, endTimeStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end time"})
            return
        }
        // If valid, add end date condition to the query and end date to params
        query += " AND timestamp <= ?"
        params = append(params, endTime)
    }

    // Execute the query with the built-up parameters
    err = database.DB.Where(query, params...).Find(&telemetryRecords).Error
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve records"})
        return
    }

    // Return the resulting telemetry records
    c.JSON(http.StatusOK, telemetryRecords)
}
