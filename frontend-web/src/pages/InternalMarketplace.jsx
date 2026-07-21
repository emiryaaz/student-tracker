import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InternalMarketplace() {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access');
        fetch('http://localhost:8000/api/accounts/teachers/', {
            headers: {
                'Authorization': `Bearer ${token}` // Sisteme giriş yapıldığı için token gönderiyoruz
            }
        })
            .then(res => res.json())
            .then(data => {
                setTeachers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Eğitmenler çekilemedi:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-6 md:p-8 w-full max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Üst Kısım: Başlık ve Geri Butonu */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Eğitmen Vitrini</h1>
                    <p className="text-gray-500 mt-1">Branşında uzman öğretmenlerle tanışın ve hemen iletişime geçin.</p>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
                >
                    Geri Dön
                </button>
            </div>

            {/* İçerik: Yükleniyor veya Kartlar */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map(teacher => (
                        <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition relative">
                            
                            {/* Profil Resmi & Temel Bilgiler */}
                            <div className="flex items-center gap-4 mb-4">
                                {teacher.profile_picture ? (
                                    <img src={`http://localhost:8000${teacher.profile_picture}`} alt={teacher.first_name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                                        {teacher.first_name ? teacher.first_name[0] : '?'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1">
                                        {teacher.first_name} {teacher.last_name}
                                        {teacher.is_verified && <span className="text-blue-500 text-sm" title="Doğrulanmış Eğitmen">✔</span>}
                                    </h3>
                                    <p className="text-blue-600 text-sm font-medium">{teacher.title || 'Eğitmen'}</p>
                                </div>
                            </div>
                            
                            {/* Biyografi */}
                            <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                                {teacher.bio || 'Henüz bir açıklama eklenmemiş.'}
                            </p>
                            
                            {/* Aksiyon Alanı: Müsait Durumu ve Mesaj Butonu */}
                            <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center">
                                 <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                    Müsait
                                </span>
                                {/* Doğrudan Sistem İçi Mesajlaşmaya Yönlendirir */}
                                <button 
                                    onClick={() => navigate(`/messages?user_id=${teacher.user_id}`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                    </svg>
                                    Mesaj At
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}