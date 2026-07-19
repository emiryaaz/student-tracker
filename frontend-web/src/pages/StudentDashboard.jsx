import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    
    const [activeTab, setActiveTab] = useState('home');
    
    // Veri Stateleri
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);         // YENİ
    const [resources, setResources] = useState([]); // YENİ
    const [loading, setLoading] = useState(true);

    // Tüm verileri (Ödev, Sınav, Kaynak) backend'den aynı anda çekiyoruz
    useEffect(() => {
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

        fetchAllData();
    }, []);

    const getStudentName = () => user?.first_name || user?.user?.first_name || 'Öğrenci';

    const markAsCompleted = async (assignmentId) => {
        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`http://localhost:8000/api/school/assignments/${assignmentId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'COMPLETED' })
            });

            if (response.ok) {
                setAssignments(prev => prev.map(task => task.id === assignmentId ? { ...task, status: 'COMPLETED' } : task));
            }
        } catch (error) {
            console.error("İstek başarısız:", error);
        }
    };

    const pendingTasks = assignments.filter(a => a.status === 'PENDING').length;
    const completedTasks = assignments.filter(a => a.status === 'COMPLETED').length;

    return (
        <div className="flex h-screen bg-gray-50 relative">
            {/* SOL MENÜ */}
            <div className="w-64 bg-teal-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-teal-700 tracking-wider">
                    EduTracker
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('home')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'home' ? 'bg-teal-600 shadow' : 'hover:bg-teal-700'}`}>
                        Özet Ekranı
                    </button>
                    <button onClick={() => setActiveTab('assignments')} className={`w-full text-left px-4 py-3 rounded transition flex justify-between items-center ${activeTab === 'assignments' ? 'bg-teal-600 shadow' : 'hover:bg-teal-700'}`}>
                        <span>Ödevlerim</span>
                        {pendingTasks > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingTasks}</span>}
                    </button>
                    <button onClick={() => setActiveTab('exams')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'exams' ? 'bg-teal-600 shadow' : 'hover:bg-teal-700'}`}>
                        Sınav Sonuçlarım
                    </button>
                    <button onClick={() => setActiveTab('resources')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'resources' ? 'bg-teal-600 shadow' : 'hover:bg-teal-700'}`}>
                        Ders Materyalleri
                    </button>
                </nav>
                <div className="p-4 border-t border-teal-700">
                    <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">Çıkış Yap</button>
                </div>
            </div>

            {/* ANA İÇERİK */}
            <div className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Merhaba, {getStudentName()} 👋</h1>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                    </div>
                ) : (
                    <>
                        {/* ÖZET EKRANI */}
                        {activeTab === 'home' && (
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
                        )}

                        {/* ÖDEVLERİM */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-6">Tüm Ödevlerim</h2>
                                {assignments.length === 0 ? (
                                    <p className="text-gray-500">Şu an için hiç ödevin yok.</p>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {assignments.map(a => (
                                            <div key={a.id} className={`border rounded-lg p-5 shadow-sm transition ${a.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-lg font-bold text-gray-800">{a.title}</h3>
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${a.status === 'COMPLETED' ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {a.status === 'COMPLETED' ? 'TAMAMLANDI' : 'BEKLİYOR'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-4">{a.description}</p>
                                                <div className="text-xs text-gray-500 mb-4">Son Teslim: {new Date(a.due_date).toLocaleString('tr-TR')}</div>
                                                {a.status === 'PENDING' && (
                                                    <button onClick={() => markAsCompleted(a.id)} className="w-full bg-teal-600 text-white font-medium py-2 rounded">
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
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                                                    <tr key={e.id} className="hover:bg-teal-50">
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
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                    </>
                )}
            </div>
        </div>
    );
}