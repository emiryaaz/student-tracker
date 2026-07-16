import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // AuthContext'ten login fonksiyonunu çekiyoruz
    const { login } = useContext(AuthContext); 
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // 1. Adım: E-posta ve şifre ile token al
            const tokenResponse = await api.post('/token/', { email, password });
            const accessToken = tokenResponse.data.access;
            
            // 2. Adım: Geçici olarak bu istek için header'a token'ı ekle
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // 3. Adım: Kullanıcının profil bilgilerini ve rolünü çek
            const profileResponse = await api.get('/accounts/profiles/me/');
            
            // 4. Adım: Hem kullanıcı verisini hem de token'ı Context'e kaydet
            login(profileResponse.data, accessToken);
            
            // Başarılı girişten sonra Dashboard'a yönlendir
            navigate('/dashboard');
        } catch (err) {
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Öğrenci Takip Sistemi</h2>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleLogin} className="space-y-4">
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
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Şifre</label>
                        <input 
                            type="password" 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}