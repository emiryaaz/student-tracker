import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function MessagesPanel({ initialUserId = null }) {
    const { user } = useContext(AuthContext);
    const [chatUserId, setChatUserId] = useState(initialUserId ? String(initialUserId) : null);
    const [allMessages, setAllMessages] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [content, setContent] = useState('');
    const messagesEndRef = useRef(null);

    const myId = user?.user?.id || user?.user_id || user?.id;
    const myName = user?.user?.first_name || user?.first_name;

    useEffect(() => {
        if (initialUserId) setChatUserId(String(initialUserId));
    }, [initialUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    useEffect(() => {
        const fetchAllMessages = async () => {
            try {
                const res = await api.get('/school/messages/');
                if (Array.isArray(res.data)) setAllMessages(res.data);
            } catch (error) {
                console.error('Tüm mesajlar çekilemedi:', error);
            }
        };

        const fetchChatMessages = async () => {
            if (!chatUserId) return;
            try {
                const res = await api.get(`/school/messages/?user_id=${chatUserId}`);
                if (Array.isArray(res.data)) setChatMessages(res.data);
            } catch (error) {
                console.error('Sohbet detayları çekilemedi:', error);
            }
        };

        fetchAllMessages();
        fetchChatMessages();

        const interval = setInterval(() => {
            fetchAllMessages();
            if (chatUserId) fetchChatMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [chatUserId]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() || !chatUserId) return;

        try {
            await api.post('/school/messages/', { receiver: chatUserId, content });
            setContent('');
            const chatRes = await api.get(`/school/messages/?user_id=${chatUserId}`);
            if (Array.isArray(chatRes.data)) setChatMessages(chatRes.data);
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
        }
    };

    const contactsMap = {};

    if (Array.isArray(allMessages)) {
        allMessages.forEach(msg => {
            const isMeSender = Number(msg.sender) === Number(myId) || msg.sender_name === myName;

            const otherUserId = isMeSender ? msg.receiver : msg.sender;
            const otherUserName = isMeSender ? msg.receiver_name : msg.sender_name;

            if (Number(otherUserId) === Number(myId) || otherUserName === myName) {
                return;
            }

            if (!contactsMap[otherUserId]) {
                contactsMap[otherUserId] = {
                    id: otherUserId,
                    name: otherUserName || 'Bilinmeyen Kullanıcı',
                    lastMessage: msg.content,
                    timestamp: msg.timestamp
                };
            } else {
                if (new Date(msg.timestamp) > new Date(contactsMap[otherUserId].timestamp)) {
                    contactsMap[otherUserId].lastMessage = msg.content;
                    contactsMap[otherUserId].timestamp = msg.timestamp;
                }
            }
        });
    }

    const contacts = Object.values(contactsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const isTeacher = user?.role === 'TEACHER' || user?.user?.role === 'TEACHER';

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex h-[75vh] min-h-[520px]">
            <div className={`w-full md:w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col ${chatUserId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800 text-lg">Mesajlarım</h2>
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
                                onClick={() => setChatUserId(String(contact.id))}
                                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-100 transition flex flex-col ${Number(chatUserId) === Number(contact.id) ? 'bg-[var(--role-accent-soft)] border-l-4 border-[var(--role-accent)]' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1 w-full">
                                    <span className="font-bold text-gray-900 truncate pr-2">{contact.name}</span>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600 truncate w-full block">{contact.lastMessage}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 relative ${!chatUserId ? 'hidden md:flex' : 'flex'}`}>
                {!chatUserId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 bg-[var(--role-accent-soft)] rounded-full flex items-center justify-center mb-4 text-[var(--role-accent)] text-4xl shadow-inner">💬</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">EduTracker Mesajlaşma</h3>
                        <p className="text-gray-500 max-w-md">
                            {isTeacher
                                ? 'Sol taraftaki listeden bir sohbete tıklayarak görüşmeye başlayabilirsiniz.'
                                : 'Eğitmen vitrininden bir öğretmen seçerek sohbete başlayabilir veya mevcut sohbetlerinize dönebilirsiniz.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 z-10">
                            <button onClick={() => setChatUserId(null)} className="md:hidden p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 flex items-center justify-center">
                                ←
                            </button>
                            <h2 className="text-lg font-bold text-gray-800">Sohbet Ekranı</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col">
                            {chatMessages.map(msg => {
                                const isMe = Number(msg.sender) !== Number(chatUserId);

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] md:max-w-[70%] shadow-sm ${isMe ? 'bg-[var(--role-accent)] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                            <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <input
                                type="text"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 bg-white border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[var(--role-accent)] focus:ring-2 focus:ring-[var(--role-accent-soft)] transition"
                            />
                            <button type="submit" className="bg-[var(--role-accent)] hover:bg-[var(--role-accent-hover)] text-white px-8 py-3 rounded-full font-bold transition shadow-md">
                                Gönder
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
