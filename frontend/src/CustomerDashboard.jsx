import { useEffect, useState } from "react";
import { User, Package, LogOut, MapPin, Calendar, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { formatRupiah } from "./utils/format";

export default function CustomerDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ 
    name: localStorage.getItem("user_name") || "Member", 
    email: localStorage.getItem("user_email") || "belum diset" 
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/my/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            setOrders(data.data || []);
            // (Hapus logika lama yang mencoba menebak nama dari order)
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  // Helper Warna Status
  const getStatusColor = (status) => {
    switch (status) {
        case "Selesai": return "bg-green-100 text-green-700 border-green-200";
        case "Dikirim": return "bg-blue-100 text-blue-700 border-blue-200";
        case "Batal": return "bg-red-100 text-red-700 border-red-200";
        default: return "bg-yellow-100 text-yellow-700 border-yellow-200"; // Pending/Diproses
    }
  };

  const getStatusIcon = (status) => {
      switch (status) {
          case "Selesai": return <CheckCircle size={16}/>;
          case "Dikirim": return <Truck size={16}/>;
          case "Batal": return <XCircle size={16}/>;
          default: return <Clock size={16}/>;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Profil Singkat */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {userProfile.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Halo, {userProfile.name}</h1>
                    <p className="text-gray-500 text-sm">Selamat datang kembali di Member Area.</p>
                </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition">
                <LogOut size={18}/> Logout
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* SIDEBAR MENU */}
            <div className="md:col-span-1 space-y-2">
                <button 
                    onClick={() => setActiveTab("orders")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    <Package size={20}/> Pesanan Saya
                </button>
                <button 
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    <User size={20}/> Akun Saya
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="md:col-span-3">
                
                {/* --- TAB PESANAN --- */}
                {activeTab === "orders" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Belanja</h2>
                        
                        {loading ? (
                             <p className="text-center py-10 text-gray-400">Memuat riwayat...</p>
                        ) : orders.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300">
                                <Package size={48} className="mx-auto text-gray-300 mb-4"/>
                                <h3 className="font-bold text-gray-600">Belum ada pesanan</h3>
                                <p className="text-gray-400 text-sm mb-6">Yuk mulai belanja barang impianmu!</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                                    
                                    {/* Header Card */}
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                                <Package size={20}/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">No. Pesanan</p>
                                                <p className="font-bold text-gray-800">#{order.id}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 w-fit ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)} {order.status}
                                        </div>
                                    </div>

                                    {/* List Barang */}
                                    <div className="space-y-3 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-md"></div> {/* Placeholder Gbr Kecil */}
                                                    <span className="text-gray-700 font-medium">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                                </div>
                                                <span className="text-gray-900 font-bold">{formatRupiah(item.price)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Calendar size={14}/> <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPin size={14}/> <span className="truncate max-w-[200px]">{order.address || "Alamat tidak tersedia"}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Total Belanja</p>
                                            <p className="text-lg font-extrabold text-blue-600">{formatRupiah(order.total)}</p>
                                        </div>
                                    </div>

                                    {/* Tombol Aksi (Opsional, misal Bantuan) */}
                                    {order.status === 'Dikirim' && (
                                        <button className="mt-4 w-full py-2 border border-blue-200 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition text-sm">
                                            Lacak Paket
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- TAB PROFIL (Placeholder) --- */}
                {activeTab === "profile" && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Akun</h2>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                                <input disabled value={userProfile.name} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input disabled value={userProfile.email} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-500"/>
                            </div>
                            <div className="pt-4">
                                <p className="text-xs text-orange-500 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    ℹ️ Untuk mengubah data diri, silakan hubungi Admin.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}