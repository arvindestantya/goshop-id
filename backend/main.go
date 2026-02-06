package main

import (
	"fmt"
	"time"

	"goshop-backend/controllers" // <-- Panggil controller
	"goshop-backend/database"    // <-- Panggil database
	"goshop-backend/middleware"  // <-- Panggil middleware

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load Env & Database
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: .env file not found")
	}
	database.Connect() // Koneksi database ada di sini sekarang

	// 2. Setup Gin
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	// 3. Routing
	// Public
	r.POST("/api/register", controllers.RegisterHandler)
	r.POST("/api/login", controllers.LoginHandler)
	r.GET("/api/products", controllers.GetProducts)

	// Checkout (Perlu Login)
	r.POST("/api/checkout", middleware.AuthMiddleware(), controllers.CreateOrder)

	// Customer Area
	customer := r.Group("/api/my")
	customer.Use(middleware.AuthMiddleware())
	{
		customer.GET("/orders", controllers.GetMyOrders)
	}

	// Admin Area
	admin := r.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		admin.POST("/products", controllers.CreateProduct)
		admin.DELETE("/products/:id", controllers.DeleteProduct)
		admin.GET("/orders", controllers.GetAllOrders)
		admin.PUT("/orders/:id/status", controllers.UpdateOrderStatus)
	}

	r.Run(":8080")
}
