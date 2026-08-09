import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TeacherDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    // SEKME VE VERİ STATELERİ
    const [activeTab, setActiveTab] = useState('home');
    const [studentsData, setStudentsData] = useState([]);
    const [assignmentsData, setAssignmentsData] = useState([]);
    const [examsData, setExamsData] = useState([]);       // Sınav verileri
    const [resourcesData, setResourcesData] = useState([]); // Kaynak verileri
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null); // YENİ: Profil verisi

    // MODAL STATELERİ
    const [activeModal, setActiveModal] = useState(null); // 'task', 'exam', 'resource' veya null
    const [selectedRelation, setSelectedRelation] = useState(null);
    const [selectedStudentName, setSelectedStudentName] = useState("");

    // FORM STATELERİ
    const [taskData, setTaskData] = useState({ title: '', description: '', due_date: '' });
    const [examData, setExamData] = useState({ exam_name: '', score: '', exam_date: '', notes: '' });
    const [resourceData, setResourceData] = useState({ title: '', url: '' });
    const [unreadCount, setUnreadCount] = useState(0);
    const [requests, setRequests] = useState([]);

    // VERİ ÇEKME FONKSİYONLARI (artık api.js üzerinden; token otomatik eklenir ve süresi dolarsa otomatik yenilenir)
    const fetchData = async (endpoint, setter) => {
        try {
            const response = await api.get(`/school/${endpoint}/`);
            setter(response.data);
        } catch (error) {
            console.error(`${endpoint} çekilemedi:`, error);
        }
    };

    // YENİ: PROFIL VERİSİNİ ÇEKME FONKSİYONU
    const fetchProfile = async () => {
        try {
            const response = await api.get('/accounts/profile/me/');
            setProfileData(response.data);
        } catch (error) {
            console.error('Profil çekilemedi:', error);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchData('my-students', setStudentsData),
                fetchData('assignments', setAssignmentsData),
                fetchData('exams', setExamsData),
                fetchData('resources', setResourcesData),
                fetchProfile() // YENİ: Yüklenirken profili de çek
            ]);
            setLoading(false);
        };
        fetchAllData();
    }, []);

    // YARDIMCI FONKSİYONLAR
    const getTeacherName = () => user?.first_name || user?.user?.first_name || 'Öğretmenimiz';
    const getStudentName = (relationId) => {
        const r = studentsData.find(x => x.id === relationId);
        return r ? `${r.student.first_name} ${r.student.last_name}` : 'Öğrenci';
    };

    // Ödev/Sınav/Kaynak listelerini öğrenciye göre gruplamak için ortak yardımcı fonksiyon
    const groupByStudent = (items) => {
        const groups = {};
        items.forEach(item => {
            const relId = item.relation;
            if (!groups[relId]) {
                groups[relId] = { relationId: relId, studentName: getStudentName(relId), items: [] };
            }
            groups[relId].items.push(item);
        });
        return Object.values(groups).sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr'));
    };

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const toggleGroup = (relId) => setCollapsedGroups(prev => ({ ...prev, [relId]: !prev[relId] }));

    const openModal = (type, relationId, studentFirst, studentLast) => {
        setSelectedRelation(relationId);
        setSelectedStudentName(`${studentFirst} ${studentLast}`);
        setActiveModal(type);
    };

    // FORM GÖNDERME İŞLEMLERİ (POST)
    const handleSubmit = async (e, endpoint, payload, refreshSetter, resetForm) => {
        e.preventDefault();
        try {
            await api.post(`/school/${endpoint}/`, { relation: selectedRelation, ...payload });
            alert("İşlem başarıyla kaydedildi!");
            setActiveModal(null);
            resetForm();
            fetchData(endpoint, refreshSetter);
        } catch (error) {
            console.error("Gönderilemedi:", error);
            alert("Bir hata oluştu. Lütfen bilgileri kontrol edin.");
        }
    };

    // YENİ: PROFİL GÜNCELLEME İŞLEMİ (PATCH)
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        if (e.target.title.value) formData.append('title', e.target.title.value);
        if (e.target.bio.value) formData.append('bio', e.target.bio.value);
        if (e.target.hourly_rate.value) formData.append('hourly_rate', e.target.hourly_rate.value);

        // Fotoğraf seçildiyse ekle
        if (e.target.profile_picture.files.length > 0) {
            formData.append('profile_picture', e.target.profile_picture.files[0]);
        }

        try {
            // ÖNEMLİ: Content-Type header'ını burada elle set ETMİYORUZ.
            // FormData gönderirken tarayıcı/axios boundary değerini kendisi otomatik ekler;
            // 'multipart/form-data' header'ını elle vermek boundary'siz bıraktığı için
            // backend formu parse edemez ve profil fotoğrafı yükleme isteği bozulur.
            await api.patch('/accounts/profile/me/', formData);
            alert("Profiliniz başarıyla güncellendi!");
            fetchProfile(); // Ekrandaki veriyi güncelle
        } catch (error) {
            console.error("Sunucu hatası:", error);
            alert("Güncelleme başarısız oldu. Lütfen tekrar deneyin.");
        }
    };

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await api.get('/school/messages/unread-count/');
                setUnreadCount(response.data.unread_count);
            } catch (error) {
                console.error("Bildirimler çekilemedi", error);
            }
        };

        fetchUnreadCount(); // Sayfa açılınca anında çek
        const interval = setInterval(fetchUnreadCount, 3000); // Her 3 saniyede bir kontrol et

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await api.get('/school/match-requests/');
                setRequests(response.data);
            } catch (error) {
                console.error("Talepler çekilemedi", error);
            }
        };

        fetchRequests();
    }, []);

    const handleRespond = async (id, status) => {
        try {
            await api.patch(`/school/match-requests/${id}/respond/`, { status: status });
            // Ekranda güncellenmiş durumu anında göstermek için listeyi filtrele veya güncelle
            setRequests(requests.map(req =>
                req.id === id ? { ...req, status: status } : req
            ));
        } catch (error) {
            console.error("Yanıt gönderilemedi", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 relative">
            {/* SOL MENÜ */}
            <div className="w-64 bg-ink-800 text-white flex flex-col">
                <div className="p-6 border-b border-ink-600">
                    <span className="font-display text-xl font-extrabold tracking-tight text-white">Edu<span className="text-teacher-400">Tracker</span></span>
                    <p className="text-xs text-ink-500 mt-0.5">Öğretmen Paneli</p>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => navigate('/messages')}
                        className="w-full text-left px-4 py-3 rounded transition bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-between mt-2"
                    >
                        <span className="font-bold">Mesajlarım
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce ml-2">
                                    {unreadCount}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => navigate('/calendar')}
                        className="w-full text-left px-4 py-3 rounded transition bg-indigo-600 hover:bg-indigo-700 text-white shadow flex items-center mb-4"
                    >
                        <span className="font-bold">Takvim</span>
                    </button>
                    {[
                        { id: 'profile', label: 'Profilim & Vitrin' },
                        { id: 'home', label: 'Ana Sayfa' },
                        { id: 'students', label: 'Öğrencilerim' },
                        { id: 'assignments', label: 'Ödev Takibi' },
                        { id: 'exams', label: 'Sınav Notları' },
                        { id: 'resources', label: 'Ders Materyalleri' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded transition ${activeTab === tab.id ? 'bg-teacher-600 shadow' : 'hover:bg-ink-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-ink-600">
                    <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold shadow">Çıkış Yap</button>
                </div>
            </div>

            {/* ANA İÇERİK */}
            <div className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Hoş Geldiniz, {getTeacherName()}</h1>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teacher-600"></div>
                    </div>
                ) : (
                    <>
                        {/* PROFIL SEKRESİ */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-8 rounded-xl border border-gray-100 max-w-3xl">
                                <h2 className="text-2xl font-bold mb-6 text-gray-800">Kişisel Vitrin Ayarlarım</h2>

                                <form onSubmit={handleProfileSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Ünvanı</label>
                                            <input name="title" defaultValue={profileData?.title || ''} type="text" placeholder="Örn: Kıdemli Matematik Öğretmeni" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teacher-500" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Saatlik Ders Ücreti (₺)</label>
                                            <input name="hourly_rate" defaultValue={profileData?.hourly_rate || ''} type="number" step="0.01" placeholder="Örn: 500" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teacher-500" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda</label>
                                            <textarea name="bio" rows="4" defaultValue={profileData?.bio || ''} placeholder="Geçmişinizden, eğitim tarzınızdan bahsedin..." className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teacher-500"></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Profil Fotoğrafı</label>
                                            {profileData?.profile_picture && (
                                                <div className="mb-2">
                                                    <img src={`http://localhost:8000${profileData.profile_picture}`} alt="Mevcut Profil" className="h-20 w-20 object-cover rounded-full border border-gray-200" />
                                                </div>
                                            )}
                                            <input name="profile_picture" type="file" accept="image/*" className="w-full border border-gray-300 p-2 rounded bg-gray-50" />
                                        </div>

                                        <button type="submit" className="w-full bg-teacher-600 text-white font-bold py-3 rounded-lg hover:bg-ink-700 transition mt-4">
                                            Profili ve Vitrini Kaydet
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ANA SAYFA İSTATİSTİKLERİ VE GELEN TALEPLER */}
                        {activeTab === 'home' && (
                            <div className="space-y-8">
                                {/* Üst Kısım: İstatistik Kartları */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase">Öğrenciler</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{studentsData.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase">Verilen Ödevler</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{assignmentsData.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase">Girilen Notlar</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{examsData.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-teacher-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase">Materyaller</h3>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{resourcesData.length}</p>
                                    </div>
                                </div>

                                {/* Alt Kısım: Gelen Ders Talepleri */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        Gelen Ders Talepleri
                                    </h2>
                                    
                                    {requests.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 font-medium">Henüz yeni bir ders talebiniz bulunmuyor.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {requests.map(req => (
                                                <div key={req.id} className="border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-md bg-white">
                                                    
                                                    {/* Öğrenci Bilgisi ve Not */}
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 text-lg">
                                                            {req.student_name}
                                                        </h4>
                                                        <div className="bg-amber-50/50 p-3 rounded-lg mt-2 border border-amber-100/50">
                                                            <p className="text-sm text-gray-700">
                                                                <span className="font-semibold text-teacher-700">Not: </span> 
                                                                {req.note ? req.note : <span className="italic text-gray-400">Not eklenmemiş.</span>}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                                            🕒 {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </div>

                                                    {/* Aksiyon Butonları veya Durum Rozeti */}
                                                    <div className="w-full md:w-auto flex shrink-0">
                                                        {req.status === 'PENDING' ? (
                                                            <div className="flex gap-2 w-full md:w-auto">
                                                                <button 
                                                                    onClick={() => handleRespond(req.id, 'ACCEPTED')}
                                                                    className="flex-1 md:flex-none bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-sm"
                                                                >
                                                                    Kabul Et
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRespond(req.id, 'REJECTED')}
                                                                    className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-lg font-semibold transition border border-red-200/50"
                                                                >
                                                                    Reddet
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={`px-4 py-2 rounded-lg text-sm font-bold w-full md:w-auto text-center ${
                                                                req.status === 'ACCEPTED' 
                                                                ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                            }`}>
                                                                {req.status === 'ACCEPTED' ? '✓ Kabul Edildi' : '✕ Reddedildi'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ÖĞRENCİLERİM SEKMESİ */}
                        {activeTab === 'students' && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">Öğrenci Listesi</h2>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-700 border-b">
                                                <th className="p-4">Öğrenci Adı</th>
                                                <th className="p-4">Ders</th>
                                                <th className="p-4 text-right">Hızlı İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {studentsData.map((rel) => (
                                                <tr key={rel.id} className="hover:bg-amber-50 transition">
                                                    <td className="p-4 font-medium">{rel.student.first_name} {rel.student.last_name}</td>
                                                    <td className="p-4 text-sm">{rel.subject ? `${rel.subject.grade_level}. Sınıf - ${rel.subject.name}` : 'Ders belirtilmemiş'}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button onClick={() => openModal('task', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm">+ Ödev</button>
                                                        <button onClick={() => openModal('exam', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm">+ Not</button>
                                                        <button onClick={() => openModal('resource', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-teacher-600 hover:bg-ink-700 text-white px-3 py-1.5 rounded text-sm">+ Kaynak</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ÖDEV TAKİBİ (öğrenciye göre gruplu) */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">Verilen Ödevler</h2>
                                {assignmentsData.length === 0 ? (
                                    <p className="text-gray-500">Henüz verilmiş bir ödev yok.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {groupByStudent(assignmentsData).map(group => (
                                            <div key={group.relationId} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleGroup(group.relationId)}
                                                    className="w-full flex justify-between items-center bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                                                >
                                                    <span className="font-bold text-gray-800">{group.studentName}</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-2">
                                                        {group.items.length} ödev
                                                        <span className={`transition-transform ${collapsedGroups[group.relationId] ? '' : 'rotate-180'}`}>▾</span>
                                                    </span>
                                                </button>
                                                {!collapsedGroups[group.relationId] && (
                                                    <ul className="divide-y">
                                                        {group.items.map(a => (
                                                            <li key={a.id} className="py-3 px-4 flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{a.title}</p>
                                                                    <p className="text-sm text-gray-500">Son Teslim: {new Date(a.due_date).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    {a.status}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SINAV NOTLARI SEKMESİ (öğrenciye göre gruplu) */}
                        {activeTab === 'exams' && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">Sınav ve Deneme Sonuçları</h2>
                                {examsData.length === 0 ? (
                                    <p className="text-gray-500">Henüz girilmiş bir sınav notu yok.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {groupByStudent(examsData).map(group => (
                                            <div key={group.relationId} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleGroup(group.relationId)}
                                                    className="w-full flex justify-between items-center bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                                                >
                                                    <span className="font-bold text-gray-800">{group.studentName}</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-2">
                                                        {group.items.length} sınav
                                                        <span className={`transition-transform ${collapsedGroups[group.relationId] ? '' : 'rotate-180'}`}>▾</span>
                                                    </span>
                                                </button>
                                                {!collapsedGroups[group.relationId] && (
                                                    <ul className="divide-y">
                                                        {group.items.map(e => (
                                                            <li key={e.id} className="py-3 px-4 flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{e.exam_name}</p>
                                                                    <p className="text-sm text-gray-500">{new Date(e.exam_date).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">Puan: {e.score}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* KAYNAKLAR SEKMESİ (öğrenciye göre gruplu) */}
                        {activeTab === 'resources' && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">Paylaşılan Materyaller</h2>
                                {resourcesData.length === 0 ? (
                                    <p className="text-gray-500">Henüz paylaşılmış bir materyal yok.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {groupByStudent(resourcesData).map(group => (
                                            <div key={group.relationId} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleGroup(group.relationId)}
                                                    className="w-full flex justify-between items-center bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                                                >
                                                    <span className="font-bold text-gray-800">{group.studentName}</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-2">
                                                        {group.items.length} kaynak
                                                        <span className={`transition-transform ${collapsedGroups[group.relationId] ? '' : 'rotate-180'}`}>▾</span>
                                                    </span>
                                                </button>
                                                {!collapsedGroups[group.relationId] && (
                                                    <ul className="divide-y">
                                                        {group.items.map(r => (
                                                            <li key={r.id} className="py-3 px-4 flex justify-between items-center">
                                                                <p className="font-bold text-gray-800">{r.title}</p>
                                                                {r.url && (
                                                                    <a href={r.url} target="_blank" rel="noreferrer" className="text-teacher-700 hover:underline text-sm font-semibold">Linki Aç ↗</a>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* TÜM MODALLAR İÇİN ORTAK KAPSAYICI */}
            {activeModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {activeModal === 'task' && 'Yeni Ödev Ata'}
                                {activeModal === 'exam' && 'Sınav Notu Gir'}
                                {activeModal === 'resource' && 'Kaynak Paylaş'}
                            </h2>
                            <p className="text-gray-600">Öğrenci: <span className="font-semibold text-teacher-700">{selectedStudentName}</span></p>
                        </div>

                        {/* ÖDEV FORMU */}
                        {activeModal === 'task' && (
                            <form onSubmit={(e) => handleSubmit(e, 'assignments', { ...taskData, status: 'PENDING' }, setAssignmentsData, () => setTaskData({ title: '', description: '', due_date: '' }))} className="space-y-4">
                                <input type="text" required placeholder="Ödev Başlığı" className="w-full border p-2 rounded" value={taskData.title} onChange={e => setTaskData({ ...taskData, title: e.target.value })} />
                                <textarea placeholder="Açıklama" className="w-full border p-2 rounded" value={taskData.description} onChange={e => setTaskData({ ...taskData, description: e.target.value })}></textarea>
                                <input type="datetime-local" required className="w-full border p-2 rounded" value={taskData.due_date} onChange={e => setTaskData({ ...taskData, due_date: e.target.value })} />
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-teacher-600 text-white rounded">Gönder</button></div>
                            </form>
                        )}

                        {/* SINAV FORMU */}
                        {activeModal === 'exam' && (
                            <form onSubmit={(e) => handleSubmit(e, 'exams', examData, setExamsData, () => setExamData({ exam_name: '', score: '', exam_date: '', notes: '' }))} className="space-y-4">
                                <input type="text" required placeholder="Sınav/Konu Adı (Örn: Matematik Vize)" className="w-full border p-2 rounded" value={examData.exam_name} onChange={e => setExamData({ ...examData, exam_name: e.target.value })} />
                                <input type="number" step="0.01" required placeholder="Puan / Net" className="w-full border p-2 rounded" value={examData.score} onChange={e => setExamData({ ...examData, score: e.target.value })} />
                                <input type="date" required className="w-full border p-2 rounded" value={examData.exam_date} onChange={e => setExamData({ ...examData, exam_date: e.target.value })} />
                                <textarea placeholder="Öğretmen Notu (Opsiyonel)" className="w-full border p-2 rounded" value={examData.notes} onChange={e => setExamData({ ...examData, notes: e.target.value })}></textarea>
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Kaydet</button></div>
                            </form>
                        )}

                        {/* KAYNAK FORMU */}
                        {activeModal === 'resource' && (
                            <form onSubmit={(e) => handleSubmit(e, 'resources', resourceData, setResourcesData, () => setResourceData({ title: '', url: '' }))} className="space-y-4">
                                <input type="text" required placeholder="Kaynak Başlığı (Örn: Türev PDF)" className="w-full border p-2 rounded" value={resourceData.title} onChange={e => setResourceData({ ...resourceData, title: e.target.value })} />
                                <input type="url" placeholder="Link/URL (Opsiyonel)" className="w-full border p-2 rounded" value={resourceData.url} onChange={e => setResourceData({ ...resourceData, url: e.target.value })} />
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-teacher-600 text-white rounded">Paylaş</button></div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}