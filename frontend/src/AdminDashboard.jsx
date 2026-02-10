import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  LayoutDashboard, ShoppingBag, Package, LogOut, Plus, 
  TrendingUp, DollarSign, Trash2, Clock, MapPin, 
  CreditCard, User, ChevronRight, X
} from "lucide-react";
import { formatRupiah } from "./utils/format";

// --- KONFIGURASI ---
const API_BASE = "http://localhost:8080/api";

// ============================================================================
// KOMPONEN UTAMA (CONTAINER)
// ============================================================================
export default function AdminDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true);

  // --- API HANDLERS ---
  const fetchData = async () => {
    try {
      const [resOrders, resProducts] = await Promise.all([
        fetch(`${API_BASE}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/products`)
      ]);

      const dataOrders = await resOrders.json();
      const dataProducts = await resProducts.json();

      if (resOrders.ok) setOrders(dataOrders.data || []);
      if (resProducts.ok) setProducts(dataProducts.data || []);
    } catch (err) {
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async (formData) => {
    const promise = fetch(`${API_BASE}/admin/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData 
    }).then(async (res) => {
      if (!res.ok) throw new Error("Gagal");
      fetchData(); // Refresh data
    });

    toast.promise(promise, {
      loading: 'Mengupload produk...',
      success: 'Produk berhasil ditambahkan!',
      error: 'Gagal upload produk',
    });
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Yakin hapus produk ini?")) return;
    const promise = fetch(`${API_BASE}/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchData());

    toast.promise(promise, { loading: 'Menghapus...', success: 'Produk dihapus', error: 'Gagal hapus' });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if(!window.confirm(`Ubah status menjadi "${newStatus}"?`)) return;
    const promise = fetch(`${API_BASE}/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
    }).then(() => fetchData());

    toast.promise(promise, { loading: 'Updating...', success: `Status: ${newStatus}`, error: 'Gagal update' });
  };

  // Helper Stats
  const totalRevenue = orders.filter(o => o.status !== 'Batal').reduce((acc, curr) => acc + curr.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending');

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        pendingCount={pendingOrders.length} 
      />

      <main className="flex-1 ml-64 p-8 lg:p-12">
        <Header activeTab={activeTab} />

        {loading ? (
           <LoadingState />
        ) : (
            <>
            {activeTab === "dashboard" && (
              <OverviewTab 
                orders={orders} 
                products={products} 
                totalRevenue={totalRevenue} 
                pendingOrders={pendingOrders}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "orders" && (
              <OrdersTab 
                orders={orders} 
                onUpdateStatus={handleStatusChange} 
              />
            )}

            {activeTab === "products" && (
              <ProductsTab 
                products={products} 
                onAdd={handleAddProduct} 
                onDelete={handleDeleteProduct} 
              />
            )}
            </>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (TABS)
// ============================================================================

function OverviewTab({ orders, products, totalRevenue, pendingOrders, setActiveTab }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} icon={<DollarSign size={24}/>} gradient="from-green-500 to-emerald-700" />
        <StatCard title="Total Pesanan" value={`${orders.length} Transaksi`} icon={<ShoppingBag size={24}/>} gradient="from-blue-500 to-indigo-700" />
        <StatCard title="Produk Aktif" value={`${products.length} Item`} icon={<Package size={24}/>} gradient="from-purple-500 to-pink-700" />
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-500"/> Pesanan Perlu Diproses
          </h3>
          {pendingOrders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <p className="text-gray-400 italic">Semua aman! Tidak ada pesanan pending.</p>
              </div>
          ) : (
              <div className="space-y-4">
                  {pendingOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between items-center p-5 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition cursor-pointer" onClick={() => setActiveTab('orders')}>
                          <div className="flex items-center gap-4">
                              <div className="bg-white p-2 rounded-full shadow-sm text-yellow-600 font-bold">#{order.id}</div>
                              <div>
                                  <p className="font-bold text-gray-900">{order.customer}</p>
                                  <p className="text-sm text-yellow-700 mt-0.5">Menunggu konfirmasi</p>
                              </div>
                          </div>
                          <ChevronRight className="text-yellow-400"/>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}

function OrdersTab({ orders, onUpdateStatus }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {orders.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6"/>
              <p className="text-gray-500 text-lg font-medium">Belum ada pesanan masuk.</p>
          </div>
      ) : (
          orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 border-b border-gray-100 pb-6 mb-6">
                      <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><ShoppingBag size={24}/></div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">ORDER #{order.id}</h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1"><Clock size={14}/> {new Date(order.created_at).toLocaleString()}</span>
                              </div>
                          </div>
                      </div>
                      <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      {/* Info Pelanggan */}
                      <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Info Pelanggan</h4>
                          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                              <div className="flex items-start gap-3 mb-3">
                                  <User className="text-gray-400 mt-1" size={16}/>
                                  <div>
                                      <p className="font-bold text-gray-900">{order.customer}</p>
                                      <p className="text-sm text-gray-500">Customer Member</p>
                                  </div>
                              </div>
                              <div className="flex items-start gap-3">
                                  <MapPin className="text-gray-400 mt-1" size={16}/>
                                  <p className="text-gray-700 text-sm leading-relaxed">{order.address || "Alamat tidak tersedia"}</p>
                              </div>
                          </div>
                      </div>
                      {/* Info Pembayaran */}
                      <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pembayaran</h4>
                          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-600 text-sm flex items-center gap-2"><CreditCard size={16}/> Metode</span>
                                  <span className="font-bold text-blue-800 bg-white px-2 py-1 rounded shadow-sm text-xs">{order.payment_method || "Transfer"}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-blue-100 mt-2">
                                  <span className="text-gray-600 font-bold">Total Bayar</span>
                                  <span className="text-xl font-extrabold text-blue-700">{formatRupiah(order.total)}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                      {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-200 text-sm">
                              <span className="text-gray-700 font-medium flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                  {item.name} <span className="text-gray-400">x{item.quantity}</span>
                              </span>
                              <span className="font-mono text-gray-600">{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                      ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">
                      <ActionButton label="Proses" onClick={() => onUpdateStatus(order.id, "Diproses")} color="bg-yellow-100 text-yellow-700 hover:bg-yellow-200" icon="🛠" />
                      <ActionButton label="Kirim" onClick={() => onUpdateStatus(order.id, "Dikirim")} color="bg-blue-100 text-blue-700 hover:bg-blue-200" icon="🚚" />
                      <ActionButton label="Selesai" onClick={() => onUpdateStatus(order.id, "Selesai")} color="bg-green-100 text-green-700 hover:bg-green-200" icon="✅" />
                      <div className="ml-auto">
                          <ActionButton label="Batalkan" onClick={() => onUpdateStatus(order.id, "Batal")} color="bg-red-50 text-red-600 hover:bg-red-100" icon="❌" />
                      </div>
                  </div>
              </div>
          ))
      )}
    </div>
  );
}

function ProductsTab({ products, onAdd, onDelete }) {
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [category, setCategory] = useState("Elektronik"); // <--- STATE BARU
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Pilih gambar dulu!");
    
    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("category", category); // <--- PENTING: Kirim Kategori ke Backend
    formData.append("image", imageFile);

    onAdd(formData).then(() => {
        // Reset form setelah sukses
        setNewProduct({ name: "", price: "" });
        setCategory("Elektronik"); // Reset kategori
        setImageFile(null);
        document.getElementById("fileInput").value = ""; 
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900"><Plus size={24} className="text-blue-600"/> Tambah Produk</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nama Produk</label>
                      <input className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium" placeholder="Contoh: Sepatu Nike" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Harga (Rp)</label>
                        <input className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium" type="number" placeholder="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    </div>
                    {/* --- INPUT KATEGORI BARU --- */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Kategori</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium appearance-none"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="Elektronik">Elektronik</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Aksesoris">Aksesoris</option>
                        </select>
                    </div>
                    {/* --------------------------- */}
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Foto Produk</label>
                      <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                          <input id="fileInput" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setImageFile(e.target.files[0])} />
                          {imageFile ? (
                              <div className="relative h-48 w-full rounded-lg overflow-hidden group">
                                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><p className="text-white font-bold text-sm">Ganti Gambar</p></div>
                              </div>
                          ) : (
                              <div className="py-8 text-gray-400">
                                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"><Package size={20}/></div>
                                  <p className="text-sm">Klik atau geser file ke sini</p>
                              </div>
                          )}
                      </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                      Simpan Produk
                  </button>
              </form>
          </div>
       </div>

       <div className="lg:col-span-2 space-y-4">
           {products.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Belum ada produk.</p>
           ) : products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                          <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={p.name} />
                      </div>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-gray-900 text-lg">{p.name}</h4>
                             {/* Badge Kategori Kecil */}
                             <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.category || "UMUM"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <p className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-sm">{formatRupiah(p.price)}</p>
                              <p className="text-xs text-gray-400 font-medium">Stok: {p.stock}</p>
                          </div>
                      </div>
                  </div>
                  <button onClick={() => onDelete(p.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                      <Trash2 size={20} />
                  </button>
              </div>
          ))}
       </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS & HELPERS
// ============================================================================

function Sidebar({ activeTab, setActiveTab, onLogout, pendingCount }) {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-30 transition-transform duration-300 transform translate-x-0">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/50"><LayoutDashboard size={22} className="text-white" /></div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Admin<span className="text-blue-500">Panel</span></h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider">V.1.0 PRO</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarItem icon={<TrendingUp size={20} />} label="Overview" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <SidebarItem icon={<ShoppingBag size={20} />} label="Pesanan Masuk" active={activeTab === "orders"} count={pendingCount} onClick={() => setActiveTab("orders")} />
        <SidebarItem icon={<Package size={20} />} label="Kelola Produk" active={activeTab === "products"} onClick={() => setActiveTab("products")} />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 w-full p-3 rounded-xl transition duration-200">
          <LogOut size={20} /> <span className="font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

function Header({ activeTab }) {
  const titles = {
    dashboard: "Dashboard Overview",
    orders: "Manajemen Pesanan",
    products: "Inventaris Produk"
  };
  
  return (
    <header className="flex justify-between items-end mb-10">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{titles[activeTab]}</h2>
        <p className="text-gray-500 mt-2">Kelola toko online kamu dengan mudah dan cepat.</p>
      </div>
      <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Administrator</p>
              <p className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full inline-block">Online</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">A</div>
      </div>
    </header>
  );
}

function SidebarItem({ icon, label, active, onClick, count }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <div className="flex items-center gap-3.5">{icon} <span className="font-medium text-sm tracking-wide">{label}</span></div>
            {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>{count}</span>}
        </button>
    );
}

function StatCard({ title, value, icon, gradient }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                {icon}
            </div>
            <div className="mt-4">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        'Pending': 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200',
        'Diproses': 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
        'Dikirim': 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
        'Selesai': 'bg-green-100 text-green-800 ring-1 ring-green-200',
        'Batal': 'bg-red-100 text-red-800 ring-1 ring-red-200'
    };
    return (
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}

function ActionButton({ label, onClick, color, icon }) {
    return (
        <button onClick={onClick} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm ${color}`}>
            <span>{icon}</span> {label}
        </button>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Memuat data...</p>
        </div>
    );
}