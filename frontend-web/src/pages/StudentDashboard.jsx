import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import MessagesPanel from '../components/MessagesPanel';
import CalendarPanel from '../components/CalendarPanel';
import MarketplacePanel from '../components/MarketplacePanel';

export default function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('home');
    const [messagesInitialUserId, setMessagesInitialUserId] = useState(null);

    // Veri Stateleri
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);         // YENİ
    const [resources, setResources] = useState([]); // YENİ
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Bize gönderilen veli bağlantı talepleri (bir veli, e-postamızı girip bağlanmak isteyince
    // burada onay/red bekler; onaylamadan hiçbir veli hesabımıza erişemez)
    const [linkRequests, setLinkRequests] = useState([]);
    const [respondingLinkId, setRespondingLinkId] = useState(null);

    // Tüm verileri (Ödev, Sınav, Kaynak) backend'den aynı anda çekiyoruz
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Promise.all yerine allSettled: biri başarısız olsa bile diğer ikisi ekrana yansısın
                const [resAssignments, resExams, resResources] = await Promise.allSettled([
                    api.get('/school/assignments/'),
                    api.get('/school/exams/'),
                    api.get('/school/resources/')
                ]);

                if (resAssignments.status === 'fulfilled') setAssignments(resAssignments.value.data);
                if (resExams.status === 'fulfilled') setExams(resExams.value.data);
                if (resResources.status === 'fulfilled') setResources(resResources.value.data);

            } catch (error) {
                console.error('Veriler çekilemedi:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Eğitmen Vitrini / Eğitmen Profili gibi dışarıdan gelen "bu kullanıcıyla sohbet aç" isteğini yakala
    useEffect(() => {
        if (location.state?.openMessagesWith) {
            setActiveTab('messages');
            setMessagesInitialUserId(location.state.openMessagesWith);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await api.get('/school/messages/unread-count/');
                setUnreadCount(response.data.unread_count);
            } catch (error) {
                console.error("Bildirimler çekilemedi", error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 3000);

        return () => clearInterval(interval);
    }, []);

    const fetchLinkRequests = async () => {
        try {
            const response = await api.get('/accounts/link-requests/');
            const data = Array.isArray(response.data) ? response.data : [];
            setLinkRequests(data.filter(r => r.status === 'PENDING'));
        } catch (error) {
            console.error('Bağlantı talepleri çekilemedi:', error);
        }
    };

    useEffect(() => {
        fetchLinkRequests();
    }, []);

    const respondToLinkRequest = async (requestId, status) => {
        setRespondingLinkId(requestId);
        try {
            await api.patch(`/accounts/link-requests/${requestId}/respond/`, { status });
            setLinkRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            alert(error.response?.data?.detail || 'İşlem başarısız oldu.');
        } finally {
            setRespondingLinkId(null);
        }
    };

    const getStudentName = () => user?.first_name || user?.user?.first_name || 'Öğrenci';

    const markAsCompleted = async (assignmentId) => {
        try {
            await api.patch(`/school/assignments/${assignmentId}/`, { status: 'COMPLETED' });
            setAssignments(prev => prev.map(task => task.id === assignmentId ? { ...task, status: 'COMPLETED' } : task));
        } catch (error) {
            console.error("İstek başarısız:", error);
        }
    };


    const pendingTasks = assignments.filter(a => a.status === 'PENDING').length;
    const completedTasks = assignments.filter(a => a.status === 'COMPLETED').length;

    return (
        <div className="role-student flex h-screen bg-gray-50 relative">
            {/* SOL MENÜ */}
            <div className="app-sidebar">
                <div className="app-sidebar-logo">
                    <span className="app-sidebar-logo-text">Edu<span className="app-sidebar-logo-accent">Tracker</span></span>
                    <p className="app-sidebar-subtitle">Öğrenci Paneli</p>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'home', label: 'Özet Ekranı' },
                        { id: 'assignments', label: 'Ödevlerim' },
                        { id: 'exams', label: 'Sınav Sonuçlarım' },
                        { id: 'resources', label: 'Ders Materyalleri' },
                        { id: 'marketplace', label: 'Eğitmen Vitrini' },
                        { id: 'messages', label: 'Mesajlarım' },
                        { id: 'calendar', label: 'Takvim' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`app-nav-btn ${activeTab === tab.id ? 'app-nav-btn-active' : ''}`}
                        >
                            <span>{tab.label}</span>
                            {tab.id === 'assignments' && pendingTasks > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingTasks}</span>
                            )}
                            {tab.id === 'messages' && unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-ink-600">
                    <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">Çıkış Yap</button>
                </div>
            </div>

            {/* ANA İÇERİK */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'home' && (
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Merhaba, {getStudentName()} 👋</h1>
                    </header>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-student-600"></div>
                    </div>
                ) : (
                    <>
                        {/* ÖZET EKRANI */}
                        {activeTab === 'home' && (
                            <div className="space-y-8">
                                {/* GELEN VELİ BAĞLANTI TALEPLERİ */}
                                {linkRequests.length > 0 && (
                                    <div className="app-card">
                                        <h2 className="text-lg font-bold mb-4">Veli Bağlantı Talepleri</h2>
                                        <div className="space-y-3">
                                            {linkRequests.map(r => (
                                                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 rounded-lg p-4 bg-amber-50/50">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-bold text-gray-900">{r.parent_name || r.parent_email}</span> sizi veli hesabına bağlamak istiyor.
                                                    </p>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => respondToLinkRequest(r.id, 'ACCEPTED')}
                                                            disabled={respondingLinkId === r.id}
                                                            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                                        >
                                                            Kabul Et
                                                        </button>
                                                        <button
                                                            onClick={() => respondToLinkRequest(r.id, 'REJECTED')}
                                                            disabled={respondingLinkId === r.id}
                                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                                        >
                                                            Reddet
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
                                        <h3 className="text-lg font-semibold text-gray-700">Bekleyen Ödevler</h3>
                                        <p className="text-4xl font-bold text-yellow-600 mt-2">{pendingTasks}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                                        <h3 className="text-lg font-semibold text-gray-700">Tamamlanan</h3>
                                        <p className="text-4xl font-bold text-green-600 mt-2">{completedTasks}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500">
                                        <h3 className="text-lg font-semibold text-gray-700">Girilen Sınavlar</h3>
                                        <p className="text-4xl font-bold text-purple-600 mt-2">{exams.length}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ÖDEVLERİM */}
                        {activeTab === 'assignments' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Tüm Ödevlerim</h2>
                                {assignments.length === 0 ? (
                                    <p className="text-gray-500">Şu an için hiç ödevin yok.</p>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {assignments.map(a => (
                                            <div key={a.id} className={`border rounded-lg p-5 shadow-sm transition ${a.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : a.is_late ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-lg font-bold text-gray-800">{a.title}</h3>
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${a.status === 'COMPLETED' ? 'bg-green-200 text-green-800' : a.is_late ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {a.status === 'COMPLETED' ? 'TAMAMLANDI' : a.is_late ? 'GECİKTİ' : 'BEKLİYOR'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-4">{a.description}</p>
                                                <div className="text-xs text-gray-500 mb-4">Son Teslim: {new Date(a.due_date).toLocaleString('tr-TR')}</div>
                                                {a.status === 'PENDING' && (
                                                    <button onClick={() => markAsCompleted(a.id)} className="app-btn-primary w-full py-2">
                                                        Tamamlandı Olarak İşaretle
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* YENİ: SINAV SONUÇLARI */}
                        {activeTab === 'exams' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Sınav ve Deneme Sonuçlarım</h2>
                                {exams.length === 0 ? (
                                    <p className="text-gray-500">Henüz girilmiş bir sınav notun bulunmuyor.</p>
                                ) : (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-700 border-b">
                                                    <th className="p-4">Sınav Adı</th>
                                                    <th className="p-4">Tarih</th>
                                                    <th className="p-4">Öğretmen Notu</th>
                                                    <th className="p-4 text-right">Puan / Net</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {exams.map(e => (
                                                    <tr key={e.id} className="hover:bg-student-500/10">
                                                        <td className="p-4 font-bold text-gray-800">{e.exam_name}</td>
                                                        <td className="p-4 text-sm text-gray-600">{new Date(e.exam_date).toLocaleDateString('tr-TR')}</td>
                                                        <td className="p-4 text-sm text-gray-600">{e.notes || '-'}</td>
                                                        <td className="p-4 text-right font-bold text-purple-700">{e.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* YENİ: MATERYALLER */}
                        {activeTab === 'resources' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Ders Materyalleri</h2>
                                {resources.length === 0 ? (
                                    <p className="text-gray-500">Henüz paylaşılmış bir materyal bulunmuyor.</p>
                                ) : (
                                    <ul className="divide-y border rounded-lg">
                                        {resources.map(r => (
                                            <li key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-bold text-gray-800">{r.title}</p>
                                                    <p className="text-xs text-gray-500">Yüklenme: {new Date(r.uploaded_at).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                                {r.url && (
                                                    <a href={r.url} target="_blank" rel="noreferrer" className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-sm hover:bg-blue-200 transition">
                                                        Kaynağa Git ↗
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* EĞİTMEN VİTRİNİ SEKMESİ */}
                        {activeTab === 'marketplace' && (
                            <MarketplacePanel
                                onMessageTeacher={(teacherUserId) => {
                                    setMessagesInitialUserId(teacherUserId);
                                    setActiveTab('messages');
                                }}
                            />
                        )}

                        {/* MESAJLARIM SEKMESİ */}
                        {activeTab === 'messages' && <MessagesPanel initialUserId={messagesInitialUserId} />}

                        {/* TAKVİM SEKMESİ */}
                        {activeTab === 'calendar' && <CalendarPanel />}
                    </>
                )}
            </div>
        </div>
    );
}