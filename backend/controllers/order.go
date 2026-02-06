package controllers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"goshop-backend/database"
	"goshop-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/xendit/xendit-go/v6"
	"github.com/xendit/xendit-go/v6/invoice"
)

// Admin: Get All Orders
func GetAllOrders(c *gin.Context) {
	var orders []models.Order
	if err := database.DB.Preload("Items").Order("created_at desc").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal ambil data"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// Admin: Update Status
func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
		return
	}

	order.Status = input.Status
	database.DB.Save(&order)
	c.JSON(http.StatusOK, gin.H{"message": "Status diperbarui", "data": order})
}

// User: Get My Orders
func GetMyOrders(c *gin.Context) {
	userID, _ := c.Get("userID")
	var orders []models.Order
	database.DB.Preload("Items").Where("user_id = ?", userID).Order("created_at desc").Find(&orders)
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// User: Checkout & Xendit
func CreateOrder(c *gin.Context) {
	var input struct {
		Address       string             `json:"address"`
		PaymentMethod string             `json:"payment_method"`
		Total         float64            `json:"total"`
		Items         []models.OrderItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	var user models.User

	if err := database.DB.First(&user, userID).Error; err != nil {
		user.Name = "Customer"
	}

	order := models.Order{
		UserID:        uint(userID.(float64)),
		Customer:      user.Name,
		Address:       input.Address,
		PaymentMethod: input.PaymentMethod,
		Total:         input.Total,
		Status:        "Pending",
		Items:         input.Items,
		CreatedAt:     time.Now(),
	}
	database.DB.Create(&order)

	// --- XENDIT LOGIC ---
	apiKey := os.Getenv("XENDIT_API_KEY")
	xenditClient := xendit.NewClient(apiKey)

	externalID := fmt.Sprintf("ORDER-%d-%d", order.ID, time.Now().Unix())
	createInvoiceRequest := *invoice.NewCreateInvoiceRequest(externalID, input.Total)
	createInvoiceRequest.SetDescription("Pembayaran GoShop #" + externalID)
	createInvoiceRequest.SetInvoiceDuration("86400")
	createInvoiceRequest.SetSuccessRedirectUrl("http://localhost:5173/profile")

	resp, _, err := xenditClient.InvoiceApi.CreateInvoice(context.Background()).
		CreateInvoiceRequest(createInvoiceRequest).
		Execute()

	if err != nil {
		fmt.Printf("Error Xendit: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pembayaran"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Order created",
		"order_id":    order.ID,
		"payment_url": resp.InvoiceUrl,
	})
}
