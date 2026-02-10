package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"goshop-backend/database"
	"goshop-backend/models"

	"github.com/gin-gonic/gin"
)

func GetProducts(c *gin.Context) {
	// Ambil query param "?search=" dari URL (kalau ada)
	search := c.Query("search")
	category := c.Query("category")

	var products []models.Product

	query := database.DB

	// Jika ada search, tambahkan filter WHERE
	if search != "" {
		// ILIKE untuk PostgreSQL, kalau SQLite pakai LIKE saja sudah case-insensitive biasanya
		// Kita pakai LIKE %...% agar mencari teks di tengah kata juga
		query = query.Where("name LIKE ?", "%"+search+"%")
	}

	if category != "" && category != "Semua" {
		query = query.Where("category = ?", category)
	}

	query.Find(&products)
	c.JSON(http.StatusOK, gin.H{"data": products})
}

func CreateProduct(c *gin.Context) {
	name := c.PostForm("name")
	priceStr := c.PostForm("price")
	category := c.PostForm("category")
	price, _ := strconv.ParseFloat(priceStr, 64)

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gambar wajib diupload"})
		return
	}

	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), file.Filename)
	filepath := "./uploads/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan gambar"})
		return
	}

	imageURL := "http://localhost:8080/uploads/" + filename
	product := models.Product{Name: name, Price: price, Image: imageURL, Category: category, Stock: 10}
	database.DB.Create(&product)

	c.JSON(http.StatusOK, gin.H{"data": product})
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus produk"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}
