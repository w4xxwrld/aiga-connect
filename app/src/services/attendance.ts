import api from './api';

export interface Attendance {
  id: number;
  athlete_id: number;
  class_id: number;
  qr_code: string;
  attendance_date: string;
  marked_at: string;
  method: 'qr_scan' | 'manual_entry';
  created_at: string;
  athlete?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
  class_obj?: {
    id: number;
    name: string;
    start_time: string;
    coach?: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
}

export interface MarkAttendanceRequest {
  class_id: number;
  qr_code: string;
  timezone: string;  // IANA timezone string (e.g., "Asia/Almaty")
  method?: 'qr_scan' | 'manual_entry';
}

export interface AvailableClassForAttendance {
  class_id: number;
  class_name: string;
  start_time: string;
  end_time: string;
  minutes_remaining: number;
  booking_id: number;
}

export interface AttendanceStats {
  total_attendances: number;
  unique_athletes: number;
  qr_scan_count: number;
  manual_entry_count: number;
}

export interface AttendanceCountResponse {
  attendance_count: number;
}

export interface DateRange {
  start_date?: string;
  end_date?: string;
}

class AttendanceService {
  /**
   * Get classes available for attendance marking
   * GET /classes/available-for-attendance
   */
  async getAvailableClassesForAttendance(timezone: string): Promise<AvailableClassForAttendance[]> {
    try {
      const response = await api.get('/classes/available-for-attendance', {
        params: { timezone }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get available classes for attendance');
    }
  }

  /**
   * Mark attendance for current user
   * POST /attendance/mark
   */
  async markAttendance(attendanceData: MarkAttendanceRequest): Promise<Attendance> {
    try {
      const response = await api.post('/attendance/mark', attendanceData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to mark attendance');
    }
  }

  /**
   * Get current user's attendance history
   * GET /attendance/my-attendance
   */
  async getMyAttendance(dateRange?: DateRange): Promise<Attendance[]> {
    try {
      const params: any = {};
      if (dateRange?.start_date) {
        params.start_date = dateRange.start_date;
      }
      if (dateRange?.end_date) {
        params.end_date = dateRange.end_date;
      }
      const response = await api.get('/attendance/my-attendance', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get attendance history');
    }
  }

  /**
   * Get total attendance count for current user
   * GET /attendance/my-attendance/count
   */
  async getMyAttendanceCount(): Promise<number> {
    try {
      const response = await api.get<AttendanceCountResponse>('/attendance/my-attendance/count');
      return response.data.attendance_count;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get attendance count');
    }
  }

  /**
   * Get attendance records for a specific class (coach only)
   * GET /attendance/class/{class_id}
   */
  async getClassAttendance(classId: number, attendanceDate?: string): Promise<Attendance[]> {
    try {
      const params: any = {};
      if (attendanceDate) {
        params.attendance_date = attendanceDate;
      }
      const response = await api.get(`/attendance/class/${classId}`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get class attendance');
    }
  }

  /**
   * Get attendance statistics for a class (coach only)
   * GET /attendance/class/{class_id}/stats
   */
  async getClassAttendanceStats(classId: number, dateRange?: DateRange): Promise<AttendanceStats> {
    try {
      const params: any = {};
      if (dateRange?.start_date) {
        params.start_date = dateRange.start_date;
      }
      if (dateRange?.end_date) {
        params.end_date = dateRange.end_date;
      }
      const response = await api.get(`/attendance/class/${classId}/stats`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get class attendance statistics');
    }
  }

  /**
   * Get attendance records for multiple classes (for coach dashboard)
   */
  async getMultipleClassesAttendance(classIds: number[], attendanceDate?: string): Promise<{ [classId: number]: Attendance[] }> {
    try {
      const attendanceByClass: { [classId: number]: Attendance[] } = {};

      // Fetch attendance for each class
      await Promise.all(
        classIds.map(async (classId) => {
          const attendance = await this.getClassAttendance(classId, attendanceDate);
          attendanceByClass[classId] = attendance;
        })
      );

      return attendanceByClass;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get attendance for multiple classes');
    }
  }

  // Helper methods for display
  getMethodDisplayName(method: string): string {
    const methodMap: { [key: string]: string } = {
      qr_scan: 'QR сканирование',
      manual_entry: 'Ручной ввод'
    };
    return methodMap[method] || method;
  }

  getMethodIcon(method: string): string {
    const iconMap: { [key: string]: string } = {
      qr_scan: 'qrcode-scan',
      manual_entry: 'pencil'
    };
    return iconMap[method] || 'check';
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

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format date to YYYY-MM-DD for API requests
   */
  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate(): string {
    return this.formatDateForAPI(new Date());
  }

  /**
   * Calculate attendance streak (consecutive days)
   */
  calculateStreak(attendances: Attendance[]): number {
    if (attendances.length === 0) return 0;

    // Sort by date descending
    const sortedAttendances = [...attendances].sort((a, b) =>
      new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()
    );

    // Get unique dates
    const uniqueDates = [...new Set(sortedAttendances.map(a => a.attendance_date))];

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueDates) {
      const attendanceDate = new Date(dateStr);
      attendanceDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get attendance count for current month
   */
  getMonthlyAttendanceCount(attendances: Attendance[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return attendances.filter(attendance => {
      const date = new Date(attendance.attendance_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }

  /**
   * Group attendances by date
   */
  groupByDate(attendances: Attendance[]): { [date: string]: Attendance[] } {
    const grouped: { [date: string]: Attendance[] } = {};

    attendances.forEach(attendance => {
      const date = attendance.attendance_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(attendance);
    });

    return grouped;
  }

  /**
   * Get marked dates for calendar (in format expected by react-native-calendars)
   */
  getMarkedDates(attendances: Attendance[]): { [date: string]: { marked: boolean; dotColor: string } } {
    const markedDates: { [date: string]: { marked: boolean; dotColor: string } } = {};

    attendances.forEach(attendance => {
      markedDates[attendance.attendance_date] = {
        marked: true,
        dotColor: '#4CAF50'
      };
    });

    return markedDates;
  }
}

const attendanceService = new AttendanceService();
export default attendanceService;
