import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function TeacherDashboard() {
    const { user, logout } = useContext(AuthContext);
    
    // Sol menüde hangi sekmenin açık olduğunu takip ediyoruz
    const [activeTab, setActiveTab] = useState('home');

    // Profil verisi User'dan veya Profile modelinden gelebilir, güvenli bir şekilde ismi alıyoruz
    const getTeacherName = () => {
        if (user?.first_name) return `${user.first_name} ${user.last_name}`;
        if (user?.user?.first_name) return `${user.user.first_name} ${user.user.last_name}`;
        return 'Değerli Öğretmenimiz';
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sol Menü (Sidebar) */}
            <div className="w-64 bg-blue-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-blue-700 tracking-wider">
                    EduTracker
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('home')}
                        className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'home' ? 'bg-blue-600 shadow' : 'hover:bg-blue-700'}`}
                    >
                        Ana Sayfa
                    </button>
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'classes' ? 'bg-blue-600 shadow' : 'hover:bg-blue-700'}`}
                    >
                        Sınıflarım
                    </button>
                    <button 
                        onClick={() => setActiveTab('students')}
                        className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'students' ? 'bg-blue-600 shadow' : 'hover:bg-blue-700'}`}
                    >
                        Öğrenciler
                    </button>
                </nav>
                <div className="p-4 border-t border-blue-700">
                    <button 
                        onClick={logout} 
                        className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition font-bold shadow"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Ana İçerik Alanı */}
            <div className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Hoş Geldiniz, {getTeacherName()}
                    </h1>
                    <p className="text-gray-600 mt-2">Öğretmen kontrol paneline erişiyorsunuz.</p>
                </header>

                {/* Sekmelere Göre İçerik Değişimi */}
                {activeTab === 'home' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                            <h3 className="text-lg font-semibold text-gray-700">Toplam Sınıf</h3>
                            <p className="text-4xl font-bold text-blue-600 mt-2">0</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                            <h3 className="text-lg font-semibold text-gray-700">Toplam Öğrenci</h3>
                            <p className="text-4xl font-bold text-green-600 mt-2">0</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
                            <h3 className="text-lg font-semibold text-gray-700">Bekleyen Ödevler</h3>
                            <p className="text-4xl font-bold text-yellow-600 mt-2">0</p>
                        </div>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Sınıflarım Listesi</h2>
                        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            Henüz bir sınıf eklenmedi veya API'ye bağlanmadı.
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Öğrenci Listesi</h2>
                        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            Henüz öğrenci verisi çekilmedi.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}