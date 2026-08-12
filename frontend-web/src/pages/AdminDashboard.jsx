import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const STATUS_LABELS = {
    NOT_SUBMITTED: 'Belge Yüklenmedi',
    PENDING: 'İnceleniyor',
    APPROVED: 'Onaylandı',
    REJECTED: 'Reddedildi',
};

const STATUS_BADGE_CLASSES = {
    NOT_SUBMITTED: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
};

export default function AdminDashboard() {
    const { logout } = useContext(AuthContext);
    const [activeFilter, setActiveFilter] = useState('PENDING');
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState({});
    const [actioningId, setActioningId] = useState(null);

    const fetchTeachers = () => {
        setLoading(true);
        const query = activeFilter === 'ALL' ? '' : `?status=${activeFilter}`;
        api.get(`/accounts/admin/teacher-verifications/${query}`)
            .then(res => setTeachers(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error('Öğretmen listesi çekilemedi:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter]);

    const handleReview = async (teacherProfileId, status) => {
        setActioningId(teacherProfileId);
        try {
            await api.patch(`/accounts/admin/teacher-verifications/${teacherProfileId}/review/`, {
                status,
                note: notes[teacherProfileId] || '',
            });
            fetchTeachers();
        } catch (error) {
            console.error('İşlem başarısız:', error);
            alert('İşlem başarısız oldu. Lütfen tekrar deneyin.');
        } finally {
            setActioningId(null);
        }
    };

    return (
        <div className="role-admin flex h-screen bg-gray-100 relative">
            <div className="app-sidebar">
                <div className="app-sidebar-logo">
                    <span className="app-sidebar-logo-text">Edu<span className="app-sidebar-logo-accent">Tracker</span></span>
                    <p className="app-sidebar-subtitle">Yönetici Paneli</p>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'PENDING', label: 'İnceleme Bekleyenler' },
                        { id: 'APPROVED', label: 'Onaylı Öğretmenler' },
                        { id: 'REJECTED', label: 'Reddedilenler' },
                        { id: 'ALL', label: 'Tüm Öğretmenler' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`app-nav-btn ${activeFilter === tab.id ? 'app-nav-btn-active' : ''}`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-ink-600">
                    <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">Çıkış Yap</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Öğretmen Doğrulama</h1>
                    <p className="text-gray-600 mt-2">Öğretmenlerin yüklediği diploma/belgeleri inceleyip onaylayın ya da reddedin.</p>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-admin-600"></div>
                    </div>
                ) : teachers.length === 0 ? (
                    <div className="app-card text-center text-gray-500 py-12">
                        Bu filtrede gösterilecek bir öğretmen bulunmuyor.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="app-card">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-bold text-lg text-gray-900">{teacher.first_name} {teacher.last_name}</h3>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE_CLASSES[teacher.verification_status]}`}>
                                                {STATUS_LABELS[teacher.verification_status] || teacher.verification_status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{teacher.email}</p>
                                        {teacher.title && <p className="text-sm text-gray-600 mt-1">{teacher.title}</p>}

                                        <div className="mt-3">
                                            {teacher.diploma_document ? (
                                                <a
                                                    href={`http://localhost:8000${teacher.diploma_document}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-admin-700 hover:underline text-sm font-semibold"
                                                >
                                                    Yüklenen Belgeyi Görüntüle ↗
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Henüz bir belge yüklenmemiş.</p>
                                            )}
                                        </div>

                                        {teacher.verification_note && (
                                            <p className="text-xs text-gray-500 mt-2">Önceki not: {teacher.verification_note}</p>
                                        )}
                                    </div>

                                    <div className="w-full md:w-80 shrink-0">
                                        <textarea
                                            value={notes[teacher.id] || ''}
                                            onChange={(e) => setNotes(prev => ({ ...prev, [teacher.id]: e.target.value }))}
                                            placeholder="Not (özellikle reddederken sebebini yazın, öğretmen bunu görecek)"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm h-16 resize-none focus:outline-none focus:border-admin-500"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleReview(teacher.id, 'APPROVED')}
                                                disabled={actioningId === teacher.id || teacher.verification_status === 'APPROVED'}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg transition disabled:opacity-50"
                                            >
                                                Onayla
                                            </button>
                                            <button
                                                onClick={() => handleReview(teacher.id, 'REJECTED')}
                                                disabled={actioningId === teacher.id || teacher.verification_status === 'REJECTED'}
                                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold py-2 rounded-lg transition disabled:opacity-50"
                                            >
                                                Reddet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
