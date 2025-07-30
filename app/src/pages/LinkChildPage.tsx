import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  ActivityIndicator,
  HelperText,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import childrenService, { Child } from '../services/children';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';

interface LinkChildPageProps {
  navigation: any;
}

const LinkChildPage: React.FC<LinkChildPageProps> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  // Form state
  const [childIin, setChildIin] = useState('');
  const [relationshipType, setRelationshipType] = useState<'father' | 'mother' | 'guardian'>('father');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [myChildren, setMyChildren] = useState<Child[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadMyChildren();
  }, []);

  const loadMyChildren = async () => {
    if (userRole !== 'parent') return;
    
    try {
      setLoading(true);
      const children = await childrenService.getMyChildren();
      setMyChildren(children);
    } catch (error: any) {
      console.error('Error loading children:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список детей');
    } finally {
      setLoading(false);
    }
  };

  const validateIin = (iin: string) => {
    if (!iin.trim()) {
      return 'ИИН ребенка обязателен для заполнения';
    }
    if (iin.length !== 12) {
      return 'ИИН должен содержать ровно 12 цифр';
    }
    if (!/^\d+$/.test(iin)) {
      return 'ИИН должен содержать только цифры';
    }
    return null;
  };

  const handleLinkChild = async () => {
    const iinError = validateIin(childIin);
    if (iinError) {
      setErrors({ childIin: iinError });
      return;
    }

    if (!user) return;

    setLinking(true);
    try {
      console.log('LinkChildPage: childIin entered:', childIin);
      
      // First, find the child by IIN
      const child = await childrenService.getUserByIin(childIin.trim());
      console.log('LinkChildPage: found child:', child);
      
      const relationship = {
        parent_id: user.id,
        athlete_id: child.id, // Use the actual child ID
        relationship_type: relationshipType,
      };

      console.log('LinkChildPage: sending relationship:', relationship);
      await childrenService.linkChild(relationship);
      
      Alert.alert(
        'Успешно',
        'Ребенок успешно связан с вашим аккаунтом',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and reload children
              setChildIin('');
              setRelationshipType('father');
              loadMyChildren();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error linking child:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось связать ребенка');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkChild = (childId: number) => {
    Alert.alert(
      'Отвязать ребенка',
      'Вы уверены, что хотите отвязать этого ребенка от вашего аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отвязать',
          style: 'destructive',
          onPress: async () => {
            // Note: Backend doesn't have unlink endpoint, so this would need to be implemented
            Alert.alert('Информация', 'Функция отвязки будет добавлена позже');
          }
        }
      ]
    );
  };

  const calculateAge = (birthDate: string) => {
    return childrenService.calculateAge(birthDate);
  };

  if (userRole !== 'parent') {
    return (
      <Layout 
        title="Связать ребенка"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="account-lock" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>Эта функция доступна только родителям</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Связать ребенка"
      showBack={true}
      onBackPress={() => navigation.goBack()}
    >

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Link Child Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Связать ребенка</Title>
            
            <TextInput
              label="ИИН ребенка"
              value={childIin}
              onChangeText={setChildIin}
              mode="outlined"
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              keyboardType="numeric"
              maxLength={12}
              placeholder="Введите 12-значный ИИН"
              placeholderTextColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              error={!!errors.childIin}
            />
            {errors.childIin && <HelperText type="error" visible={!!errors.childIin}>{errors.childIin}</HelperText>}

            <View style={styles.relationshipSection}>
              <Text style={styles.relationshipLabel}>Тип связи:</Text>
              <View style={styles.relationshipChips}>
                <Chip
                  selected={relationshipType === 'father'}
                  onPress={() => setRelationshipType('father')}
                  style={styles.relationshipChip}
                  textStyle={styles.relationshipChipText}
                >
                  Отец
                </Chip>
                <Chip
                  selected={relationshipType === 'mother'}
                  onPress={() => setRelationshipType('mother')}
                  style={styles.relationshipChip}
                  textStyle={styles.relationshipChipText}
                >
                  Мать
                </Chip>
                <Chip
                  selected={relationshipType === 'guardian'}
                  onPress={() => setRelationshipType('guardian')}
                  style={styles.relationshipChip}
                  textStyle={styles.relationshipChipText}
                >
                  Опекун
                </Chip>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleLinkChild}
              style={styles.linkButton}
              buttonColor="#4CAF50"
              icon="link"
              disabled={linking || !childIin.trim()}
              loading={linking}
            >
              Связать ребенка
            </Button>
          </Card.Content>
        </Card>

        {/* My Children Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Мои связанные дети</Title>
            
            {loading ? (
              <ActivityIndicator size="large" color="#E74C3C" />
            ) : myChildren.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-child" size={48} color="#B0BEC5" />
                <Text style={styles.emptyStateText}>У вас пока нет связанных детей</Text>
              </View>
            ) : (
              myChildren.map((child) => (
                <View key={child.id} style={styles.childItem}>
                  <View style={styles.childItemInfo}>
                    <MaterialCommunityIcons 
                      name="account-child" 
                      size={40} 
                      color="#E74C3C" 
                    />
                    <View style={styles.childItemDetails}>
                      <Text style={styles.childItemName}>{child.full_name}</Text>
                      <Text style={styles.childItemAge}>{calculateAge(child.birth_date)} лет</Text>
                    </View>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => handleUnlinkChild(child.id)}
                    textColor="#F44336"
                    icon="link-off"
                    compact
                  >
                    Отвязать
                  </Button>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#2C3E50',
  },
  relationshipSection: {
    marginBottom: 16,
  },
  relationshipLabel: {
    color: '#B0BEC5',
    fontSize: 16,
    marginBottom: 8,
  },
  relationshipChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipChip: {
    backgroundColor: '#2C3E50',
  },
  relationshipChipText: {
    color: '#fff',
  },
  linkButton: {
    marginTop: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  childItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  childItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  childItemAge: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LinkChildPage; 