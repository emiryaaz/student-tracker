import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
    const { logout } = useContext(AuthContext);
    return (
        <div className="p-8">
            <div className="flex justify-between items-center bg-gray-800 text-white p-4 rounded mb-6">
                <h1 className="text-2xl font-bold">Yönetici (Admin) Paneli</h1>
                <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">Çıkış Yap</button>
            </div>
            <p>Tüm sistemi, okulu ve kullanıcıları buradan yöneteceksin.</p>
        </div>
    );
}