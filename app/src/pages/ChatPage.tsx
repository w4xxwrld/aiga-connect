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
  Keyboard,
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
  
  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [user?.primary_role]);

  useEffect(() => {
    if (currentRoom) {
      fetchMessages();
      // Set up polling for new messages - increased interval to reduce refresh frequency
      const interval = setInterval(fetchMessages, 10000); // Changed from 5000 to 10000ms
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      const allRooms = response.data;
      
      // Filter rooms based on user role
      let accessibleRooms = allRooms.filter((room: ChatRoom) => {
        // General chat is always accessible
        if (room.name.toLowerCase().includes('общий') || room.name.toLowerCase().includes('general')) {
          return true;
        }
        
        // Role-specific access
        if (user?.primary_role === 'athlete') {
          // Athletes: only athlete chat and general chat
          return room.name.toLowerCase().includes('спортсмен') || 
                 room.name.toLowerCase().includes('спортсмены') ||
                 room.name.toLowerCase().includes('athlete');
        } else if (user?.primary_role === 'parent') {
          // Parents: only parent chat and general chat
          return room.name.toLowerCase().includes('родитель') || 
                 room.name.toLowerCase().includes('родители') ||
                 room.name.toLowerCase().includes('parent');
        } else if (user?.primary_role === 'coach') {
          // Coaches: access to all chats
          return true;
        }
        
        // Default to general chat only
        return room.name.toLowerCase().includes('общий') || room.name.toLowerCase().includes('general');
      });
      
      console.log('ChatPage: User role:', user?.primary_role);
      console.log('ChatPage: All rooms:', allRooms.map((r: ChatRoom) => r.name));
      console.log('ChatPage: Accessible rooms:', accessibleRooms.map((r: ChatRoom) => r.name));
      
      // Debug: Check each room's filtering
      allRooms.forEach((room: ChatRoom) => {
        const roomNameLower = room.name.toLowerCase();
        const isGeneral = roomNameLower.includes('общий') || roomNameLower.includes('general');
        const isParent = roomNameLower.includes('родитель') || roomNameLower.includes('родители') || roomNameLower.includes('parent');
        const isAthlete = roomNameLower.includes('спортсмен') || roomNameLower.includes('спортсмены') || roomNameLower.includes('athlete');
        
        console.log(`ChatPage: Room "${room.name}" - General: ${isGeneral}, Parent: ${isParent}, Athlete: ${isAthlete}`);
      });
      
      setRooms(accessibleRooms);
      
      // Select the first accessible room as default
      if (accessibleRooms.length > 0) {
        setCurrentRoom(accessibleRooms[0]);
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
      console.log('ChatPage: Raw messages from server:', response.data.map((m: ChatMessage) => ({
        id: m.id,
        content: m.content.substring(0, 30) + '...',
        sender: m.sender_name,
        created_at: m.created_at,
        parsed_time: new Date(m.created_at + 'Z').toISOString(),
        timestamp: new Date(m.created_at + 'Z').getTime(),
        date_only: m.created_at.split('T')[0] // Just the date part
      })));
      
      // Server returns newest first, so reverse to get oldest first
      const sortedMessages = response.data.reverse();
      console.log('ChatPage: Reversed server order to get oldest first');
      
      console.log('ChatPage: Final sorted order:', sortedMessages.map((m: ChatMessage) => ({
        id: m.id,
        content: m.content.substring(0, 30) + '...',
        sender: m.sender_name
      })));
      
      setMessages(sortedMessages);
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
      
      // Instead of manually sorting, just refresh the messages from server
      // This ensures we get the correct order from the database
      await fetchMessages();
      
      // Scroll to bottom after refreshing
      scrollToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll to bottom when new messages are loaded (only for initial load)
  useEffect(() => {
    if (messages.length > 0 && !sending) {
      // Only auto-scroll if we're not currently sending a message
      scrollToBottom(false);
    }
  }, [messages, sending, scrollToBottom]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optional: handle keyboard hide if needed
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const formatTime = (dateString: string) => {
    // Parse the date string as UTC to avoid timezone issues
    const date = new Date(dateString + 'Z');
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Almaty' // Use Kazakhstan timezone
      });
    } else if (isYesterday) {
      return `Вчера ${date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Almaty' // Use Kazakhstan timezone
      })}`;
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Almaty' // Use Kazakhstan timezone
      }) + ' ' + date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Almaty' // Use Kazakhstan timezone
      });
    }
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
      <View style={styles.container}>

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
        contentContainerStyle={styles.messagesContentContainer}
      >
        {messages.length > 0 ? (
          (() => {
            // Messages are already sorted in state, just use them directly
            const sortedMessages = [...messages];

            
            // Group messages by date
            const groupedMessages: { [key: string]: ChatMessage[] } = {};
            sortedMessages.forEach(message => {
              // Parse date as UTC to avoid timezone issues
              const date = new Date(message.created_at + 'Z');
              const dateKey = date.toDateString();
              if (!groupedMessages[dateKey]) {
                groupedMessages[dateKey] = [];
              }
              groupedMessages[dateKey].push(message);
            });
            
            // Render messages with date separators
            const renderMessages: React.ReactNode[] = [];
            // Sort date keys chronologically (oldest first)
            const sortedDateKeys = Object.keys(groupedMessages).sort((a, b) => {
              return new Date(a).getTime() - new Date(b).getTime();
            });
            
            sortedDateKeys.forEach(dateKey => {
              const messagesForDate = groupedMessages[dateKey];
              const date = new Date(dateKey);
              const now = new Date();
              const isToday = date.toDateString() === now.toDateString();
              const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
              
              let dateLabel = '';
              if (isToday) {
                dateLabel = 'Сегодня';
              } else if (isYesterday) {
                dateLabel = 'Вчера';
              } else {
                dateLabel = date.toLocaleDateString('ru-RU', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
              }
              
              // Add date separator with unique key
              renderMessages.push(
                <View key={`date-${dateKey}-${Date.now()}-${Math.random()}`} style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>{dateLabel}</Text>
                </View>
              );
              
              // Add messages for this date
              messagesForDate.forEach(message => {
                renderMessages.push(
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
                );
              });
            });
            
            return renderMessages;
          })()
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chat-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Нет сообщений</Text>
            <Text style={styles.emptySubtext}>Начните общение первым!</Text>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Введите сообщение..."
            placeholderTextColor="#7F8C8D"
            multiline
            maxLength={500}
            textAlignVertical="top"
                      onFocus={() => {
            setTimeout(() => {
              scrollToBottom(true);
            }, 300);
          }}
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
    </View>

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
  keyboardAvoidingView: {
    flex: 0,
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
  messagesContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#7F8C8D',
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
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
    backgroundColor: '#0D1B2A',
    minHeight: 80,
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
    minHeight: 44,
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