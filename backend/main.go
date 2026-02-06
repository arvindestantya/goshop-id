package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/xendit/xendit-go/v6"
	"github.com/xendit/xendit-go/v6/invoice"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// --- MODELS ---
type Product struct {
	ID    uint    `json:"id" gorm:"primaryKey"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Image string  `json:"image"`
	Stock int     `json:"stock"` // <--- KOLOM BARU
}

type Order struct {
	ID       uint    `json:"id" gorm:"primaryKey"`
	UserID   uint    `json:"user_id"`
	Customer string  `json:"customer"`
	Total    float64 `json:"total"`
	Status   string  `json:"status" gorm:"default:'Pending'"`

	// --- KOLOM BARU ---
	Address       string `json:"address"`        // Alamat Pengiriman
	PaymentMethod string `json:"payment_method"` // COD / Transfer / QRIS
	// ------------------

	Items     []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	CreatedAt time.Time   `json:"created_at"`
}

type OrderItem struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	OrderID   uint    `json:"order_id"`
	ProductID uint    `json:"product_id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
}

// Model User Baru
type User struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Name     string `json:"name"` // <-- TAMBAHAN: Nama User
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-"`
	Role     string `json:"role"` // 'admin' atau 'customer'
}

// Struktur Login Request
type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

var db *gorm.DB
var SECRET_KEY = []byte("rahasia_negara_goshop") // Di production, taruh di ENV

// --- FITUR ADMIN: LIHAT SEMUA ORDER ---
func getAllOrders(c *gin.Context) {
	var orders []Order
	// Preload Items agar detail barang ikut terambil
	if err := db.Preload("Items").Order("created_at desc").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal ambil data"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// --- FITUR ADMIN: UPDATE STATUS ORDER ---
func updateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status"` // Pending, Diproses, Dikirim, Selesai, Batal
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order Order
	if err := db.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
		return
	}

	// Update status
	order.Status = input.Status
	db.Save(&order)

	c.JSON(http.StatusOK, gin.H{"message": "Status diperbarui", "data": order})
}

func main() {
	var err error
	db, err = gorm.Open(sqlite.Open("goshop.db"), &gorm.Config{})
	if err != nil {
		panic("Gagal koneksi database!")
	}

	db.AutoMigrate(&Product{}, &Order{}, &OrderItem{}, &User{})
	seedDatabase() // Buat produk & akun admin default

	r := gin.Default()

	// CORS Setup (PENTING: Allow Authorization header)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	// --- PUBLIC ENDPOINTS ---
	r.POST("/api/register", registerHandler) // <-- BARU
	r.POST("/api/login", loginHandler)
	r.GET("/api/products", getProducts)

	// CHECKOUT (Sekarang support Auth token opsional)
	r.POST("/api/checkout", authMiddleware(), createOrder)

	// AREA CUSTOMER (Butuh Login)
	customer := r.Group("/api/my")
	customer.Use(authMiddleware())
	{
		customer.GET("/orders", getMyOrders) // <-- BARU: Riwayat Belanja Saya
	}

	// --- PROTECTED ENDPOINTS (Harus Login) ---
	admin := r.Group("/api/admin")
	admin.Use(authMiddleware())
	{
		admin.POST("/products", createProduct)
		// --- TAMBAHAN BARU ---
		admin.PUT("/orders/:id/status", updateOrderStatus) // Ganti status
		admin.DELETE("/products/:id", deleteProduct)       // Hapus produk
		admin.GET("/orders", getAllOrders)                 // Admin lihat semua order
		admin.PUT("/orders/:id", updateOrderStatus)
	}

	r.Run(":8080")
}

// --- HANDLERS ---

func loginHandler(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// Cek Password Hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// Buat Token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, _ := token.SignedString(SECRET_KEY)
	c.JSON(http.StatusOK, gin.H{
		"token":   tokenString,
		"role":    user.Role,
		"user_id": user.ID,
		"name":    user.Name,
		"email":   user.Email,
	})
}

func getProducts(c *gin.Context) {
	var products []Product
	db.Find(&products)
	c.JSON(http.StatusOK, gin.H{"data": products})
}

func createProduct(c *gin.Context) {
	// 1. Ambil Data Form (bukan JSON lagi)
	name := c.PostForm("name")
	priceStr := c.PostForm("price")

	// Konversi harga dari string ke float
	price, _ := strconv.ParseFloat(priceStr, 64)

	// 2. Ambil File Gambar
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gambar wajib diupload"})
		return
	}

	// 3. Simpan File ke Folder 'uploads'
	// Kita buat nama file unik pakai timestamp agar tidak bentrok
	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), file.Filename)
	filepath := "./uploads/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan gambar"})
		return
	}

	// 4. Buat URL Gambar agar bisa diakses Frontend
	// Hasil: http://localhost:8080/uploads/170999-sepatu.jpg
	imageURL := "http://localhost:8080/uploads/" + filename

	// 5. Simpan ke Database
	product := Product{Name: name, Price: price, Image: imageURL}
	db.Create(&product)

	c.JSON(http.StatusOK, gin.H{"data": product})
}

