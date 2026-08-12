import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const getDashboardPath = (user) => {
    const role = user?.role || user?.user?.role;
    if (role === 'TEACHER') return '/teacher';
    if (role === 'STUDENT') return '/student';
    if (role === 'PARENT') return '/parent';
    if (role === 'ADMIN') return '/admin';
    return '/login';
};

export default function TeacherProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [note, setNote] = useState('');

    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [requestError, setRequestError] = useState('');
    const [requestSubmitting, setRequestSubmitting] = useState(false);

    const myId = user?.user?.id || user?.user_id || user?.id;
    const myRole = user?.role || user?.user?.role;
    const isStudent = myRole === 'STUDENT';
    const isParent = myRole === 'PARENT';
    const myReview = reviews.find(r => Number(r.reviewer) === Number(myId));

    const myOwnRequest = isStudent
        ? myRequests.find(r => Number(r.teacher) === Number(teacher?.user_id))
        : null;

    const selectedChildRequest = isParent && selectedChildId
        ? myRequests.find(r => Number(r.teacher) === Number(teacher?.user_id) && Number(r.student) === Number(selectedChildId))
        : null;

    useEffect(() => {
        if (!user) return;
        api.get('/school/match-requests/')
            .then(res => setMyRequests(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error('Talepler çekilemedi:', err));

        if (isParent) {
            api.get('/accounts/profiles/me/')
                .then(res => setChildren(res.data?.children || []))
                .catch(err => console.error('Bağlı öğrenciler çekilemedi:', err));
        }
    }, [user, isParent]);

    useEffect(() => {
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

    const fetchReviews = () => {
        api.get(`/school/reviews/?teacher_id=${id}`)
            .then(res => setReviews(res.data))
            .catch(err => console.error("Değerlendirmeler çekilemedi:", err));
    };

    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewSubmitting(true);
        setReviewError('');
        try {
            if (myReview) {
                await api.patch(`/school/reviews/${myReview.id}/`, { rating: newRating, comment: newComment });
            } else {
                await api.post('/school/reviews/', { teacher: id, rating: newRating, comment: newComment });
            }
            setNewComment('');
            fetchReviews();
            api.get(`/accounts/teachers/${id}/`).then(res => setTeacher(res.data));
        } catch (error) {
            setReviewError(error.response?.data?.detail || 'Değerlendirme gönderilemedi.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleContactClick = () => {
        const token = localStorage.getItem('access');

        if (user || token) {
            navigate(getDashboardPath(user), { state: { openMessagesWith: teacher?.user_id } });
        } else {
            setShowAuthModal(true);
        }
    };

    const extractErrorMessage = (error) => {
        const data = error.response?.data;
        if (!data) return 'Bir hata oluştu. Lütfen tekrar deneyin.';
        if (typeof data === 'string') return data;
        if (Array.isArray(data)) return data.join(' ');
        if (data.detail) return Array.isArray(data.detail) ? data.detail.join(' ') : data.detail;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
            const val = data[firstKey];
            return Array.isArray(val) ? val.join(' ') : String(val);
        }
        return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    };

    const openRequestModal = () => {
        setRequestError('');
        setSelectedChildId('');
        setNote('');
        setShowRequestModal(true);
    };

    const handleSendRequest = async () => {
        const token = localStorage.getItem('access');

        if (!token) {
            setShowRequestModal(false);
            setShowAuthModal(true);
            return;
        }

        const targetTeacherId = teacher?.user_id || teacher?.user?.id || teacher?.user || id;

        setRequestError('');

        if (isParent && !selectedChildId) {
            setRequestError('Lütfen talebi hangi öğrenciniz için gönderdiğinizi seçin.');
            return;
        }

        setRequestSubmitting(true);
        try {
            const payload = { teacher: targetTeacherId, note: note };
            if (isParent) payload.student_id = selectedChildId;

            await api.post('/school/match-requests/', payload);
            alert("Talebiniz öğretmene başarıyla iletildi!");
            setShowRequestModal(false);
            setNote('');
            setSelectedChildId('');
            api.get('/school/match-requests/')
                .then(res => setMyRequests(Array.isArray(res.data) ? res.data : []))
                .catch(err => console.error('Talepler çekilemedi:', err));
        } catch (error) {
            console.error("Backend'den dönen HATA:", error.response?.data);
            setRequestError(extractErrorMessage(error));
        } finally {
            setRequestSubmitting(false);
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
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition"
                    >
                        <span className="mr-2">←</span> Geri Dön
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-48 bg-gradient-to-r from-blue-600 to-teal-500 relative"></div>

                    <div className="px-4 md:px-8 pb-10">
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
                                    </h1>
                                    <p className="text-lg text-blue-600 font-medium">{teacher.title || 'Uzman Eğitmen'}</p>
                                    {teacher.average_rating ? (
                                        <p className="text-sm text-yellow-600 font-semibold mt-1">
                                            ⭐ {teacher.average_rating} <span className="text-gray-400 font-normal">({teacher.review_count} değerlendirme)</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400 mt-1">Henüz değerlendirme yok</p>
                                    )}

                                    {teacher.is_verified ? (
                                        <p className="text-sm text-green-600 font-bold mt-2">✓ Doğrulanmış Öğretmen</p>
                                    ) : (
                                        <div className="mt-2">
                                            <p className="text-sm text-red-600 font-bold">⚠ Doğrulanmamış Öğretmen</p>
                                            <p className="text-xs text-red-500 mt-0.5 max-w-sm">Sistemimiz tarafından doğrulanmamış öğretmenler ile çalışmanız önerilmez.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-2 w-full md:w-auto flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
                                {isStudent && myOwnRequest?.status === 'ACCEPTED' ? (
                                    <span className="w-full sm:w-auto bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                        ✓ Bu Öğretmenden Ders Alıyorsunuz
                                    </span>
                                ) : isStudent && myOwnRequest?.status === 'PENDING' ? (
                                    <span className="w-full sm:w-auto bg-amber-50 text-amber-700 border border-amber-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                        ⏳ Talebiniz Bekleniyor
                                    </span>
                                ) : (
                                    <button
                                        onClick={openRequestModal}
                                        className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                                    >
                                        📅 Ders Talebi
                                    </button>
                                )}

                                <button
                                    onClick={handleContactClick}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                                >
                                    💬 İletişime Geç
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-gray-100 pt-8">
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">Eğitmen Hakkında</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {teacher.bio || 'Eğitmenimiz henüz bir biyografi metni eklememiş. Detaylı bilgi almak için kendisiyle doğrudan iletişime geçebilirsiniz.'}
                                    </p>
                                </div>
                            </div>

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
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Öğrenci Değerlendirmeleri</h2>

                    {reviews.length === 0 ? (
                        <p className="text-gray-500 mb-6">Bu eğitmen için henüz bir değerlendirme yapılmamış.</p>
                    ) : (
                        <div className="space-y-4 mb-8">
                            {reviews.map(r => (
                                <div key={r.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800">{r.reviewer_name || 'Öğrenci'}</span>
                                        <span className="text-yellow-500 font-semibold">{'⭐'.repeat(r.rating)}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{r.comment}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {user?.role === 'STUDENT' || user?.user?.role === 'STUDENT' ? (
                        <form onSubmit={handleReviewSubmit} className="border-t border-gray-100 pt-6">
                            <h3 className="font-bold text-gray-800 mb-3">{myReview ? 'Değerlendirmeni Güncelle' : 'Bu Eğitmeni Değerlendir'}</h3>
                            <div className="flex items-center gap-2 mb-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setNewRating(star)}
                                        className={`text-2xl ${star <= newRating ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                required
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Deneyiminizi paylaşın..."
                                className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:border-teal-500 h-24 resize-none mb-3"
                            />
                            {reviewError && <p className="text-red-600 text-sm mb-3">{reviewError}</p>}
                            <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50"
                            >
                                {reviewSubmitting ? 'Gönderiliyor...' : (myReview ? 'Güncelle' : 'Değerlendirmeyi Gönder')}
                            </button>
                        </form>
                    ) : (
                        <p className="text-gray-400 text-sm border-t border-gray-100 pt-6">Değerlendirme bırakmak için ders aldığınız bir öğretmene öğrenci hesabınızla giriş yapmalısınız.</p>
                    )}
                </div>
            </div>

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
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
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

                        {isParent && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hangi öğrenciniz için?
                                </label>
                                <select
                                    value={selectedChildId}
                                    onChange={(e) => setSelectedChildId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-teal-500"
                                >
                                    <option value="">Öğrenci seçin...</option>
                                    {children.map(child => (
                                        <option key={child.id} value={child.user.id}>
                                            {child.user.first_name} {child.user.last_name}
                                        </option>
                                    ))}
                                </select>
                                {children.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        Henüz bağlı bir öğrenciniz yok. Önce panelinizden bir öğrenci bağlamalısınız.
                                    </p>
                                )}
                                {selectedChildRequest?.status === 'ACCEPTED' && (
                                    <p className="text-xs text-green-600 mt-2">Bu öğrenciniz zaten bu öğretmenden ders alıyor.</p>
                                )}
                                {selectedChildRequest?.status === 'PENDING' && (
                                    <p className="text-xs text-amber-600 mt-2">Bu öğrenciniz için zaten cevap bekleyen bir talep var.</p>
                                )}
                            </div>
                        )}

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

                        {requestError && <p className="text-red-600 text-sm mt-2">{requestError}</p>}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={requestSubmitting || (isParent && (!selectedChildId || selectedChildRequest?.status === 'ACCEPTED' || selectedChildRequest?.status === 'PENDING'))}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {requestSubmitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
