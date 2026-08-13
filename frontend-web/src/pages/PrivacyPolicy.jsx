export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">EduTracker Gizlilik Politikası</h1>
                <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ağustos 2026</p>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">1. Toplanan Veriler</h2>
                        <p>EduTracker'a kayıt olduğunuzda ve uygulamayı kullandığınızda aşağıdaki verileri işleriz:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ad, soyad, e-posta adresi ve şifre (şifreleriniz şifrelenmiş olarak saklanır)</li>
                            <li>Kullanıcı rolü (öğretmen, öğrenci, veli veya yönetici)</li>
                            <li>Öğretmenler için: profil fotoğrafı, biyografi, ders ücreti, diploma/doğrulama belgesi</li>
                            <li>Ödev, sınav notu ve ders materyali gibi eğitim içerikleri</li>
                            <li>Kullanıcılar arası mesajlar</li>
                            <li>Veli-öğrenci ve öğretmen-öğrenci arasındaki bağlantı/talep kayıtları</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">2. Verilerin Kullanım Amacı</h2>
                        <p>Topladığımız veriler yalnızca EduTracker'ın temel işlevlerini sağlamak için kullanılır: hesabınızı oluşturmak ve doğrulamak, öğretmen-öğrenci-veli eşleşmelerini yönetmek, ödev/sınav/mesajlaşma özelliklerini sunmak ve öğretmen doğrulama sürecini yürütmek. Verileriniz reklam amacıyla kullanılmaz veya üçüncü taraflara pazarlama amacıyla satılmaz.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">3. Veri Paylaşımı</h2>
                        <p>Verileriniz, uygulamanın çalışması için gerekli altyapı sağlayıcılarıyla (sunucu barındırma ve dosya depolama hizmetleri) paylaşılır. Bu sağlayıcılar verilerinizi yalnızca bizim adımıza, hizmeti sağlamak amacıyla işler. Yasal bir zorunluluk olmadıkça verileriniz başka üçüncü taraflarla paylaşılmaz.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">4. Veri Güvenliği</h2>
                        <p>Şifreleriniz endüstri standardı yöntemlerle şifrelenerek saklanır. Tüm veri iletimi HTTPS/SSL ile şifrelenir. Hesap oturumlarınız güvenli token'lar ile yönetilir.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">5. Veri Saklama ve Silme</h2>
                        <p>Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızın ve ilişkili tüm verilerinizin silinmesini talep etmek için <a href="mailto:emiryagiz3561@gmail.com" className="text-teal-600 hover:underline">emiryagiz3561@gmail.com</a> adresinden bizimle iletişime geçebilirsiniz. Talebiniz makul bir süre içinde işleme alınır.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">6. Çocukların Gizliliği</h2>
                        <p>EduTracker, öğrenci hesaplarının velileri tarafından bilgilendirilerek kullanılmasını önerir. Veli-öğrenci bağlantıları yalnızca karşılıklı onayla kurulur. 13 yaş altı kullanıcıların hesap oluşturması durumunda velilerinin gözetiminde olması beklenir.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">7. İletişim</h2>
                        <p>Bu gizlilik politikasıyla ilgili sorularınız için <a href="mailto:emiryagiz3561@gmail.com" className="text-teal-600 hover:underline">emiryagiz3561@gmail.com</a> adresinden bize ulaşabilirsiniz.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
