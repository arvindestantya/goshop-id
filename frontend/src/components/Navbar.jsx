import { ShoppingBag, User, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar({ user, cartCount, onOpenCart, onOpenAuth, onLogout, goToProfile }) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Efek deteksi scroll agar navbar berubah warna
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
            isScrolled 
            ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-4" 
            : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* LOGO */}
        <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-2 cursor-pointer group"
        >
            <div className={`p-2 rounded-xl transition ${isScrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                <ShoppingBag size={24} strokeWidth={2.5}/>
            </div>
            <span className={`text-xl font-extrabold tracking-tight transition ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                GoShop<span className={isScrolled ? 'text-blue-600' : 'text-blue-200'}>.ID</span>
            </span>
        </div>

        {/* MENU KANAN */}
        <div className="flex items-center gap-4">
            
            {/* Tombol Keranjang */}
            <button 
                onClick={onOpenCart} 
                className={`relative p-2.5 rounded-full transition group ${
                    isScrolled 
                    ? "hover:bg-gray-100 text-gray-600" 
                    : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                }`}
            >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                        {cartCount}
                    </span>
                )}
            </button>

            <div className="h-6 w-px bg-gray-300/30 mx-1"></div>

            {/* User Menu */}
            {user ? (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={goToProfile}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition ${
                            isScrolled
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-white text-blue-900 hover:bg-blue-50 shadow-lg"
                        }`}
                    >
                        <User size={18} />
                        <span className="hidden sm:inline">Akun Saya</span>
                    </button>
                    {/* Logout Button (Mobile Only / Optional) */}
                </div>
            ) : (
                <button 
                    onClick={onOpenAuth}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition shadow-lg ${
                        isScrolled
                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30"
                        : "bg-white text-blue-600 hover:bg-blue-50"
                    }`}
                >
                    Masuk
                </button>
            )}
        </div>
      </div>
    </nav>
  );
}