import api from './api';

export interface Booking {
  id: number;
  athlete_id: number;
  class_id: number;
  booked_by_parent_id?: number;
  booking_type: 'regular' | 'trial' | 'makeup';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_date: string;
  class_date: string;
  is_paid: boolean;
  payment_amount?: number;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  athlete?: {
    id: number;
    full_name: string;
  };
  class_obj?: {
    id: number;
    name: string;
    coach?: {
      id: number;
      full_name: string;
    };
  };
  booked_by_parent?: {
    id: number;
    full_name: string;
  };
}

export interface IndividualTrainingRequest {
  id: number;
  athlete_id: number;
  coach_id: number;
  requested_by_parent_id?: number;
  requested_date: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  request_date: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  is_paid: boolean;
  payment_amount?: number;
  athlete_notes?: string;
  coach_notes?: string;
  decline_reason?: string;
  created_at: string;
  updated_at: string;
  athlete?: {
    id: number;
    full_name: string;
  };
  coach?: {
    id: number;
    full_name: string;
  };
  requested_by_parent?: {
    id: number;
    full_name: string;
  };
}

export interface BookingCreate {
  athlete_id: number;
  class_id: number;
  booking_type?: 'regular' | 'trial' | 'makeup';
  class_date: string;
  notes?: string;
}

export interface IndividualTrainingRequestCreate {
  coach_id: number;
  requested_date: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  athlete_notes?: string;
}

export interface IndividualTrainingRequestUpdate {
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  coach_notes?: string;
  payment_amount?: number;
  is_paid?: boolean;
}

class BookingsService {
  async createBooking(bookingData: BookingCreate): Promise<Booking> {
    try {
      const response = await api.post('/bookings/', bookingData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create booking');
    }
  }

  async getMyBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings/my-bookings');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get bookings');
    }
  }

  async getCoachBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings/coach-bookings');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get coach bookings');
    }
  }

  async getBooking(bookingId: number): Promise<Booking> {
    try {
      console.log('BookingsService: Getting booking with ID:', bookingId);
      const response = await api.get(`/bookings/${bookingId}`);
      console.log('BookingsService: Booking data received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('BookingsService: Error getting booking:', error);
      console.error('BookingsService: Error response:', error.response?.data);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get booking');
    }
  }

  async cancelBooking(bookingId: number, cancellationReason: string): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel?cancellation_reason=${encodeURIComponent(cancellationReason)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to cancel booking');
    }
  }

  async approveBooking(bookingId: number): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/approve`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to approve booking');
    }
  }

  async declineBooking(bookingId: number, declineReason: string): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/decline?decline_reason=${encodeURIComponent(declineReason)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to decline booking');
    }
  }

  // Individual Training Request methods
  async createIndividualTrainingRequest(requestData: IndividualTrainingRequestCreate): Promise<IndividualTrainingRequest> {
    try {
      const response = await api.post('/bookings/individual-training', requestData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create individual training request');
    }
  }

  async getMyIndividualTrainingRequests(): Promise<IndividualTrainingRequest[]> {
    try {
      const response = await api.get('/bookings/individual-training/my-requests');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get individual training requests');
    }
  }

  async getPendingIndividualTrainingRequests(): Promise<IndividualTrainingRequest[]> {
    try {
      const response = await api.get('/bookings/individual-training/pending');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get pending individual training requests');
    }
  }

  async getIndividualTrainingRequest(requestId: number): Promise<IndividualTrainingRequest> {
    try {
      const response = await api.get(`/bookings/individual-training/${requestId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get individual training request');
    }
  }

  async acceptIndividualTrainingRequest(requestId: number, updateData: IndividualTrainingRequestUpdate): Promise<IndividualTrainingRequest> {
    try {
      const response = await api.put(`/bookings/individual-training/${requestId}/accept`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to accept individual training request');
    }
  }

  async declineIndividualTrainingRequest(requestId: number, declineReason: string): Promise<IndividualTrainingRequest> {
    try {
      const response = await api.put(`/bookings/individual-training/${requestId}/decline?decline_reason=${encodeURIComponent(declineReason)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to decline individual training request');
    }
  }

  async completeIndividualTrainingRequest(requestId: number): Promise<IndividualTrainingRequest> {
    try {
      const response = await api.put(`/bookings/individual-training/${requestId}/complete`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to complete individual training request');
    }
  }

  // Helper methods for display
  getBookingTypeDisplayName(type: string): string {
    switch (type) {
      case 'regular': return 'Обычное';
      case 'trial': return 'Пробное';
      case 'makeup': return 'Компенсационное';
      default: return type;
    }
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Ожидает',
      confirmed: 'Подтверждено',
      cancelled: 'Отменено',
      completed: 'Завершено'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: '#FF9800',
      confirmed: '#4CAF50',
      cancelled: '#F44336',
      completed: '#2196F3'
    };
    return colorMap[status] || '#757575';
  }

  getIndividualTrainingStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Ожидает решения',
      accepted: 'Принято',
      declined: 'Отклонено',
      completed: 'Завершено'
    };
    return statusMap[status] || status;
  }

  getIndividualTrainingStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: '#FF9800',
      accepted: '#4CAF50',
      declined: '#F44336',
      completed: '#2196F3'
    };
    return colorMap[status] || '#757575';
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString; // Already in HH:MM format
  }
}

const bookingsService = new BookingsService();
export default bookingsService; 