// Handler Baru: Lihat Orderan (Khusus Admin)
func getOrders(c *gin.Context) {
	var orders []Order
	// Preload Items agar detail barangnya ikut terambil
	db.Preload("Items").Order("created_at desc").Find(&orders)
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// --- MIDDLEWARE (SATPAM) ---
// Middleware: WAJIB Login (Dipakai di Admin & Customer Dashboard)
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ada"})
			return
		}

		// Format header: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Format token salah"})
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return SECRET_KEY, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			return
		}

		// --- BAGIAN INI YANG KEMARIN HILANG/BELUM ADA ---
		// Kita harus ekstrak ID dari token dan simpan ke Context
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("userID", claims["sub"]) // Simpan ID user
			c.Set("role", claims["role"])  // Simpan Role user
		}
		// ------------------------------------------------

		c.Next()
	}
}

// --- SEEDER (ISI DATA AWAL) ---
func seedDatabase() {
	var count int64
	db.Model(&User{}).Count(&count)
	if count == 0 {
		// Buat Admin Default
		password, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin := User{Email: "admin@goshop.com", Password: string(password), Role: "admin"}
		db.Create(&admin)
		fmt.Println("Admin dibuat: admin@goshop.com / admin123")
	}
	// (Kode seed product lama boleh dihapus atau dibiarkan)
}

// Handler: Hapus Produk
func deleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus produk"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

func registerHandler(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash Password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user := User{Name: input.Name, Email: input.Email, Password: string(hashedPassword), Role: "customer"}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah terdaftar!"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Registrasi berhasil! Silakan login."})
}

// 2. Get My Orders (Khusus User yang Login)
func getMyOrders(c *gin.Context) {
	userID, _ := c.Get("userID") // Diambil dari token
	var orders []Order
	db.Preload("Items").Where("user_id = ?", userID).Order("created_at desc").Find(&orders)
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// 3. Update Create Order (Bisa deteksi User Login)
func createOrder(c *gin.Context) {
	// 1. Terima data dari Frontend
	var input struct {
		Address       string      `json:"address"`
		PaymentMethod string      `json:"payment_method"`
		Total         float64     `json:"total"`
		Items         []OrderItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	var user User
	// Cari data user berdasarkan userID yang sedang login
	if err := db.First(&user, userID).Error; err != nil {
		// Jika user tidak ketemu (jarang terjadi), pakai default
		user.Name = "Customer"
	}
	// --------------------------------------------------------

	// 3. Simpan Order dengan Nama Asli
	order := Order{
		UserID:        uint(userID.(float64)),
		Customer:      user.Name,
		Address:       input.Address,
		PaymentMethod: input.PaymentMethod,
		Total:         input.Total,
		Status:        "Pending", // Status awal
		Items:         input.Items,
		CreatedAt:     time.Now(),
	}
	db.Create(&order)

	// 3. --- LOGIKA XENDIT INVOICE ---
	// Inisialisasi Client
	// GANTI DENGAN SECRET KEY DARI DASHBOARD XENDIT TADI!
	xenditClient := xendit.NewClient("xnd_development_73owz0orqBnBMO0Eo9CnWXUafevzN0DQwnaSjZqLYrcPEfvmO2TZ5pEFUqDJCHp")

	// Siapkan Data Invoice
	externalID := fmt.Sprintf("ORDER-%d-%d", order.ID, time.Now().Unix())
	amount := float64(input.Total)

	createInvoiceRequest := *invoice.NewCreateInvoiceRequest(externalID, amount)
	createInvoiceRequest.SetDescription("Pembayaran GoShop #" + externalID)
	createInvoiceRequest.SetInvoiceDuration("86400") // <--- INI BENAR (String)
	// (Opsional) Redirect setelah sukses bayar balik ke web kita
	successRedirectURL := "http://localhost:5173/profile"
	createInvoiceRequest.SetSuccessRedirectUrl(successRedirectURL)

	// Kirim ke Xendit
	resp, _, err := xenditClient.InvoiceApi.CreateInvoice(context.Background()).
		CreateInvoiceRequest(createInvoiceRequest).
		Execute()

	if err != nil {
		fmt.Printf("Error creating invoice: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pembayaran"})
		return
	}
	// -------------------------

	// 4. Kirim Link Pembayaran ke Frontend
	c.JSON(http.StatusOK, gin.H{
		"message":     "Order created",
		"order_id":    order.ID,
		"payment_url": resp.InvoiceUrl, // <--- Frontend akan redirect ke sini
	})
}

// --- MIDDLEWARE BARU ---

// Middleware yang TIDAK memaksa login, tapi mengecek kalau ada token
func authMiddlewareOptional() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && len(strings.Split(authHeader, " ")) == 2 {
			tokenString := strings.Split(authHeader, " ")[1]
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return SECRET_KEY, nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					c.Set("userID", claims["sub"])
					c.Set("role", claims["role"])
				}
			}
		}
		c.Next()
	}
}
