import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Button, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import bookingsService, { Booking } from '../../services/bookings';

interface BookingCardProps {
  booking: Booking;
  userRole: string;
  onPress: () => void;
  onCancel?: () => void;
  onApprove?: () => void;
  onDecline?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  userRole,
  onPress,
  onCancel,
  onApprove,
  onDecline,
}) => {
  return (
    <Card style={styles.bookingCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Title style={styles.bookingTitle}>
              {booking.class_obj?.name || 'Занятие'}
            </Title>
            <Text style={styles.bookingDate}>
              {bookingsService.formatDate(booking.class_date)}
            </Text>
          </View>
          <View style={styles.bookingMeta}>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: bookingsService.getStatusColor(booking.status) }
              ]}
            >
              {bookingsService.getStatusDisplayName(booking.status)}
            </Badge>
            {booking.is_paid && (
              <Badge style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                Оплачено
              </Badge>
            )}
          </View>
        </View>

        <View style={styles.bookingDetails}>
          {userRole === 'parent' && booking.athlete && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-child" size={16} color="#E74C3C" />
              <Text style={[styles.detailText, { color: '#FFFFFF', fontWeight: '600' }]}>
                Ученик: {booking.athlete.first_name} {booking.athlete.last_name}
              </Text>
            </View>
          )}

          {userRole === 'coach' && booking.athlete && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-child" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Ученик: {booking.athlete.first_name} {booking.athlete.last_name}
              </Text>
            </View>
          )}

          {booking.class_obj?.coach && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="human-male-board" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Профессор: {booking.class_obj.coach.first_name} {booking.class_obj.coach.last_name}
              </Text>
            </View>
          )}

          {booking.payment_amount && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Сумма: {booking.payment_amount} ₸
              </Text>
            </View>
          )}

          {booking.notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color="#E74C3C" />
              <Text style={styles.detailText} numberOfLines={2}>
                Заметки: {booking.notes}
              </Text>
            </View>
          )}

          {booking.cancellation_reason && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
              <Text style={[styles.detailText, { color: '#F44336' }]}>
                Причина отмены: {booking.cancellation_reason}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bookingActions}>
          <Button
            mode="outlined"
            onPress={onPress}
            style={styles.actionButton}
            textColor="#E74C3C"
          >
            Подробнее
          </Button>

          {/* Coach quick actions for pending bookings */}
          {userRole === 'coach' && booking.status === 'pending' && onApprove && onDecline && (
            <>
              <Button
                mode="contained"
                onPress={onApprove}
                style={[styles.actionButton, styles.quickApproveButton]}
                buttonColor="#4CAF50"
                textColor="#fff"
                icon="check"
                compact
              >
                ✓
              </Button>
              <Button
                mode="contained"
                onPress={onDecline}
                style={[styles.actionButton, styles.quickDeclineButton]}
                buttonColor="#F44336"
                textColor="#fff"
                icon="close"
                compact
              >
                ✗
              </Button>
            </>
          )}

          {/* User cancel action for pending bookings */}
          {booking.status === 'pending' && userRole !== 'coach' && onCancel && (
            <Button
              mode="contained"
              onPress={onCancel}
              style={[styles.actionButton, styles.cancelButton]}
              buttonColor="#F44336"
              textColor="#fff"
            >
              Отменить
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  bookingCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingDate: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 2,
  },
  bookingMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 4,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginRight: 8,
    minWidth: 160,
  },
  cancelButton: {
    marginLeft: 8,
  },
  quickApproveButton: {
    marginLeft: 4,
    minWidth: 40,
  },
  quickDeclineButton: {
    marginLeft: 4,
    minWidth: 40,
  },
});

export default BookingCard;
