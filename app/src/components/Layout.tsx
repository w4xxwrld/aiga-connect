import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'AIGA Connect',
  showMenu = true,
  onMenuPress,
  showBack = false,
  onBackPress,
  showFooter = true,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBack ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onMenuPress}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <View style={styles.headerRight}>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      
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
    paddingVertical: 12,
    paddingTop: 50, // Add top padding for status bar
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