import api from './api';

export interface Coach {
  id: number;
  full_name: string;
  email: string;
  primary_role: string;
  is_head_coach: boolean;
}

export interface Feedback {
  id: number;
  author_id: number;
  trainer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: {
    full_name: string;
  };
}

export interface FeedbackCreate {
  trainer_id: number;
  rating: number;
  comment?: string;
}

class FeedbackService {
  // Get all coaches
  async getCoaches(): Promise<Coach[]> {
    try {
      const response = await api.get('/users/coaches');
      return response.data;
    } catch (error) {
      console.error('Error fetching coaches:', error);
      throw error;
    }
  }

  // Get feedback for a specific coach
  async getCoachFeedback(coachId: number): Promise<Feedback[]> {
    try {
      const response = await api.get(`/feedback/trainer/${coachId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching coach feedback:', error);
      throw error;
    }
  }

  // Submit feedback for a coach
  async submitFeedback(feedback: FeedbackCreate): Promise<Feedback> {
    try {
      const response = await api.post('/feedback/', feedback);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Get average rating for a coach
  getAverageRating(feedbacks: Feedback[]): number {
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    return total / feedbacks.length;
  }

  // Format rating display
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }
}

const feedbackService = new FeedbackService();
export default feedbackService; 