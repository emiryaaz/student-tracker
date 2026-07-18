import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function TeacherDashboard() {
    const { user, logout } = useContext(AuthContext);
    
    // Aktif sekmeyi ve verileri tuttuğumuz stateler
    const [activeTab, setActiveTab] = useState('home');
    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bileşen ekrana yüklendiğinde API'den verileri çeker
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = localStorage.getItem('access');
                
                const response = await fetch('http://localhost:8000/api/school/my-students/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStudentsData(data);
                } else {
                    console.error('Veri çekilemedi');
                }
            } catch (error) {
                console.error('Sunucuya bağlanılamadı:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

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
                        onClick={() => setActiveTab('students')}
                        className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'students' ? 'bg-blue-600 shadow' : 'hover:bg-blue-700'}`}
                    >
                        Öğrencilerim
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

                {/* Veri Yüklenirken Gösterilecek Ekran */}
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600 font-medium">Veriler yükleniyor...</span>
                    </div>
                ) : (
                    <>
                        {/* Ana Sayfa İstatistikleri */}
                        {activeTab === 'home' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                                    <h3 className="text-lg font-semibold text-gray-700">Toplam Öğrenci</h3>
                                    {/* Array uzunluğunu veritabanından gelen sayı ile dolduruyoruz */}
                                    <p className="text-4xl font-bold text-green-600 mt-2">{studentsData.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                                    <h3 className="text-lg font-semibold text-gray-700">Aktif Dersler</h3>
                                    {/* Farklı ders isimlerini saymak için Set metodunu kullanıyoruz */}
                                    <p className="text-4xl font-bold text-blue-600 mt-2">
                                        {new Set(studentsData.map(item => item.subject?.name)).size}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
                                    <h3 className="text-lg font-semibold text-gray-700">Bekleyen Ödevler</h3>
                                    <p className="text-4xl font-bold text-yellow-600 mt-2">0</p>
                                </div>
                            </div>
                        )}

                        {/* Öğrencilerim Listesi */}
                        {activeTab === 'students' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-6 text-gray-800">Öğrenci Listesi</h2>
                                
                                {studentsData.length === 0 ? (
                                    <div className="p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        Henüz bir öğrenciniz bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                                                    <th className="p-4 font-semibold">Öğrenci Adı</th>
                                                    <th className="p-4 font-semibold">E-posta Adresi</th>
                                                    <th className="p-4 font-semibold">Ders ve Seviye</th>
                                                    <th className="p-4 font-semibold">Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {studentsData.map((relation) => (
                                                    <tr key={relation.id} className="hover:bg-blue-50/50 transition">
                                                        <td className="p-4">
                                                            <div className="font-medium text-gray-800">
                                                                {relation.student.first_name} {relation.student.last_name}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-gray-600">
                                                            {relation.student.email}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                                {relation.subject.grade_level}. Sınıf - {relation.subject.name}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            {relation.is_active ? (
                                                                <span className="inline-flex items-center text-green-700 font-medium">
                                                                    <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                                                    Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center text-red-700 font-medium">
                                                                    <span className="w-2 h-2 mr-2 bg-red-500 rounded-full"></span>
                                                                    Pasif
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}