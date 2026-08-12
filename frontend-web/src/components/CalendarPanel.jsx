import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

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

export default function CalendarPanel() {
    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [homeworks, setHomeworks] = useState([]);
    const [exams, setExams] = useState([]);

    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(toDateKey(new Date().toISOString()));

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
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
            const key = ex.exam_date;
            if (key) ensure(key).exams.push(ex);
        });
        return map;
    }, [lessons, homeworks, exams]);

    const monthGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstOfMonth = new Date(year, month, 1);
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
        <div>
            {loading ? (
                <p className="text-center text-gray-500 py-20">Takvim yükleniyor...</p>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[var(--role-accent)] text-white">
                        <button onClick={goPrevMonth} className="w-9 h-9 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl">‹</button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{MONTH_NAMES[currentMonthIndex]} {viewDate.getFullYear()}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={goToday} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition">Bugün</button>
                            <button onClick={goNextMonth} className="w-9 h-9 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl">›</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                        {DAY_NAMES.map(d => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">{d}</div>
                        ))}
                    </div>

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
                                    className={`relative h-24 border-b border-r border-gray-100 p-2 text-left transition flex flex-col
                                        ${inCurrentMonth ? 'bg-white hover:bg-[var(--role-accent-soft)]' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}
                                        ${isSelected ? 'ring-2 ring-[var(--role-accent)] ring-inset z-10' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-semibold ${isToday ? 'bg-[var(--role-accent)] text-white w-6 h-6 flex items-center justify-center rounded-full' : inCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
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

            {!loading && (
                <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
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

            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Ders</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Ödev Son Tarihi</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sınav</span>
            </div>
        </div>
    );
}
