import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'STUDENT'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/accounts/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Kayıt başarılı! Lütfen giriş yapın.");
                navigate('/login');
            } else {
                const data = await response.json();
                setError(data.email ? "Bu e-posta adresi zaten kullanılıyor." : "Kayıt olurken bir hata oluştu.");
            }
        } catch (err) {
            setError("Sunucuya ulaşılamıyor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Aramıza Katıl
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        EduTracker ile eğitimin kontrolünü elinize alın.
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adınız</label>
                            <input name="first_name" type="text" required className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Soyadınız</label>
                            <input name="last_name" type="text" required className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                        <input name="email" type="email" required className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input name="password" type="password" required className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Türü</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="TEACHER">Öğretmen</option>
                            <option value="STUDENT">Öğrenci</option>
                            <option value="PARENT">Veli</option>
                        </select>
                    </div>

                    <div>
                        <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                            {loading ? 'Kaydediliyor...' : 'Ücretsiz Kayıt Ol'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <span className="text-gray-600 text-sm">Zaten üye misin? </span>
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        </div>
    );
}