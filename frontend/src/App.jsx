import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import Components
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import LandingPage from "./pages/LandingPage";
import CheckoutModal from "./components/CheckoutModal"; 
import AdminDashboard from "./AdminDashboard";
import CustomerDashboard from "./CustomerDashboard";
import AuthModal from "./AuthModal";

function App() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // --- AUTH STATE ---
  const [token, setToken] = useState(localStorage.getItem("user_token"));
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userId, setUserId] = useState(localStorage.getItem("user_id"));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper untuk menentukan kunci penyimpanan
  const getCartKey = () => {
    if (token && userId) return `cart_user_${userId}`;
    return "cart_guest";
  };
  
  // Lazy Load Cart
  const [cart, setCart] = useState(() => {
    const key = token && userId ? `cart_user_${userId}` : "cart_guest";
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  // Fungsi Ambil Produk
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/products");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error("Error Fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ PERBAIKAN 1: PANGGIL FETCH PRODUCTS DI SINI
  useEffect(() => {
    fetchProducts();
  }, []);

  // Effect: Load Cart saat ganti akun
  useEffect(() => {
    const key = getCartKey();
    const savedCart = localStorage.getItem(key);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [token, userId]);

  // Effect: Auto Save Cart
  useEffect(() => {
    const key = getCartKey();
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, token, userId]);

  // --- HANDLERS ---
  const addToCart = (product) => {
    const countInCart = cart.filter((item) => item.id === product.id).length;
    if (countInCart >= product.stock) {
      toast.error(`Stok habis!`, { icon: '✋', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      return;
    }
    setCart([...cart, product]);
    toast.success("Masuk keranjang!", { position: "bottom-center", style: { background: '#333', color: '#fff' } });
  };

  const decreaseCartItem = (product) => {
    const indexToRemove = cart.findIndex((item) => item.id === product.id);
    if (indexToRemove !== -1) {
      const newCart = [...cart];
      newCart.splice(indexToRemove, 1);
      setCart(newCart);
    }
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckoutClick = () => {
    if (!token) {
      toast.error("Silakan Login dulu!", { icon: '🔒' });
      setIsAuthModalOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const processFinalCheckout = async (formData) => {
    const { address, paymentMethod } = formData;
    const payload = {
      customer: "Member",
      address: address,
      payment_method: "Xendit Invoice",
      total: cart.reduce((t, i) => t + i.price, 0),
      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      })),
    };

    const toastId = toast.loading("Membuka halaman pembayaran...");

    try {
      const response = await fetch("http://localhost:8080/api/checkout", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss(toastId);
        
        // --- LOGIKA BARU UNTUK XENDIT ---
        // 1. Bersihkan Keranjang dulu (karena user akan pergi dari halaman)
        setCart([]);
        localStorage.removeItem(getCartKey());
        setIsCheckoutModalOpen(false);

        // 2. Redirect User ke Halaman Xendit
        window.location.href = data.payment_url; 
        // -------------------------------
        
      } else {
        throw new Error(data.error || "Gagal");
      }
    } catch (e) {
      toast.error(e.message, { id: toastId });
    }
  };

  const handleLoginSuccess = (newToken, newRole, newUserId) => {
    setToken(newToken);
    setRole(newRole);
    setUserId(newUserId);
    localStorage.setItem("user_token", newToken);
    localStorage.setItem("user_role", newRole);
    localStorage.setItem("user_id", newUserId);
    setIsAuthModalOpen(false);
    toast.success("Login Berhasil");
    if (newRole === 'admin') navigate("/admin");
    else navigate("/");
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setUserId(null);
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    toast.success("Logout Berhasil");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Toaster />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} onRemove={removeFromCart} onCheckout={handleCheckoutClick} />
      <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} cart={cart} total={cart.reduce((t, i) => t + i.price, 0)} onConfirm={processFinalCheckout} />

      <Routes>
        <Route path="/" element={
          <>
            <Navbar user={token} cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthModalOpen(true)} onLogout={handleLogout} goToProfile={() => navigate("/profile")} />
            <LandingPage 
                onAddToCart={addToCart} 
                onDecreaseItem={decreaseCartItem} 
                cart={cart} 
            />
          </>
        } />
        <Route path="/admin" element={token && role === 'admin' ? <AdminDashboard token={token} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? (
            <>
               <nav className="bg-white/80 backdrop-blur-md fixed top-0 w-full z-30 border-b px-6 py-4 flex justify-between shadow-sm">
                  <div onClick={() => navigate("/")} className="font-bold text-xl cursor-pointer">GoShop<span className="text-blue-600">.ID</span></div>
                  <button onClick={() => navigate("/")} className="text-sm font-bold text-blue-600 hover:underline">Kembali Belanja</button>
               </nav>
               <CustomerDashboard token={token} onLogout={handleLogout} />
            </>
          ) : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;