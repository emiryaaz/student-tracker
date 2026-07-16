import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    return (
        <div className="p-8">
            <div className="flex justify-between items-center bg-green-600 text-white p-4 rounded mb-6">
                <h1 className="text-2xl font-bold">Öğrenci Paneli - Hoş geldin {user?.user?.first_name || user?.first_name}</h1>
                <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">Çıkış Yap</button>
            </div>
            <p>Burada ders programını, ödevlerini ve sınav sonuçlarını göreceksin.</p>
        </div>
    );
}