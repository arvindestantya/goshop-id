import { useState } from "react";
import toast from "react-hot-toast";
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, ShoppingBag } from "lucide-react";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const endpoint = isRegister ? "/api/register" : "/api/login";
    // const toastId = toast.loading("Memproses..."); // Opsional: Matikan jika ingin UI lebih bersih

    try {
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(isRegister ? "Akun berhasil dibuat! Silakan Login." : "Selamat Datang Kembali!");
        
        if (!isRegister) {
          // Simpan sesi
          localStorage.setItem("user_token", data.token);
          localStorage.setItem("user_role", data.role);
          localStorage.setItem("user_id", data.user_id);
          localStorage.setItem("user_name", data.name);
          localStorage.setItem("user_email", data.email);

          onLoginSuccess(data.token, data.role, data.user_id);
          onClose();
        } else {
          setIsRegister(false); // Pindah ke tab login
          setFormData({ name: "", email: "", password: "" }); // Reset form
        }
      } else {
        toast.error(data.error || "Terjadi kesalahan");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        
        {/* Tombol Close */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-red-500 transition"
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE: Visual Branding (Hanya muncul di Desktop) */}
        <div className="hidden md:flex w-1/2 bg-blue-600 relative items-center justify-center p-12 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             {/* Pola abstrak sederhana */}
             <div className="w-64 h-64 bg-white rounded-full blur-3xl absolute -top-10 -left-10"></div>
             <div className="w-64 h-64 bg-white rounded-full blur-3xl absolute bottom-10 right-10"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-white text-center">
            <div className="bg-white/20 p-4 rounded-2xl inline-block mb-6 backdrop-blur-md border border-white/30">
                <ShoppingBag size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">GoShop.ID</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Temukan barang impianmu dengan harga terbaik dan kualitas terjamin.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {isRegister ? "Buat Akun Baru" : "Halo, Selamat Datang!"}
            </h2>
            <p className="text-gray-500">
              {isRegister ? "Lengkapi data diri untuk memulai." : "Masuk untuk melanjutkan belanja."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Nama (Hanya saat Register) */}
            {isRegister && (
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nama Lengkap</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition" size={20} />
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: Budi Santoso" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Alamat Email</label>
              <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition" size={20} />
                  <input 
                    required 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
              </div>
            </div>

            {/* Input Password dengan Toggle Eye */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition" size={20} />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
              ) : (
                <>
                  {isRegister ? "Daftar Sekarang" : "Masuk Akun"} <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Switcher */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
              <button 
                onClick={() => setIsRegister(!isRegister)} 
                className="text-blue-600 font-bold hover:underline transition ml-1"
              >
                {isRegister ? "Login di sini" : "Daftar sekarang"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}