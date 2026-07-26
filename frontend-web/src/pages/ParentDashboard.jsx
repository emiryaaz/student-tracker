import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('home');

    // Veri Stateleri
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);         // YENİ
    const [resources, setResources] = useState([]); // YENİ
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const [children, setChildren] = useState([]);
    const [childEmail, setChildEmail] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });

    // Öğrenci panelinde yaptığımız gibi veli için de tüm verileri çekiyoruz
    
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem('access');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resAssignments, resExams, resResources] = await Promise.all([
                    fetch('http://localhost:8000/api/school/assignments/', { headers }),
                    fetch('http://localhost:8000/api/school/exams/', { headers }),
                    fetch('http://localhost:8000/api/school/resources/', { headers })
                ]);

                if (resAssignments.ok) setAssignments(await resAssignments.json());
                if (resExams.ok) setExams(await resExams.json());
                if (resResources.ok) setResources(await resResources.json());

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
        const fetchUnreadCount = async () => {
            const token = localStorage.getItem('access');
            if (!token) return;

            try {
                const res = await fetch('http://localhost:8000/api/school/messages/unread-count/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unread_count);
                }
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
            const token = localStorage.getItem('access');
            const res = await fetch('http://localhost:8000/api/accounts/profiles/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChildren(data.children || []);
            }
        } catch (error) {
            console.error('Bağlı öğrenciler çekilemedi:', error);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const handleLinkChild = async (e) => {
        e.preventDefault();
        setLinking(true);
        setLinkMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('access');
            const res = await fetch('http://localhost:8000/api/accounts/profiles/link_child/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_email: childEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setChildren(data.children || []);
                setChildEmail('');
                setLinkMessage({ type: 'success', text: 'Öğrenci başarıyla bağlandı.' });
                fetchAllData(); // Yeni bağlanan öğrencinin ödev/sınav/kaynak verilerini de çek
            } else {
                setLinkMessage({ type: 'error', text: data.detail || 'Bir hata oluştu.' });
            }
        } catch (error) {
            setLinkMessage({ type: 'error', text: 'Sunucuya ulaşılamadı.' });
        } finally {
            setLinking(false);
        }
    };
    
    const getParentName = () => user?.first_name || user?.user?.first_name || 'Değerli Velimiz';

    const pendingTasks = assignments.filter(a => a.status === 'PENDING').length;
    const completedTasks = assignments.filter(a => a.status === 'COMPLETED').length;

    return (
        <div className="flex h-screen bg-gray-50 relative">
            {/* SOL MENÜ - Veli Teması (Mor) */}
            <div className="w-64 bg-purple-900 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-purple-800 tracking-wider">
                    EduTracker
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('home')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'home' ? 'bg-purple-700 shadow' : 'hover:bg-purple-800'}`}>
                        Genel Durum
                    </button>
                    <button onClick={() => setActiveTab('assignments')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'assignments' ? 'bg-purple-700 shadow' : 'hover:bg-purple-800'}`}>
                        Çocuğumun Ödevleri
                    </button>
                    <button onClick={() => setActiveTab('exams')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'exams' ? 'bg-purple-700 shadow' : 'hover:bg-purple-800'}`}>
                        Sınav Notları
                    </button>
                    <button onClick={() => setActiveTab('resources')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'resources' ? 'bg-purple-700 shadow' : 'hover:bg-purple-800'}`}>
                        Ders Materyalleri
                    </button>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="w-full text-left px-4 py-3 rounded transition hover:bg-gray-700 text-gray-300 hover:text-white flex items-center mb-2"
                    >
                        <span className="font-medium">Eğitmen Vitrini</span>
                    </button>

                    {/* Mesajlarım Butonu */}
                    <button
                        onClick={() => navigate('/messages')}
                        className="w-full text-left px-4 py-3 rounded transition bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <span className="font-bold">Mesajlarım
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                        </div>
                    </button>
                     <button
                        onClick={() => navigate('/calendar')}
                        className="w-full text-left px-4 py-3 rounded transition bg-indigo-600 hover:bg-indigo-700 text-white shadow flex items-center mt-2"
                    >
                        <span className="font-bold">Takvim</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-purple-800">
                    <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">Çıkış Yap</button>
                </div>
            </div>

            {/* ANA İÇERİK */}
            <div className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Hoş Geldiniz, {getParentName()}</h1>
                    <p className="text-gray-600 mt-2">Çocuğunuzun tüm akademik sürecini buradan takip edebilirsiniz.</p>
                </header>

                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <h2 className="text-lg font-bold mb-4">Bağlı Öğrenciler</h2>
                    {children.length === 0 ? (
                        <p className="text-gray-500 mb-4">Henüz hiçbir öğrenci hesabınıza bağlı değil. Çocuğunuzun kayıt olurken kullandığı e-posta adresini girerek bağlayabilirsiniz.</p>
                    ) : (
                        <ul className="mb-4 space-y-1">
                            {children.map(child => (
                                <li key={child.id} className="text-gray-800 font-medium">
                                    👤 {child.user.first_name} {child.user.last_name} <span className="text-gray-400 text-sm">({child.user.email})</span>
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
                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <button type="submit" disabled={linking} className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
                            {linking ? 'Bağlanıyor...' : 'Öğrenci Ekle'}
                        </button>
                    </form>
                    {linkMessage.text && (
                        <p className={`mt-3 text-sm font-medium ${linkMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {linkMessage.text}
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <>
                        {/* ÖZET EKRANI */}
                        {activeTab === 'home' && (
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
                        )}

                        {/* ÖDEVLER */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {a.status === 'COMPLETED' ? 'TAMAMLANDI' : 'BEKLİYOR'}
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

                        {/* SINAVLAR */}
                        {activeTab === 'exams' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                                                    <tr key={e.id} className="hover:bg-purple-50">
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

                        {/* KAYNAKLAR */}
                        {activeTab === 'resources' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                    </>
                )}
            </div>
        </div>
    );
}