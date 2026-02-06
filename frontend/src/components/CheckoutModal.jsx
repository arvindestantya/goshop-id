import { useState } from "react";
import { X, MapPin, CreditCard } from "lucide-react";
import { formatRupiah } from "../utils/format";

export default function CheckoutModal({ isOpen, onClose, cart, total, onConfirm }) {
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("Transfer Bank (BCA)");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
        alert("Alamat wajib diisi!");
        return;
    }
    
    setLoading(true);
    // Kirim data ke App.jsx untuk diproses ke Backend
    await onConfirm({ address, paymentMethod: payment });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">Konfirmasi Pesanan</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Ringkasan Pesanan */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Total Barang</span>
                    <span className="font-bold">{cart.length} item</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-700">
                    <span>Total Bayar</span>
                    <span>{formatRupiah(total)}</span>
                </div>
            </div>

            {/* Input Alamat */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16}/> Alamat Pengiriman
                </label>
                <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    rows="3"
                    placeholder="Jln. Sudirman No. 123, Pekanbaru..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                ></textarea>
            </div>

            {/* Input Pembayaran */}
            {/* <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <CreditCard size={16}/> Metode Pembayaran
                </label>
                <select 
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                >
                    <option value="Transfer Bank (BCA)">Transfer Bank (BCA)</option>
                    <option value="Transfer Bank (Mandiri)">Transfer Bank (Mandiri)</option>
                    <option value="QRIS (GoPay/OVO)">QRIS (GoPay/OVO)</option>
                    <option value="COD (Bayar di Tempat)">COD (Bayar di Tempat)</option>
                </select>
            </div> */}

            {/* Tombol Aksi */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-gray-400 mt-4"
            >
                {loading ? "Memproses..." : "Bayar Sekarang"}
            </button>
        </form>

      </div>
    </div>
  );
}