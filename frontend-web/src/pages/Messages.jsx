import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Messages() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const chatUserId = searchParams.get('user_id');
    
    const [allMessages, setAllMessages] = useState([]); 
    const [chatMessages, setChatMessages] = useState([]);
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    // Kullanıcının ID'sini güvenli bir şekilde alıyoruz
    const myId = user?.id || user?.user?.id;

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchAllMessages = async () => {
            const token = localStorage.getItem('access');
            try {
                const res = await fetch(`http://localhost:8000/api/school/messages/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setAllMessages(data);
                }
            } catch (error) {
                console.error("Tüm mesajlar çekilemedi:", error);
            }
        };

        const fetchChatMessages = async () => {
            if (!chatUserId) return;
            const token = localStorage.getItem('access');
            try {
                const res = await fetch(`http://localhost:8000/api/school/messages/?user_id=${chatUserId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setChatMessages(data);
                }
            } catch (error) {
                console.error("Sohbet detayları çekilemedi:", error);
            }
        };

        fetchAllMessages();
        fetchChatMessages();
        
        const interval = setInterval(() => {
            fetchAllMessages();
            if (chatUserId) fetchChatMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [chatUserId, user, navigate]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() || !chatUserId) return;
        
        const token = localStorage.getItem('access');
        try {
            const res = await fetch('http://localhost:8000/api/school/messages/', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiver: chatUserId, content })
            });
            if (res.ok) {
                setContent('');
                // Mesaj gönderilir gönderilmez sağ ekranı manuel güncelliyoruz
                const chatRes = await fetch(`http://localhost:8000/api/school/messages/?user_id=${chatUserId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (chatRes.ok) {
                    const chatData = await chatRes.json();
                    if (Array.isArray(chatData)) setChatMessages(chatData);
                }
            }
        } catch (error) {
            console.error("Mesaj gönderilemedi:", error);
        }
    };

    // KİŞİLERİ GRUPLAMA MANTIĞI (Artık İsimle değil, ID ile kesin eşleşiyor)
    const contactsMap = {};
    
    if (Array.isArray(allMessages)) {
        allMessages.forEach(msg => {
            const isMeSender = msg.sender === myId;
            const otherUserId = isMeSender ? msg.receiver : msg.sender;
            const otherUserName = isMeSender ? msg.receiver_name : msg.sender_name;

            if (!contactsMap[otherUserId]) {
                contactsMap[otherUserId] = {
                    id: otherUserId,
                    name: otherUserName || 'Bilinmeyen Kullanıcı',
                    lastMessage: msg.content,
                    timestamp: msg.timestamp
                };
            } else {
                // En güncel mesaja göre listeyi yenile
                if (new Date(msg.timestamp) > new Date(contactsMap[otherUserId].timestamp)) {
                    contactsMap[otherUserId].lastMessage = msg.content;
                    contactsMap[otherUserId].timestamp = msg.timestamp;
                }
            }
        });
    }
    
    // Son mesaja göre sıralama
    const contacts = Object.values(contactsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const isTeacher = user?.role === 'TEACHER' || user?.user?.role === 'TEACHER';

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-2 md:p-4">
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden flex h-[90vh] border border-gray-300">
                
                {/* SOL PANEL: KİŞİ LİSTESİ (Mobilde sohbet açıksa gizlenir) */}
                <div className={`w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col ${chatUserId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 text-lg">Mesajlarım</h2>
                        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline font-medium">Geri Dön</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {contacts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Henüz mesajınız bulunmuyor.
                            </div>
                        ) : (
                            contacts.map(contact => (
                                <button 
                                    key={contact.id} 
                                    onClick={() => navigate(`/messages?user_id=${contact.id}`)}
                                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-100 transition flex flex-col ${Number(chatUserId) === contact.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1 w-full">
                                        <span className="font-bold text-gray-900 truncate pr-2">{contact.name}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                            {new Date(contact.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-600 truncate w-full block">{contact.lastMessage}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* SAĞ PANEL: SOHBET ALANI (Mobilde sohbet kapalıysa gizlenir) */}
                <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 relative ${!chatUserId ? 'hidden md:flex' : 'flex'}`}>
                    {!chatUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500 text-4xl shadow-inner">💬</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">EduTracker Mesajlaşma</h3>
                            <p className="text-gray-500 max-w-md">
                                {isTeacher 
                                    ? "Sol taraftaki listeden bir sohbete tıklayarak görüşmeye başlayabilirsiniz." 
                                    : "Eğitmen vitrininden bir öğretmen seçerek sohbete başlayabilir veya mevcut sohbetlerinize dönebilirsiniz."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 shadow-sm z-10">
                                {/* Mobilde geri dönme butonu */}
                                <button onClick={() => navigate('/messages')} className="md:hidden p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 flex items-center justify-center">
                                    ←
                                </button>
                                <h2 className="text-lg font-bold text-gray-800">Sohbet Ekranı</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col">
                                {chatMessages.map(msg => {
                                    const isMe = msg.sender === myId;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[80%] md:max-w-[70%] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <form onSubmit={sendMessage} className="p-4 bg-gray-100 border-t border-gray-200 flex gap-3">
                                <input 
                                    type="text" 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    placeholder="Mesajınızı yazın..." 
                                    className="flex-1 bg-white border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition shadow-sm" 
                                />
                                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-md">
                                    Gönder
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}