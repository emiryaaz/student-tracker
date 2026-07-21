import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

    // VERİ ÇEKME FONKSİYONLARI
    const fetchData = async (endpoint, setter) => {
        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`http://localhost:8000/api/school/${endpoint}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setter(data);
            }
        } catch (error) {
            console.error(`${endpoint} çekilemedi:`, error);
        }
    };

    // YENİ: PROFIL VERİSİNİ ÇEKME FONKSİYONU
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await fetch('http://localhost:8000/api/accounts/profile/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            }
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

    const openModal = (type, relationId, studentFirst, studentLast) => {
        setSelectedRelation(relationId);
        setSelectedStudentName(`${studentFirst} ${studentLast}`);
        setActiveModal(type);
    };

    // FORM GÖNDERME İŞLEMLERİ (POST)
    const handleSubmit = async (e, endpoint, payload, refreshSetter, resetForm) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`http://localhost:8000/api/school/${endpoint}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ relation: selectedRelation, ...payload })
            });

            if (response.ok) {
                alert("İşlem başarıyla kaydedildi!");
                setActiveModal(null);
                resetForm();
                fetchData(endpoint, refreshSetter);
            } else {
                alert("Bir hata oluştu. Lütfen bilgileri kontrol edin.");
            }
        } catch (error) {
            console.error("Gönderilemedi:", error);
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
            const token = localStorage.getItem('access');
            const res = await fetch('http://localhost:8000/api/accounts/profile/me/', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData // JSON değil, FormData gönderiyoruz
            });
            
            if (res.ok) {
                alert("Profiliniz başarıyla güncellendi!");
                fetchProfile(); // Ekrandaki veriyi güncelle
            } else {
                alert("Güncelleme başarısız oldu. Lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error("Sunucu hatası:", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 relative">
            {/* SOL MENÜ */}
            <div className="w-64 bg-blue-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-blue-700">EduTracker</div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => navigate('/messages')}
                        className="w-full text-left px-4 py-3 rounded transition bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-between mt-2 mb-4"
                    >
                        <span className="font-bold">Mesajlarım</span>
                    </button>
                    {[
                        { id: 'profile', label: 'Profilim & Vitrin' }, // YENİ SEKME EKLENDİ
                        { id: 'home', label: 'Ana Sayfa' },
                        { id: 'students', label: 'Öğrencilerim' },
                        { id: 'assignments', label: 'Ödev Takibi' },
                        { id: 'exams', label: 'Sınav Notları' },
                        { id: 'resources', label: 'Ders Materyalleri' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded transition ${activeTab === tab.id ? 'bg-blue-600 shadow' : 'hover:bg-blue-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-blue-700">
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
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* YENİ: PROFIL SEKRESİ */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-8 rounded-lg shadow-sm max-w-3xl">
                                <h2 className="text-2xl font-bold mb-6 text-gray-800">Kişisel Vitrin Ayarlarım</h2>
                                
                                <form onSubmit={handleProfileSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Ünvanı</label>
                                            <input name="title" defaultValue={profileData?.title || ''} type="text" placeholder="Örn: Kıdemli Matematik Öğretmeni" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Saatlik Ders Ücreti (₺)</label>
                                            <input name="hourly_rate" defaultValue={profileData?.hourly_rate || ''} type="number" step="0.01" placeholder="Örn: 500" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda</label>
                                            <textarea name="bio" rows="4" defaultValue={profileData?.bio || ''} placeholder="Geçmişinizden, eğitim tarzınızdan bahsedin..." className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"></textarea>
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
                                        
                                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mt-4">
                                            Profili ve Vitrini Kaydet
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ANA SAYFA İSTATİSTİKLERİ */}
                        {activeTab === 'home' && (
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
                                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                                    <h3 className="text-gray-500 text-sm font-bold uppercase">Materyaller</h3>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{resourcesData.length}</p>
                                </div>
                            </div>
                        )}

                        {/* ÖĞRENCİLERİM SEKMESİ */}
                        {activeTab === 'students' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
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
                                                <tr key={rel.id} className="hover:bg-blue-50 transition">
                                                    <td className="p-4 font-medium">{rel.student.first_name} {rel.student.last_name}</td>
                                                    <td className="p-4 text-sm">{rel.subject.grade_level}. Sınıf - {rel.subject.name}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button onClick={() => openModal('task', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm">+ Ödev</button>
                                                        <button onClick={() => openModal('exam', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm">+ Not</button>
                                                        <button onClick={() => openModal('resource', rel.id, rel.student.first_name, rel.student.last_name)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm">+ Kaynak</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ÖDEV TAKİBİ */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-6">Verilen Ödevler</h2>
                                <ul className="divide-y">
                                    {assignmentsData.map(a => (
                                        <li key={a.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{a.title}</p>
                                                <p className="text-sm text-gray-500">{getStudentName(a.relation)} - {new Date(a.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {a.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* SINAV NOTLARI SEKMESİ */}
                        {activeTab === 'exams' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-6">Sınav ve Deneme Sonuçları</h2>
                                <ul className="divide-y">
                                    {examsData.map(e => (
                                        <li key={e.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{e.exam_name}</p>
                                                <p className="text-sm text-gray-500">{getStudentName(e.relation)} - {new Date(e.exam_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">Puan: {e.score}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* KAYNAKLAR SEKMESİ */}
                        {activeTab === 'resources' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-6">Paylaşılan Materyaller</h2>
                                <ul className="divide-y">
                                    {resourcesData.map(r => (
                                        <li key={r.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{r.title}</p>
                                                <p className="text-sm text-gray-500">Öğrenci: {getStudentName(r.relation)}</p>
                                            </div>
                                            {r.url && (
                                                <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-semibold">Linki Aç ↗</a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
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
                            <p className="text-gray-600">Öğrenci: <span className="font-semibold text-blue-600">{selectedStudentName}</span></p>
                        </div>

                        {/* ÖDEV FORMU */}
                        {activeModal === 'task' && (
                            <form onSubmit={(e) => handleSubmit(e, 'assignments', { ...taskData, status: 'PENDING' }, setAssignmentsData, () => setTaskData({title:'', description:'', due_date:''}))} className="space-y-4">
                                <input type="text" required placeholder="Ödev Başlığı" className="w-full border p-2 rounded" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                                <textarea placeholder="Açıklama" className="w-full border p-2 rounded" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})}></textarea>
                                <input type="datetime-local" required className="w-full border p-2 rounded" value={taskData.due_date} onChange={e => setTaskData({...taskData, due_date: e.target.value})} />
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Gönder</button></div>
                            </form>
                        )}

                        {/* SINAV FORMU */}
                        {activeModal === 'exam' && (
                            <form onSubmit={(e) => handleSubmit(e, 'exams', examData, setExamsData, () => setExamData({exam_name:'', score:'', exam_date:'', notes:''}))} className="space-y-4">
                                <input type="text" required placeholder="Sınav/Konu Adı (Örn: Matematik Vize)" className="w-full border p-2 rounded" value={examData.exam_name} onChange={e => setExamData({...examData, exam_name: e.target.value})} />
                                <input type="number" step="0.01" required placeholder="Puan / Net" className="w-full border p-2 rounded" value={examData.score} onChange={e => setExamData({...examData, score: e.target.value})} />
                                <input type="date" required className="w-full border p-2 rounded" value={examData.exam_date} onChange={e => setExamData({...examData, exam_date: e.target.value})} />
                                <textarea placeholder="Öğretmen Notu (Opsiyonel)" className="w-full border p-2 rounded" value={examData.notes} onChange={e => setExamData({...examData, notes: e.target.value})}></textarea>
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Kaydet</button></div>
                            </form>
                        )}

                        {/* KAYNAK FORMU */}
                        {activeModal === 'resource' && (
                            <form onSubmit={(e) => handleSubmit(e, 'resources', resourceData, setResourcesData, () => setResourceData({title:'', url:''}))} className="space-y-4">
                                <input type="text" required placeholder="Kaynak Başlığı (Örn: Türev PDF)" className="w-full border p-2 rounded" value={resourceData.title} onChange={e => setResourceData({...resourceData, title: e.target.value})} />
                                <input type="url" placeholder="Link/URL (Opsiyonel)" className="w-full border p-2 rounded" value={resourceData.url} onChange={e => setResourceData({...resourceData, url: e.target.value})} />
                                <div className="flex justify-end space-x-2"><button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Paylaş</button></div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}