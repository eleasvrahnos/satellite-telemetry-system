// telemetry.go - Defines the Telemetry struct for the database

package models

import "time"

// Creating outline of Telemetry struct - https://gobyexample.com/json
type Telemetry struct {
	ID             uint 		`gorm:"column:id"`
	Timestamp      time.Time	`gorm:"column:timestamp"`
	SatelliteID    int     		`gorm:"column:satellite_id"`
	Temperature    float32 		`gorm:"column:temperature"`
	BatteryVoltage float32 		`gorm:"column:battery_voltage"`
	Altitude       float32 		`gorm:"column:altitude"`
}

// GORM uses plural naming conventions (found that out after duplicate tables were being created...)
// Correct table name is explicitly defined here - https://gorm.io/docs/conventions.html#Pluralized-Table-Name
func (Telemetry) TableName() string {
    return "telemetry"
}