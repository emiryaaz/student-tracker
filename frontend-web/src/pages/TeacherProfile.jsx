import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function TeacherProfile() {
    const { id } = useParams(); // URL'den öğretmenin ID'sini alır
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [note, setNote] = useState('');

    useEffect(() => {
        // Öğretmenin detay bilgilerini çeken endpoint (herkese açık)
        api.get(`/accounts/teachers/${id}/`)
            .then(res => {
                setTeacher(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Eğitmen bilgileri çekilemedi:", err);
                setLoading(false);
            });
    }, [id]);

    const handleContactClick = () => {
        const token = localStorage.getItem('access'); // Ekstra güvenlik için token kontrolü

        if (user || token) {
            // Kullanıcı giriş yapmışsa doğrudan bu öğretmenin mesaj ekranına gönder
            navigate(`/messages?user_id=${teacher?.user_id}`);
        } else {
            // Giriş yapmamışsa pop-up aç
            setShowAuthModal(true);
        }
    };

    const handleSendRequest = async () => {
        const token = localStorage.getItem('access');
        
        if (!token) {
            setShowRequestModal(false);
            setShowAuthModal(true); // Giriş yapmamışsa uyarı ver
            return;
        }

        // ÇÖZÜM NOKTASI: Backend'e profil ID'sini değil, User (Kullanıcı) ID'sini göndermeliyiz.
        // TeacherProfileSerializer düz "user_id" alanı döner (nested "user" objesi yok),
        // bu yüzden önce onu kullanmalıyız. URL'deki id, TeacherProfile'ın kendi pk'sı olduğu
        // için son çare olarak bile kullanılmamalı; yine de eski davranışı bozmamak adına
        // en son fallback olarak bırakıldı.
        const targetTeacherId = teacher?.user_id || teacher?.user?.id || teacher?.user || id;

        try {
            await api.post('/school/match-requests/', { teacher: targetTeacherId, note: note });
            alert("Talebiniz öğretmene başarıyla iletildi!");
            setShowRequestModal(false);
            setNote(''); // Formu temizle
        } catch (error) {
            // EĞER HATA VERİRSE DJANGO'NUN GÖNDERDİĞİ MESAJI EKRANA YAZDIR
            console.error("Backend'den dönen HATA:", error.response?.data);
            alert("Hata detayları: " + JSON.stringify(error.response?.data || {}));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-800">Eğitmen bulunamadı.</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline font-medium">
                    Geri Dön
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Üst Navigasyon / Geri Dön */}
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition"
                    >
                        <span className="mr-2">←</span> Geri Dön
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Profil Arka Plan Kapak Resmi */}
                    <div className="h-48 bg-gradient-to-r from-blue-600 to-teal-500 relative"></div>

                    <div className="px-4 md:px-8 pb-10">
                        {/* Profil Fotoğrafı ve Temel Bilgiler */}
                        <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 mb-8 gap-6 md:gap-0">
                            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                                {teacher.profile_picture ? (
                                    <img
                                        src={`http://localhost:8000${teacher.profile_picture}`}
                                        alt={teacher.first_name}
                                        className="h-32 w-32 object-cover rounded-2xl border-4 border-white shadow-lg bg-white"
                                    />
                                ) : (
                                    <div className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center text-gray-400 text-4xl font-black">
                                        {teacher.first_name ? teacher.first_name[0] : '?'}
                                    </div>
                                )}
                                <div className="mb-2">
                                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                        {teacher.first_name} {teacher.last_name}
                                        {teacher.is_verified && <span className="text-blue-500 text-xl" title="Doğrulanmış Eğitmen">✔</span>}
                                    </h1>
                                    <p className="text-lg text-blue-600 font-medium">{teacher.title || 'Uzman Eğitmen'}</p>
                                </div>
                            </div>

                            <div className="mb-2 w-full md:w-auto flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
                                <button 
                                    onClick={() => setShowRequestModal(true)}
                                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                                >
                                    📅 Ders Talebi
                                </button>
                                
                                <button 
                                    onClick={handleContactClick}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                                >
                                    💬 İletişime Geç
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-gray-100 pt-8">
                            {/* Sol Kolon: Hakkında */}
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">Eğitmen Hakkında</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {teacher.bio || 'Eğitmenimiz henüz bir biyografi metni eklememiş. Detaylı bilgi almak için kendisiyle doğrudan iletişime geçebilirsiniz.'}
                                    </p>
                                </div>
                            </div>

                            {/* Sağ Kolon: Bilgiler / Rozetler */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-max">
                                <h3 className="font-bold text-gray-900 mb-4">Eğitmen Bilgileri</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center text-sm text-gray-600">
                                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">🎓</span>
                                        Sistem Onaylı Eğitmen
                                    </li>
                                    <li className="flex items-center text-sm text-gray-600">
                                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                        </span>
                                        Görüşmeye Açık
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GİRİŞ YAP UYARI POP-UP'I (MODAL) */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative">
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold">×</button>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h3>
                        <p className="text-gray-600 mb-6">Eğitmenlerimizle güvenli sohbet başlatmak için lütfen giriş yapın veya kayıt olun.</p>
                        <div className="space-y-3">
                            <Link to="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Giriş Yap</Link>
                            <Link to="/register" className="block w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 rounded-lg transition">Hesap Oluştur</Link>
                        </div>
                    </div>
                </div>
            )}
            {/* DERS TALEBİ GÖNDERME MODALI */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
                        {/* Kapatma Çarpısı */}
                        <button 
                            onClick={() => setShowRequestModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                        >
                            &times;
                        </button>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Ders Talebi Oluştur</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            <span className="font-semibold text-gray-800">
                                {teacher?.first_name} {teacher?.last_name}
                            </span> adlı eğitmene ders almak istediğinizi belirten bir istek gönderiyorsunuz.
                        </p>
                        
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Öğretmene Notunuz (İsteğe bağlı)
                            </label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 h-32 resize-none transition"
                                placeholder="Örn: Haftada 2 gün matematik dersi almak istiyorum, uygun günlerinizi konuşabilir miyiz?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleSendRequest}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-md"
                            >
                                Talebi Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}