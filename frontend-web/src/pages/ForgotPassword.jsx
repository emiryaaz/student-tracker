import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/accounts/password-reset/request/', { email });
            // Backend her durumda aynı genel cevabı döner (kullanıcı numaralandırmasını
            // önlemek için), bu yüzden burada e-postanın gerçekten kayıtlı olup olmadığını
            // ayırt etmiyoruz.
            setSent(true);
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Şifremi Unuttum</h2>

                {sent ? (
                    <div className="text-center space-y-4">
                        <p className="text-gray-700 text-sm">
                            Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.
                            Lütfen gelen kutunuzu kontrol edin.
                        </p>
                        <Link to="/login" className="inline-block text-blue-600 hover:underline text-sm">
                            Girişe dön
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-gray-600 text-sm">
                            Hesabınıza kayıtlı e-posta adresini girin, şifrenizi sıfırlamanız için bir link gönderelim.
                        </p>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">E-posta</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                        </button>
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-blue-600 hover:underline">
                                Girişe dön
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
