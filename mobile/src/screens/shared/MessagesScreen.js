import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { EmptyState } from '../../components/UI';

export default function MessagesScreen() {
    const { user } = useContext(AuthContext);
    const route = useRoute();
    const accent = getRoleColors(user?.role || user?.user?.role).accent;

    const [chatUserId, setChatUserId] = useState(route.params?.openChatWith ? String(route.params.openChatWith) : null);
    const [chatUserName, setChatUserName] = useState(route.params?.openChatWithName || null);

    useEffect(() => {
        if (route.params?.openChatWith) {
            setChatUserId(String(route.params.openChatWith));
            setChatUserName(route.params.openChatWithName || null);
        }
    }, [route.params?.openChatWith, route.params?.openChatWithName]);

    const [allMessages, setAllMessages] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const listRef = useRef(null);

    const myId = user?.user?.id || user?.user_id || user?.id;
    const myName = user?.user?.first_name || user?.first_name;

    const fetchAllMessages = useCallback(async () => {
        try {
            const res = await api.get('/school/messages/');
            if (Array.isArray(res.data)) setAllMessages(res.data);
        } catch (e) {
            console.log('Mesajlar çekilemedi', e);
        }
    }, []);

    const fetchChatMessages = useCallback(async (userId) => {
        if (!userId) return;
        try {
            const res = await api.get(`/school/messages/?user_id=${userId}`);
            if (Array.isArray(res.data)) setChatMessages(res.data);
        } catch (e) {
            console.log('Sohbet çekilemedi', e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchAllMessages(), fetchChatMessages(chatUserId)]).finally(() => setLoading(false));
        const interval = setInterval(() => {
            fetchAllMessages();
            if (chatUserId) fetchChatMessages(chatUserId);
        }, 3000);
        return () => clearInterval(interval);
    }, [chatUserId, fetchAllMessages, fetchChatMessages]);

    const sendMessage = async () => {
        if (!content.trim() || !chatUserId) return;
        const text = content;
        setContent('');
        try {
            await api.post('/school/messages/', { receiver: chatUserId, content: text });
            fetchChatMessages(chatUserId);
        } catch (e) {
            console.log('Mesaj gönderilemedi', e);
        }
    };

    const contactsMap = {};
    allMessages.forEach((msg) => {
        const isMeSender = Number(msg.sender) === Number(myId) || msg.sender_name === myName;
        const otherUserId = isMeSender ? msg.receiver : msg.sender;
        const otherUserName = isMeSender ? msg.receiver_name : msg.sender_name;
        if (Number(otherUserId) === Number(myId) || otherUserName === myName) return;
        if (!contactsMap[otherUserId]) {
            contactsMap[otherUserId] = { id: otherUserId, name: otherUserName || 'Bilinmeyen Kullanıcı', lastMessage: msg.content, timestamp: msg.timestamp };
        } else if (new Date(msg.timestamp) > new Date(contactsMap[otherUserId].timestamp)) {
            contactsMap[otherUserId].lastMessage = msg.content;
            contactsMap[otherUserId].timestamp = msg.timestamp;
        }
    });
    const contacts = Object.values(contactsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    if (!chatUserId) {
        return (
            <View style={styles.container}>
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => String(item.id)}
                    ListEmptyComponent={<EmptyState text="Henüz mesajınız bulunmuyor." />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.contactRow}
                            onPress={() => { setChatUserId(String(item.id)); setChatUserName(item.name); }}
                        >
                            <View style={[styles.avatar, { backgroundColor: accent }]}>
                                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactLast} numberOfLines={1}>{item.lastMessage}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
            <View style={[styles.chatHeader, { backgroundColor: accent }]}>
                <TouchableOpacity onPress={() => setChatUserId(null)}>
                    <Text style={styles.backText}>‹ Geri</Text>
                </TouchableOpacity>
                <Text style={styles.chatHeaderTitle}>{chatUserName || 'Sohbet'}</Text>
                <View style={{ width: 44 }} />
            </View>
            <FlatList
                ref={listRef}
                data={chatMessages}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 14 }}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    const isMe = Number(item.sender) !== Number(chatUserId);
                    return (
                        <View style={[styles.bubbleWrap, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                            <View style={[styles.bubble, isMe ? { backgroundColor: accent } : styles.bubbleOther]}>
                                <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextOther}>{item.content}</Text>
                                <Text style={isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther}>
                                    {new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Mesajınızı yazın..."
                />
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: accent }]} onPress={sendMessage}>
                    <Text style={styles.sendBtnText}>Gönder</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    contactName: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
    contactLast: { color: '#64748b', fontSize: 13, marginTop: 2 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingTop: 16 },
    backText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    chatHeaderTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
    bubbleWrap: { flexDirection: 'row', marginBottom: 10 },
    bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
    bubbleOther: { backgroundColor: '#f1f5f9' },
    bubbleTextMe: { color: '#fff', fontSize: 14 },
    bubbleTextOther: { color: '#1e293b', fontSize: 14 },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3, textAlign: 'right' },
    bubbleTimeOther: { color: '#94a3b8', fontSize: 10, marginTop: 3, textAlign: 'right' },
    inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, marginRight: 8 },
    sendBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
    sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
