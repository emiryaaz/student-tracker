export default function AccountDeletion() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Hesap ve Veri Silme Talebi</h1>
                <p className="text-sm text-gray-500 mb-8">Son güncelleme: Eylül 2026</p>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Hesabınızı Nasıl Sildirebilirsiniz</h2>
                        <p>
                            EduTracker hesabınızın ve hesabınızla ilişkili tüm verilerin silinmesini talep etmek için{' '}
                            <a href="mailto:ygztechnology@gmail.com?subject=Hesap%20Silme%20Talebi" className="text-teal-600 hover:underline">
                                ygztechnology@gmail.com
                            </a>{' '}
                            adresine, kayıtlı olduğunuz e-posta adresini ve hesap türünüzü (öğretmen, öğrenci veya veli) belirten bir e-posta gönderin.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Silinecek Veriler</h2>
                        <p>Talebiniz onaylandığında aşağıdaki veriler kalıcı olarak silinir:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ad, soyad, e-posta adresi ve hesap bilgileriniz</li>
                            <li>Profil fotoğrafı, biyografi ve öğretmen doğrulama belgeleri</li>
                            <li>Gönderdiğiniz ve aldığınız mesajlar</li>
                            <li>Ödev, sınav notu ve ders materyali gibi eğitim içerikleri</li>
                            <li>Eşleşme/talep geçmişiniz ve veli-öğrenci bağlantı kayıtlarınız</li>
                            <li>Abonelik durumu bilgileri (RevenueCat/Lemon Squeezy üzerindeki fatura kayıtları, yürürlükteki mevzuat gereği ilgili ödeme sağlayıcıda ayrıca bir süre saklanabilir)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">İşlem Süresi</h2>
                        <p>Silme talepleri kimlik doğrulaması yapıldıktan sonra en geç 30 gün içinde tamamlanır. İşlem tamamlandığında bilgilendirme e-postası gönderilir.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Kısmi Silme</h2>
                        <p>Hesabınızı tamamen silmek istemiyor ancak yalnızca belirli verilerinizin (ör. profil fotoğrafı veya belirli mesajlar) kaldırılmasını istiyorsanız, aynı e-posta adresinden talebinizi belirtmeniz yeterlidir.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">İletişim</h2>
                        <p>
                            Sorularınız için{' '}
                            <a href="mailto:ygztechnology@gmail.com" className="text-teal-600 hover:underline">
                                ygztechnology@gmail.com
                            </a>{' '}
                            adresinden bize ulaşabilirsiniz.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
