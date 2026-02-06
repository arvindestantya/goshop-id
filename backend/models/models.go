package models

import (
	"time"
)

type Product struct {
	ID    uint    `json:"id" gorm:"primaryKey"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Image string  `json:"image"`
	Stock int     `json:"stock"`
}

type Order struct {
	ID            uint        `json:"id" gorm:"primaryKey"`
	UserID        uint        `json:"user_id"`
	Customer      string      `json:"customer"`
	Total         float64     `json:"total"`
	Status        string      `json:"status" gorm:"default:'Pending'"`
	Address       string      `json:"address"`
	PaymentMethod string      `json:"payment_method"`
	Items         []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	CreatedAt     time.Time   `json:"created_at"`
}

type OrderItem struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	OrderID   uint    `json:"order_id"`
	ProductID uint    `json:"product_id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
}

type User struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-"`
	Role     string `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}
