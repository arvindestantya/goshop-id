import { useState, useEffect } from "react";
import { Plus, Minus, ShoppingBag, Search, Filter } from "lucide-react";
import { formatRupiah } from "../utils/format";
import toast from "react-hot-toast";

export default function LandingPage({ onAddToCart, onDecreaseItem, cart }) {
  // --- STATE LOKAL ---
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [keyword, setKeyword] = useState(""); 

  const categories = ["Semua", "Elektronik", "Fashion", "Aksesoris"];

  // --- 1. FUNGSI SMART FETCH (Server-Side) ---
  // Menggabungkan filter Search & Category sekaligus
  const fetchProducts = async (searchVal = keyword, catVal = activeCategory) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Jika ada search, tambahkan ke parameter
      if (searchVal) params.append("search", searchVal);
      
      // Jika kategori bukan "Semua", tambahkan ke parameter
      if (catVal && catVal !== "Semua") params.append("category", catVal);

      // Contoh hasil URL: /api/products?search=sepatu&category=Fashion
      const url = `http://localhost:8080/api/products?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error("Gagal ambil produk:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EFFECT: AUTO FETCH SAAT KATEGORI BERUBAH ---
  useEffect(() => {
    // Kita panggil fetch dengan keyword saat ini dan kategori yang baru dipilih
    fetchProducts(keyword, activeCategory);
  }, [activeCategory]); // <- Jalan setiap activeCategory berubah

  // Handler saat user menekan Enter di kolom search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(keyword, activeCategory);
  };

  const getQtyInCart = (productId) => {
    return cart ? cart.filter(item => item.id === productId).length : 0;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* 1. HERO SECTION (TIDAK BERUBAH) */}
      <section className="relative bg-blue-600 overflow-hidden pt-28 pb-20 px-6 sm:px-12 lg:px-20 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl mix-blend-overlay"></div>
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2 space-y-6 animate-in slide-in-from-left duration-700">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-500/50 border border-blue-400 text-sm font-medium backdrop-blur-sm">
                    🚀 Promo Spesial
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                    Belanja Gadget & <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-white">
                        Fashion Kekinian
                    </span>
                </h1>
                <p className="text-blue-100 text-lg max-w-lg">
                    Dapatkan produk original dengan garansi resmi dan pengiriman super cepat.
                </p>
                <button onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-blue-600 px-8 py-3.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-gray-100 transition transform hover:-translate-y-1">
                    Mulai Belanja
                </button>
            </div>
            
            <div className="md:w-1/2 flex justify-center md:justify-end animate-in slide-in-from-right duration-700 delay-100">
                <div className="relative w-full max-w-md aspect-square bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] p-4 border border-white/20 backdrop-blur-sm shadow-2xl">
                    <img 
                        src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                        alt="Hero Product" 
                        className="w-full h-full object-cover rounded-[2.5rem] shadow-inner"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <main id="catalog" className="max-w-7xl mx-auto px-6 py-12">
        
        {/* CONTROLS: SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 sticky top-24 z-30 bg-gray-50/95 backdrop-blur-sm py-4 rounded-xl px-2">
            
            {/* Tabs Kategori */}
            <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)} // State berubah -> useEffect jalan -> Fetch API
                        className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                            activeCategory === cat
                            ? "bg-blue-600 text-white shadow-md transform scale-105"
                            : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Input Search (SERVER SIDE) */}
            <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari produk & tekan Enter..." 
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition bg-white shadow-sm"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </form>
        </div>

        {/* 3. PRODUCT GRID */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-96 animate-pulse"></div>
             ))}
           </div>
        ) : products.length === 0 ? (
            <div className="text-center py-20">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="text-gray-400" size={40}/>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Produk tidak ditemukan</h3>
                <p className="text-gray-500">
                    {keyword 
                        ? `Tidak ada hasil untuk "${keyword}" di kategori ${activeCategory}` 
                        : `Belum ada produk di kategori ${activeCategory}.`}
                </p>
                {(keyword || activeCategory !== "Semua") && (
                     <button 
                        onClick={() => {
                            setKeyword(""); 
                            setActiveCategory("Semua");
                        }} 
                        className="text-blue-600 font-bold mt-2 hover:underline"
                     >
                        Reset Filter
                     </button>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
                {/* PERUBAHAN PENTING:
                   Looping langsung ke 'products', bukan 'filteredProducts'.
                   Data yang ada di sini sudah difilter oleh Backend.
                */}
                {products.map((product) => {
                    const qty = getQtyInCart(product.id);
                    const isOutOfStock = product.stock === 0;

                    return (
                    <div key={product.id} className={`group bg-white rounded-3xl p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border ${qty > 0 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                        
                        {/* Image Container */}
                        <div className="relative overflow-hidden rounded-2xl mb-5 bg-gray-100 aspect-[4/3]">
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                                {isOutOfStock && (
                                    <span className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1 rounded-lg font-bold text-xs shadow-lg">STOK HABIS</span>
                                )}
                                {qty > 0 && (
                                    <span className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-lg font-bold text-xs shadow-lg flex items-center gap-1">
                                        <ShoppingBag size={12}/> {qty} item
                                    </span>
                                )}
                            </div>

                            <img 
                                src={product.image} 
                                alt={product.name}
                                className={`w-full h-full object-cover transition duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                            />
                            
                            {!isOutOfStock && (
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => onAddToCart(product)} className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition duration-300 hover:bg-blue-600 hover:text-white">
                                        + Tambah Cepat
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-blue-600 transition">{product.name}</h3>
                            <p className="font-extrabold text-xl text-gray-900 tracking-tight">{formatRupiah(product.price)}</p>

                            <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-gray-100 mt-3">
                                <span className={`${product.stock < 5 ? 'text-red-500' : 'text-green-600'} flex items-center gap-1`}>
                                    <div className={`w-2 h-2 rounded-full ${product.stock < 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                    Stok: {product.stock}
                                </span>
                                {qty > 0 && product.stock - qty > 0 && (
                                    <span className="text-gray-400">Sisa {product.stock - qty}</span>
                                )}
                            </div>
                            
                            <div className="pt-3">
                                {qty > 0 ? (
                                    <div className="flex items-center justify-between bg-blue-50 rounded-xl p-1 border border-blue-100">
                                        <button onClick={() => onDecreaseItem(product)} className="w-9 h-9 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-500 transition"><Minus size={16} strokeWidth={3} /></button>
                                        <span className="font-bold text-blue-700 text-sm">{qty}</span>
                                        <button onClick={() => onAddToCart(product)} disabled={qty >= product.stock} className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"><Plus size={16} strokeWidth={3} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => onAddToCart(product)} disabled={isOutOfStock} className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                                        <ShoppingBag size={18} /> Tambah
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 text-center">
          <p className="text-gray-500 font-medium">© 2026 GoShop Indonesia. All rights reserved.</p>
      </footer>
    </div>
  );
}