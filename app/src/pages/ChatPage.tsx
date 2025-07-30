import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  message_type: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

interface ChatRoom {
  id: number;
  name: string;
  description: string;
  chat_type: string;
  is_public: boolean;
  created_at: string;
}

const ChatPage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      fetchMessages();
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      setRooms(response.data);
      
      // Select the first public room as default
      const publicRoom = response.data.find((room: ChatRoom) => room.is_public);
      if (publicRoom) {
        setCurrentRoom(publicRoom);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!currentRoom) return;
    
    try {
      const response = await api.get(`/chat/rooms/${currentRoom.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || !user) return;

    try {
      setSending(true);
      const response = await api.post('/chat/messages', {
        room_id: currentRoom.id,
        content: newMessage.trim(),
        message_type: 'text',
      });
      
      setNewMessage('');
      // Add the new message to the list
      setMessages(prev => [...prev, response.data]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.sender_id === user?.id;
  };

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка чата...</Text>
      </View>
    );
  }

  return (
    <Layout 
      title="Сообщество AIGA" 
      showFooter={false}
      onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

      {/* Room Selector */}
      <View style={styles.roomSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomTab,
                currentRoom?.id === room.id && styles.activeRoomTab
              ]}
              onPress={() => setCurrentRoom(room)}
            >
              <Text style={[
                styles.roomTabText,
                currentRoom?.id === room.id && styles.activeRoomTabText
              ]}>
                {room.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.length > 0 ? (
          [...messages].reverse().map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                isOwnMessage(message) ? styles.ownMessage : styles.otherMessage
              ]}
            >
              {!isOwnMessage(message) && (
                <Text style={styles.senderName}>{message.sender_name}</Text>
              )}
              <View style={[
                styles.messageBubble,
                isOwnMessage(message) ? styles.ownBubble : styles.otherBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  isOwnMessage(message) ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={[
                  styles.messageTime,
                  isOwnMessage(message) ? styles.ownMessageTime : styles.otherMessageTime
                ]}>
                  {formatTime(message.created_at)}
                  {message.is_edited && ' (ред.)'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chat-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Нет сообщений</Text>
            <Text style={styles.emptySubtext}>Начните общение первым!</Text>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Введите сообщение..."
          placeholderTextColor="#7F8C8D"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

    {/* Sidebar */}
    <Sidebar
              isVisible={isSidebarOpen}
        onClose={handleSidebarClose}
    />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },

  roomSelector: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 16,
  },
  roomTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1B263B',
  },
  activeRoomTab: {
    backgroundColor: '#E74C3C',
  },
  roomTabText: {
    fontSize: 14,
    color: '#B0BEC5',
    fontWeight: '600',
  },
  activeRoomTabText: {
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#E74C3C',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1B263B',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1B263B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E74C3C',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2C3E50',
  },
});

export default ChatPage; 