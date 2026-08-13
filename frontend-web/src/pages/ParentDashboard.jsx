import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import MessagesPanel from '../components/MessagesPanel';
import CalendarPanel from '../components/CalendarPanel';
import MarketplacePanel from '../components/MarketplacePanel';

export default function ParentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('home');
    const [messagesInitialUserId, setMessagesInitialUserId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            localStorage.setItem('sidebarCollapsed', String(!prev));
            return !prev;
        });
    };

    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const [children, setChildren] = useState([]);
    const [childEmail, setChildEmail] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });
    const [sentLinkRequests, setSentLinkRequests] = useState([]);
    const [unlinkingId, setUnlinkingId] = useState(null);

    const fetchAllData = async () => {
        try {
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

    useEffect(() => {
        fetchAllData();
    }, []);

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

    const fetchChildren = async () => {
        try {
            const response = await api.get('/accounts/profiles/me/');
            setChildren(response.data.children || []);
        } catch (error) {
            console.error('Bağlı öğrenciler çekilemedi:', error);
        }
    };

    const fetchSentLinkRequests = async () => {
        try {
            const response = await api.get('/accounts/link-requests/');
            setSentLinkRequests(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Bağlantı talepleri çekilemedi:', error);
        }
    };

    useEffect(() => {
        fetchChildren();
        fetchSentLinkRequests();
    }, []);

    const handleLinkChild = async (e) => {
        e.preventDefault();
        setLinking(true);
        setLinkMessage({ type: '', text: '' });
        try {
            await api.post('/accounts/profiles/link_child/', { student_email: childEmail });
            setChildEmail('');
            setLinkMessage({ type: 'success', text: 'Bağlantı isteği gönderildi. Öğrencinin onaylamasını bekliyoruz.' });
            fetchSentLinkRequests();
        } catch (error) {
            setLinkMessage({ type: 'error', text: error.response?.data?.detail || 'Bir hata oluştu.' });
        } finally {
            setLinking(false);
        }
    };

    const handleUnlinkChild = async (studentId) => {
        if (!window.confirm('Bu öğrenciyi hesabınızdan kaldırmak istediğinize emin misiniz?')) return;
        setUnlinkingId(studentId);
        try {
            const response = await api.post('/accounts/profiles/unlink_child/', { student_id: studentId });
            setChildren(response.data.children || []);
        } catch (error) {
            alert(error.response?.data?.detail || 'Kaldırma işlemi başarısız oldu.');
        } finally {
            setUnlinkingId(null);
        }
    };

    const getParentName = () => user?.first_name || user?.user?.first_name || 'Değerli Velimiz';

    const pendingTasks = assignments.filter(a => a.status === 'PENDING').length;
    const completedTasks = assignments.filter(a => a.status === 'COMPLETED').length;

    return (
        <div className="role-parent flex h-screen bg-gray-50 relative">
            <div className={`app-sidebar ${sidebarCollapsed ? 'app-sidebar-collapsed' : ''}`}>
                <div className="app-sidebar-logo">
                    {!sidebarCollapsed && (
                        <div>
                            <span className="app-sidebar-logo-text">Edu<span className="app-sidebar-logo-accent">Tracker</span></span>
                            <p className="app-sidebar-subtitle">Veli Paneli</p>
                        </div>
                    )}
                    <button onClick={toggleSidebar} className="app-sidebar-toggle" title={sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}>
                        {sidebarCollapsed ? '›' : '‹'}
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'home', label: 'Genel Durum', icon: '🏠' },
                        { id: 'assignments', label: 'Çocuğumun Ödevleri', icon: '📝' },
                        { id: 'exams', label: 'Sınav Notları', icon: '📊' },
                        { id: 'resources', label: 'Ders Materyalleri', icon: '📚' },
                        { id: 'marketplace', label: 'Eğitmen Vitrini', icon: '🎓' },
                        { id: 'messages', label: 'Mesajlarım', icon: '💬' },
                        { id: 'calendar', label: 'Takvim', icon: '📅' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                            className={`app-nav-btn ${activeTab === tab.id ? 'app-nav-btn-active' : ''}`}
                        >
                            <span className="app-nav-btn-icon">{tab.icon}</span>
                            <span className="app-nav-btn-label">{tab.label}</span>
                            {tab.id === 'messages' && unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-ink-600">
                    <button onClick={logout} title="Çıkış Yap" className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">
                        <span className="app-sidebar-logout-label">Çıkış Yap</span>
                        {sidebarCollapsed && '⏻'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'home' && (
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Hoş Geldiniz, {getParentName()}</h1>
                        <p className="text-gray-600 mt-2">Çocuğunuzun tüm akademik sürecini buradan takip edebilirsiniz.</p>
                    </header>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-parent-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'home' && (
                            <div className="space-y-8">
                                <div className="app-card">
                                    <h2 className="text-lg font-bold mb-4">Bağlı Öğrenciler</h2>
                                    {children.length === 0 ? (
                                        <p className="text-gray-500 mb-4">Henüz hiçbir öğrenci hesabınıza bağlı değil. Çocuğunuzun kayıt olurken kullandığı e-posta adresini girerek bağlantı isteği gönderebilirsiniz.</p>
                                    ) : (
                                        <ul className="mb-4 space-y-2">
                                            {children.map(child => (
                                                <li key={child.id} className="flex items-center justify-between text-gray-800 font-medium">
                                                    <span>👤 {child.user.first_name} {child.user.last_name} <span className="text-gray-400 text-sm font-normal">({child.user.email})</span></span>
                                                    <button
                                                        onClick={() => handleUnlinkChild(child.id)}
                                                        disabled={unlinkingId === child.id}
                                                        className="text-xs text-red-600 hover:text-red-800 font-semibold disabled:opacity-50"
                                                    >
                                                        {unlinkingId === child.id ? 'Kaldırılıyor...' : 'Kaldır'}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {sentLinkRequests.filter(r => r.status !== 'ACCEPTED').length > 0 && (
                                        <ul className="mb-4 space-y-1 border-t border-gray-100 pt-3">
                                            {sentLinkRequests.filter(r => r.status !== 'ACCEPTED').map(r => (
                                                <li key={r.id} className="text-sm text-gray-500 flex items-center justify-between">
                                                    <span>{r.student_name}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                        {r.status === 'PENDING' ? 'Onay bekleniyor' : 'Reddedildi'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <form onSubmit={handleLinkChild} className="flex gap-2">
                                        <input
                                            type="email"
                                            required
                                            placeholder="Öğrencinin e-posta adresi"
                                            value={childEmail}
                                            onChange={(e) => setChildEmail(e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-parent-500"
                                        />
                                        <button type="submit" disabled={linking} className="app-btn-primary px-4 py-2 disabled:opacity-50">
                                            {linking ? 'Bağlanıyor...' : 'Öğrenci Ekle'}
                                        </button>
                                    </form>
                                    {linkMessage.text && (
                                        <p className={`mt-3 text-sm font-medium ${linkMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {linkMessage.text}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Bekleyen Ödevler</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{pendingTasks}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Tamamlanan Ödevler</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{completedTasks}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Girilen Sınavlar</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{exams.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Materyaller</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{resources.length}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'assignments' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Ödev Listesi</h2>
                                {assignments.length === 0 ? (
                                    <p className="text-gray-500">Şu an kayıtlı ödev bulunmuyor.</p>
                                ) : (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b text-gray-700">
                                                    <th className="p-4">Başlık</th>
                                                    <th className="p-4">Son Teslim</th>
                                                    <th className="p-4">Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {assignments.map(a => (
                                                    <tr key={a.id} className="hover:bg-gray-50">
                                                        <td className="p-4 font-medium text-gray-800">{a.title}</td>
                                                        <td className="p-4 text-sm text-gray-600">{new Date(a.due_date).toLocaleString('tr-TR')}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : a.is_late ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {a.status === 'COMPLETED' ? 'TAMAMLANDI' : a.is_late ? 'GECİKTİ' : 'BEKLİYOR'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'exams' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Sınav ve Deneme Notları</h2>
                                {exams.length === 0 ? (
                                    <p className="text-gray-500">Kayıtlı sınav notu bulunmuyor.</p>
                                ) : (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b text-gray-700">
                                                    <th className="p-4">Sınav Adı</th>
                                                    <th className="p-4">Tarih</th>
                                                    <th className="p-4">Öğretmen Notu</th>
                                                    <th className="p-4 text-right">Puan / Net</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {exams.map(e => (
                                                    <tr key={e.id} className="hover:bg-parent-500/10">
                                                        <td className="p-4 font-bold text-gray-800">{e.exam_name}</td>
                                                        <td className="p-4 text-sm text-gray-600">{new Date(e.exam_date).toLocaleDateString('tr-TR')}</td>
                                                        <td className="p-4 text-sm text-gray-600">{e.notes || '-'}</td>
                                                        <td className="p-4 text-right font-bold text-purple-700 text-lg">{e.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'resources' && (
                            <div className="app-card">
                                <h2 className="text-xl font-bold mb-6">Öğretmen Tarafından Paylaşılan Materyaller</h2>
                                {resources.length === 0 ? (
                                    <p className="text-gray-500">Paylaşılan bir materyal bulunmuyor.</p>
                                ) : (
                                    <ul className="divide-y border rounded-lg">
                                        {resources.map(r => (
                                            <li key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-bold text-gray-800">{r.title}</p>
                                                    <p className="text-xs text-gray-500">Yüklenme Tarihi: {new Date(r.uploaded_at).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                                {r.url && (
                                                    <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline">
                                                        İçeriği Görüntüle ↗
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {activeTab === 'marketplace' && (
                            <MarketplacePanel
                                onMessageTeacher={(teacherUserId) => {
                                    setMessagesInitialUserId(teacherUserId);
                                    setActiveTab('messages');
                                }}
                            />
                        )}

                        {activeTab === 'messages' && <MessagesPanel initialUserId={messagesInitialUserId} />}

                        {activeTab === 'calendar' && <CalendarPanel />}
                    </>
                )}
            </div>
        </div>
    );
}