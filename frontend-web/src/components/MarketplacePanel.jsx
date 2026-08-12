import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MarketplacePanel({ onMessageTeacher }) {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/accounts/teachers/')
            .then(res => {
                setTeachers(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Eğitmenler çekilemedi:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--role-accent)]"></div>
            </div>
        );
    }

    if (teachers.length === 0) {
        return (
            <div className="app-card text-center text-gray-500 py-12">
                Şu an listelenen bir eğitmen bulunmuyor.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map(teacher => (
                <div key={teacher.id} className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition relative">
                    <div className="flex items-center gap-4 mb-4">
                        {teacher.profile_picture ? (
                            <img src={`http://localhost:8000${teacher.profile_picture}`} alt={teacher.first_name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[var(--role-accent-soft)] text-[var(--role-accent)] flex items-center justify-center text-xl font-bold">
                                {teacher.first_name ? teacher.first_name[0] : '?'}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1">
                                {teacher.first_name} {teacher.last_name}
                            </h3>
                            <p className="text-[var(--role-accent)] text-sm font-medium">{teacher.title || 'Eğitmen'}</p>
                            {teacher.is_verified ? (
                                <p className="text-green-600 text-xs font-bold mt-0.5">✓ Doğrulanmış Öğretmen</p>
                            ) : (
                                <p className="text-red-600 text-xs font-bold mt-0.5">⚠ Doğrulanmamış Öğretmen</p>
                            )}
                        </div>
                    </div>

                    {!teacher.is_verified && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                            Sistemimiz tarafından doğrulanmamış öğretmenler ile çalışmanız önerilmez.
                        </p>
                    )}

                    <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                        {teacher.bio || 'Henüz bir açıklama eklenmemiş.'}
                    </p>

                    <div className="mt-auto border-t border-gray-100 pt-4 flex flex-wrap gap-3 justify-end items-center">
                        <button
                            onClick={() => navigate(`/teacher/${teacher.id}`)}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm flex-1 sm:flex-none text-center"
                        >
                            Profili İncele
                        </button>

                        <button
                            onClick={() => onMessageTeacher?.(teacher.user_id)}
                            className="bg-[var(--role-accent)] hover:bg-[var(--role-accent-hover)] text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                            </svg>
                            Mesaj At
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
