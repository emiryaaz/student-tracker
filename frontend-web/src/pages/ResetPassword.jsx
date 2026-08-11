import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/accounts/password-reset/confirm/', {
                uid: uidb64,
                token,
                new_password: password,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(detail || 'Bağlantının süresi dolmuş ya da geçersiz. Lütfen yeniden şifre sıfırlama isteği gönderin.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Yeni Şifre Belirle</h2>

                {success ? (
                    <div className="text-center space-y-4">
                        <p className="text-green-600 text-sm">
                            Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                        <Link to="/login" className="inline-block text-blue-600 hover:underline text-sm">
                            Girişe dön
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Yeni Şifre</label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Yeni Şifre (Tekrar)</label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
