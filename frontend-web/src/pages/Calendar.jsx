import { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Backend'den gelen ISO tarih/saat metnini yerel 'YYYY-MM-DD' anahtarına çevirir
const toDateKey = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function Calendar() {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [homeworks, setHomeworks] = useState([]);
    const [exams, setExams] = useState([]);

    const [viewDate, setViewDate] = useState(new Date()); // Görüntülenen ay
    const [selectedDate, setSelectedDate] = useState(toDateKey(new Date().toISOString()));

     useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Promise.all yerine allSettled: biri başarısız olsa bile diğer ikisi takvimde görünsün
                const [lessonsRes, homeworksRes, examsRes] = await Promise.allSettled([
                    api.get('/school/calendar-events/'),
                    api.get('/school/assignments/'),
                    api.get('/school/exams/'),
                ]);
                setLessons(lessonsRes.status === 'fulfilled' ? lessonsRes.value.data : []);
                setHomeworks(homeworksRes.status === 'fulfilled' ? homeworksRes.value.data : []);
                setExams(examsRes.status === 'fulfilled' ? examsRes.value.data : []);
            } catch (error) {
                console.error('Takvim verileri çekilemedi:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Tarih -> { lessons: [], homeworks: [], exams: [] } eşlemesi
    const eventsByDate = useMemo(() => {
        const map = {};
        const ensure = (key) => {
            if (!map[key]) map[key] = { lessons: [], homeworks: [], exams: [] };
            return map[key];
        };
        lessons.forEach(ev => {
            const key = toDateKey(ev.start_time);
            if (key) ensure(key).lessons.push(ev);
        });
        homeworks.forEach(hw => {
            const key = toDateKey(hw.due_date);
            if (key) ensure(key).homeworks.push(hw);
        });
        exams.forEach(ex => {
            // exam_date saf 'YYYY-MM-DD' formatında gelir (DateField), doğrudan kullanılabilir
            const key = ex.exam_date;
            if (key) ensure(key).exams.push(ex);
        });
        return map;
    }, [lessons, homeworks, exams]);

    // Ay ızgarasını oluştur (Pazartesi başlangıçlı, 6 hafta x 7 gün)
    const monthGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        // JS'te getDay(): 0=Pazar...6=Cumartesi. Pazartesi başlangıcına çeviriyoruz.
        const startOffset = (firstOfMonth.getDay() + 6) % 7;
        const gridStart = new Date(year, month, 1 - startOffset);

        const cells = [];
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(gridStart);
            cellDate.setDate(gridStart.getDate() + i);
            cells.push(cellDate);
        }
        return cells;
    }, [viewDate]);

    const todayKey = toDateKey(new Date().toISOString());
    const currentMonthIndex = viewDate.getMonth();

    const goPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const goNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const goToday = () => {
        const now = new Date();
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(toDateKey(now.toISOString()));
    };

    const selectedEvents = eventsByDate[selectedDate] || { lessons: [], homeworks: [], exams: [] };
    const selectedDateLabel = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
        : '';

    return (
        <div className="min-h-screen bg-gray-100">
            {/* ÜST BAR */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-gray-800 font-medium"
                    >
                        ← Panele Dön
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Takvim</h1>
                </div>
                <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Çıkış Yap</button>
            </div>

            <div className="max-w-5xl mx-auto p-6">
                {loading ? (
                    <p className="text-center text-gray-500 py-20">Takvim yükleniyor...</p>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        {/* AY NAVİGASYONU */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-700 to-indigo-500 text-white">
                            <button onClick={goPrevMonth} className="w-9 h-9 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl">‹</button>
                            <div className="text-center">
                                <h2 className="text-xl font-bold">{MONTH_NAMES[currentMonthIndex]} {viewDate.getFullYear()}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={goToday} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition">Bugün</button>
                                <button onClick={goNextMonth} className="w-9 h-9 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl">›</button>
                            </div>
                        </div>

                        {/* HAFTA GÜNLERİ */}
                        <div className="grid grid-cols-7 border-b bg-gray-50">
                            {DAY_NAMES.map(d => (
                                <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">{d}</div>
                            ))}
                        </div>

                        {/* GÜN IZGARASI */}
                        <div className="grid grid-cols-7">
                            {monthGrid.map((cellDate, idx) => {
                                const key = toDateKey(cellDate.toISOString());
                                const inCurrentMonth = cellDate.getMonth() === currentMonthIndex;
                                const isToday = key === todayKey;
                                const isSelected = key === selectedDate;
                                const dayEvents = eventsByDate[key];

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(key)}
                                        className={`relative h-24 border-b border-r p-2 text-left transition flex flex-col
                                            ${inCurrentMonth ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}
                                            ${isSelected ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-semibold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : inCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                                            {cellDate.getDate()}
                                        </span>
                                        {dayEvents && (
                                            <div className="mt-auto flex gap-1">
                                                {dayEvents.lessons.length > 0 && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Ders" />}
                                                {dayEvents.homeworks.length > 0 && <span className="w-2 h-2 rounded-full bg-green-500" title="Ödev Son Tarihi" />}
                                                {dayEvents.exams.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500" title="Sınav" />}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SEÇİLİ GÜN DETAYLARI */}
                {!loading && (
                    <div className="mt-6 bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1 capitalize">{selectedDateLabel}</h3>
                        {selectedEvents.lessons.length === 0 && selectedEvents.homeworks.length === 0 && selectedEvents.exams.length === 0 ? (
                            <p className="text-gray-400 mt-3">Bu tarihte herhangi bir etkinlik bulunmuyor.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {selectedEvents.lessons.map(ev => (
                                    <div key={`lesson-${ev.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                                        <span className="w-2.5 h-2.5 mt-1.5 rounded-full bg-yellow-400 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-800">{ev.title}</p>
                                            <p className="text-sm text-gray-500">{formatTime(ev.start_time)} - {formatTime(ev.end_time)} · Ders</p>
                                            {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
                                        </div>
                                    </div>
                                ))}
                                {selectedEvents.homeworks.map(hw => (
                                    <div key={`hw-${hw.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                                        <span className="w-2.5 h-2.5 mt-1.5 rounded-full bg-green-500 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-800">{hw.title}</p>
                                            <p className="text-sm text-gray-500">
                                                Son teslim: {formatTime(hw.due_date)} · Ödev
                                                {hw.student_name && ` · ${hw.student_name}`}
                                            </p>
                                            {hw.description && <p className="text-sm text-gray-500 mt-1">{hw.description}</p>}
                                        </div>
                                    </div>
                                ))}
                                {selectedEvents.exams.map(ex => (
                                    <div key={`exam-${ex.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                                        <span className="w-2.5 h-2.5 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-800">{ex.exam_name}</p>
                                            <p className="text-sm text-gray-500">
                                                Sınav · Puan: {ex.score}
                                                {ex.student_name && ` · ${ex.student_name}`}
                                            </p>
                                            {ex.notes && <p className="text-sm text-gray-500 mt-1">{ex.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RENK AÇIKLAMASI */}
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Ders</span>
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Ödev Son Tarihi</span>
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sınav</span>
                </div>
            </div>
        </div>
    );
}