import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Üst Navigasyon */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="text-2xl font-black text-blue-800 tracking-tighter">
                        EduTracker<span className="text-blue-500">.</span>
                    </div>
                    <div className="space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition">
                            Giriş Yap
                        </Link>
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-md">
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero (Ana Görsel) Alanı */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-10 lg:mt-0">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Eğitimi Takip Etmenin <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">En Akıllı Yolu</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                        Öğretmenler, öğrenciler ve veliler için tasarlanmış hepsi bir arada eğitim yönetim platformu. Ödevler, sınavlar ve materyaller artık tek bir yerde.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold transition shadow-lg transform hover:-translate-y-1">
                            Hemen Ücretsiz Başla
                        </Link>
                        <Link to="/login" className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-full text-lg font-bold transition border border-gray-200 shadow-sm">
                            Sistemi İncele
                        </Link>
                    </div>

                    {/* Özellikler Kartları */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">👨‍🏫</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Öğretmenler İçin</h3>
                            <p className="text-gray-600">Öğrencilerinize saniyeler içinde ödev atayın, sınav notlarını girin ve gelişimi tek bir ekrandan takip edin.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center text-2xl mb-4">🎓</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Öğrenciler İçin</h3>
                            <p className="text-gray-600">Bekleyen ödevlerinizi görün, sınav sonuçlarınıza ulaşın ve çalışma materyallerini anında indirin.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">👨‍👩‍👧</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Veliler İçin</h3>
                            <p className="text-gray-600">Çocuğunuzun akademik başarısını, gecikmiş ödevlerini ve öğretmen notlarını şeffaf bir şekilde izleyin.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} EduTracker. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
}