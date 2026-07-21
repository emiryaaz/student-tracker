import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function TeachersDirectory() {
    const { user } = useContext(AuthContext); // Kullanıcının giriş yapıp yapmadığını kontrol eder
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false); // Pop-up durumunu tutar

    useEffect(() => {
        fetch('http://localhost:8000/api/accounts/teachers/')
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

    // İletişime Geç butonuna tıklandığında çalışacak fonksiyon
    const handleContactClick = (teacherUserId) => {
        if (user) {
            // Kullanıcı giriş yapmışsa sohbet ekranına yönlendir
            navigate(`/messages?user_id=${teacherUserId}`);
        } else {
            // Giriş yapmamışsa modal'ı (pop-up) aç
            setShowAuthModal(true); 
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            {/* Header (Navigasyon) */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-black text-blue-800 tracking-tighter">
                        EduTracker<span className="text-blue-500">.</span>
                    </Link>
                    <div className="space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition">Giriş Yap</Link>
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-md">Kayıt Ol</Link>
                    </div>
                </div>
            </header>

            {/* Ana İçerik */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Uzman Eğitmenleri <span className="text-blue-600">Keşfedin</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Hedeflerinize ulaşmak için alanında uzman, doğrulanmış eğitmenlerimizle tanışın ve eğitime başlayın.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col">
                                <div className="h-24 bg-gradient-to-r from-blue-500 to-teal-400"></div>
                                <div className="px-6 pb-6 relative flex-1 flex flex-col">
                                    {/* Profil Fotoğrafı */}
                                    <div className="-mt-12 mb-4 flex justify-center">
                                        {teacher.profile_picture ? (
                                            <img src={`http://localhost:8000${teacher.profile_picture}`} alt={teacher.first_name} className="h-24 w-24 object-cover rounded-full border-4 border-white shadow-md bg-white" />
                                        ) : (
                                            <div className="h-24 w-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                                                {teacher.first_name ? teacher.first_name[0] : '?'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-center flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {teacher.first_name} {teacher.last_name}
                                            {teacher.is_verified && <span className="text-blue-500 ml-1" title="Doğrulanmış Eğitmen">✔</span>}
                                        </h3>
                                        <p className="text-blue-600 font-medium text-sm mt-1">{teacher.title || 'Eğitmen'}</p>
                                        <p className="text-gray-600 text-sm mt-4 line-clamp-3">
                                            {teacher.bio || 'Henüz bir biyografi eklenmedi.'}
                                        </p>
                                    </div>
                                    
                                    {/* Aksiyon Alanı */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">

                                        <button 
                                            onClick={() => handleContactClick(teacher.user_id)}
                                            className="bg-gray-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                                        >
                                            İletişime Geç
                                        </button>

                                        <button className="bg-gray-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">

                                            Profili İncele

                                        </button>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* GİRİŞ YAP UYARI POP-UP'I (MODAL) */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-fade-in-up">
                        {/* Kapat Butonu */}
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold">×</button>
                        
                        {/* İkon */}
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h3>
                        <p className="text-gray-600 mb-6">
                            Eğitmenlerimizle güvenli sohbet başlatmak için lütfen giriş yapın veya ücretsiz kayıt olun.
                        </p>
                        
                        <div className="space-y-3">
                            <Link to="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
                                Giriş Yap
                            </Link>
                            <Link to="/register" className="block w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 rounded-lg transition">
                                Hesap Oluştur
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}