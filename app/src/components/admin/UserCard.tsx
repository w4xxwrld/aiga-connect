import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { UserResponse } from '../../services/admin';

interface UserCardProps {
  user: UserResponse;
  onPress: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardContent}>
            <View style={styles.avatarContainer}>
              {user.photo_url ? (
                <Avatar.Image size={56} source={{ uri: user.photo_url }} />
              ) : (
                <Avatar.Text
                  size={56}
                  label={user.first_name.charAt(0)}
                  style={styles.avatarPlaceholder}
                  color="#fff"
                />
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>

              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone" size={14} color="#B0BEC5" />
                <Text style={styles.contactText}>{user.phone}</Text>
              </View>

              {user.email && (
                <View style={styles.contactRow}>
                  <MaterialCommunityIcons name="email" size={14} color="#B0BEC5" />
                  <Text style={styles.contactText}>{user.email}</Text>
                </View>
              )}

              <View style={styles.badgesRow}>
                <StatusBadge type="role" value={user.primary_role} />
                {user.role_status && (
                  <StatusBadge type="status" value={user.role_status} />
                )}
                {user.is_deleted && (
                  <View style={styles.deletedBadge}>
                    <Text style={styles.deletedText}>Удален</Text>
                  </View>
                )}
              </View>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color="#B0BEC5" />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B263B',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    color: '#B0BEC5',
    fontSize: 14,
    marginLeft: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  deletedBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deletedText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserCard;
