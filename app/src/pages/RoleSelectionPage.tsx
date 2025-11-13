import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RoleCard } from '../components/cards/RoleSelectionCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RoleSelectionPageProps {}

const { width, height } = Dimensions.get('window');

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = () => {
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>('');

   const logoScaleAnim = useRef(new Animated.Value(1)).current;

   const navigation = useNavigation<any>();
   const route: any = useRoute();
   const formData = route.params?.formData;

   const handleRoleSelection = async (role: 'athlete' | 'coach') => {
      console.log('[RoleSelectionPage] handleRoleSelection called, role=', role, 'formData=', formData);
      setLoading(true);
      setError('');

      try {
         navigation.navigate({
            name: 'Auth',
            params: { selectedRole: role, formData },
            merge: true,
         });
         navigation.goBack();
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to set role');
      } finally {
         setLoading(false);
      }
   };

   return (
      <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
               <View style={styles.header}>
                  <Animated.View style={{ transform: [{ scale: logoScaleAnim }] }}>
                  <Image
                     source={require('../../assets/image.png')}
                     style={styles.logo}
                     resizeMode="contain"
                  />
                  </Animated.View>
                  <Text style={styles.headerTitle}>AIGA Connect</Text>
                  <Text style={styles.headerSubtitle}>Выберите вашу роль</Text>
               </View>
               <View style={{ marginBottom: 12 }}>
                  <RoleCard
                     icon={<MaterialCommunityIcons name="account-tie" size={40} color="#E74C3C" />}
                     title="Тренер"
                     description="Работа с группами и учениками"
                     role="coach"
                     onSelect={handleRoleSelection}
                  />
               </View>
               <View style={{ marginBottom: 12 }}>
                  <RoleCard
                     icon={<MaterialCommunityIcons name="run" size={40} color="#E74C3C" />}
                     title="Спортсмен"
                     description="Посещает тренировки и турниры"
                     role="athlete"
                     onSelect={handleRoleSelection}
                  />
               </View>
               {loading && <Text style={{color:'#fff', textAlign:'center'}}>Собираем данные...</Text>}
            </ScrollView>
      </KeyboardAvoidingView>
   )
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.4,
    height: height * 0.15,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
});