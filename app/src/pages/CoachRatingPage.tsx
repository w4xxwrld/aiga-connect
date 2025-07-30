import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import feedbackService, { Coach, Feedback } from '../services/feedback';

const CoachRatingPage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (selectedCoach) {
      fetchCoachFeedback();
    }
  }, [selectedCoach]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const coachesData = await feedbackService.getCoaches();
      setCoaches(coachesData);
      
      // Select first coach by default
      if (coachesData.length > 0) {
        setSelectedCoach(coachesData[0]);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachFeedback = async () => {
    if (!selectedCoach) return;
    
    try {
      const feedbacksData = await feedbackService.getCoachFeedback(selectedCoach.id);
      setFeedbacks(feedbacksData);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedbacks([]);
    }
  };

  const submitFeedback = async () => {
    if (!selectedCoach || rating === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите рейтинг');
      return;
    }

    try {
      setSubmitting(true);
      await feedbackService.submitFeedback({
        trainer_id: selectedCoach.id,
        rating: rating,
        comment: comment.trim(),
      });
      
      Alert.alert('Успех', 'Отзыв отправлен!');
      setRating(0);
      setComment('');
      fetchCoachFeedback(); // Refresh feedback list
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Ошибка', 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageRating = () => {
    return feedbackService.formatRating(feedbackService.getAverageRating(feedbacks));
  };

  const renderStars = (rating: number, size: number = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FFD700' : '#B0BEC5'}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <Layout title="Рейтинг тренеров" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка тренеров...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Рейтинг тренеров" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Оцените работу наших тренеров</Text>
        </View>

        {/* Coach Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите тренера</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {coaches.map((coach) => (
              <TouchableOpacity
                key={coach.id}
                style={[
                  styles.coachCard,
                  selectedCoach?.id === coach.id && styles.selectedCoachCard
                ]}
                onPress={() => setSelectedCoach(coach)}
              >
                <MaterialCommunityIcons 
                  name="account-tie" 
                  size={32} 
                  color={selectedCoach?.id === coach.id ? '#E74C3C' : '#B0BEC5'} 
                />
                <Text style={[
                  styles.coachName,
                  selectedCoach?.id === coach.id && styles.selectedCoachName
                ]}>
                  {coach.full_name}
                </Text>
                {coach.is_head_coach && (
                  <View style={styles.headCoachBadge}>
                    <Text style={styles.headCoachText}>Главный тренер</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedCoach && (
          <>
            {/* Coach Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Информация о тренере</Text>
              <View style={styles.coachInfoCard}>
                <View style={styles.coachInfoHeader}>
                  <MaterialCommunityIcons name="account-tie" size={48} color="#E74C3C" />
                  <View style={styles.coachInfoText}>
                    <Text style={styles.coachInfoName}>{selectedCoach.full_name}</Text>
                    <Text style={styles.coachInfoEmail}>{selectedCoach.email}</Text>
                    {selectedCoach.is_head_coach && (
                      <Text style={styles.coachInfoRole}>Главный тренер</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.ratingSummary}>
                  <Text style={styles.ratingTitle}>Средний рейтинг</Text>
                  <View style={styles.ratingDisplay}>
                    {renderStars(parseFloat(getAverageRating()), 24)}
                    <Text style={styles.ratingText}>{getAverageRating()}/5</Text>
                  </View>
                  <Text style={styles.ratingCount}>
                    {feedbacks.length} отзывов
                  </Text>
                </View>
              </View>
            </View>

            {/* Leave Feedback */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Оставить отзыв</Text>
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackLabel}>Ваша оценка:</Text>
                <View style={styles.ratingInput}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <MaterialCommunityIcons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? '#FFD700' : '#B0BEC5'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.feedbackLabel}>Комментарий (необязательно):</Text>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Расскажите о своем опыте..."
                  placeholderTextColor="#7F8C8D"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                
                <TouchableOpacity
                  style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                  onPress={submitFeedback}
                  disabled={rating === 0 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Отправить отзыв</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Feedback List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Отзывы</Text>
              {feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <View key={feedback.id} style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackAuthor}>{feedback.author.full_name}</Text>
                      <Text style={styles.feedbackDate}>
                        {new Date(feedback.created_at).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                    {renderStars(feedback.rating, 16)}
                    {feedback.comment && (
                      <Text style={styles.feedbackComment}>{feedback.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="star-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyText}>Пока нет отзывов</Text>
                  <Text style={styles.emptySubtext}>Будьте первым, кто оставит отзыв!</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
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
  subtitleContainer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  coachCard: {
    width: 120,
    marginRight: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedCoachCard: {
    backgroundColor: '#E74C3C',
  },
  coachName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedCoachName: {
    color: '#fff',
  },
  headCoachBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  headCoachText: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  coachInfoCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
  },
  coachInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachInfoText: {
    marginLeft: 16,
    flex: 1,
  },
  coachInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  coachInfoEmail: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  coachInfoRole: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  ratingSummary: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  feedbackCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  ratingInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2C3E50',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedbackItem: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
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
});

export default CoachRatingPage; 