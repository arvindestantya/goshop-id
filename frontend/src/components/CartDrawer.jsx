import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { formatRupiah } from "../utils/format";

export default function CartDrawer({ isOpen, onClose, cart, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      {/* Backdrop Gelap */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel Keranjang */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <ShoppingBag size={20}/>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Keranjang <span className="text-gray-400 font-normal">({cart.length})</span></h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition">
                <X size={20}/>
            </button>
        </div>

        {/* List Barang */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                        <ShoppingBag size={40} className="text-gray-300"/>
                    </div>
                    <p className="font-medium">Keranjangmu masih kosong.</p>
                    <button onClick={onClose} className="text-blue-600 font-bold hover:underline">Mulai Belanja</button>
                </div>
            ) : (
                cart.map((item, index) => (
                    <div key={index} className="flex gap-4 group">
                        {/* Gambar Produk */}
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                        </div>
                        
                        {/* Info Produk */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                <p className="text-blue-600 font-bold text-sm">{formatRupiah(item.price)}</p>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                {/* Simulasi Qty (Saat ini kita simpan per-item array, nanti bisa digroup) */}
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Qty: 1</span>

                                <button 
                                    onClick={() => onRemove(index)}
                                    className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs font-medium transition"
                                >
                                    <Trash2 size={14}/> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-medium">Total Tagihan</span>
                    <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatRupiah(total)}</span>
                </div>
                <button 
                    onClick={onCheckout}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    Checkout Sekarang <ArrowRight size={20}/>
                </button>
            </div>
        )}
      </div>
    </>
  );
}