import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showProfile?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'AIGA Connect',
  showBack = false,
  onBackPress,
  showProfile = true,
}) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAppContext();
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B263B" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          {showBack ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setSidebarVisible(true)}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.headerRight}>
          {showProfile ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              {user?.photo_url ? (
                <Avatar.Image
                  size={36}
                  source={{ uri: user.photo_url }}
                />
              ) : (
                <Avatar.Text
                  size={36}
                  label={user?.full_name?.charAt(0) || 'U'}
                  style={styles.avatarPlaceholder}
                  color="#fff"
                />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Sidebar */}
      <Sidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1B263B',
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
  },
  avatarPlaceholder: {
    backgroundColor: '#6B7280',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#1B263B',
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    color: '#B0BEC5',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    color: '#3498DB',
    fontSize: 12,
  },
});

export default Layout; 