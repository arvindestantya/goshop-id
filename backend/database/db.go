package database

import (
	"fmt"
	"goshop-backend/models" // Sesuaikan dengan go.mod

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("goshop.db"), &gorm.Config{})
	if err != nil {
		panic("Gagal koneksi database!")
	}

	// Auto Migrate
	DB.AutoMigrate(&models.Product{}, &models.Order{}, &models.OrderItem{}, &models.User{})

	// Jalankan Seeder
	seedDatabase()
}

func seedDatabase() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		password, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin := models.User{Name: "Admin Toko", Email: "admin@goshop.com", Password: string(password), Role: "admin"}
		DB.Create(&admin)
		fmt.Println("Admin dibuat: admin@goshop.com / admin123")
	}
}
