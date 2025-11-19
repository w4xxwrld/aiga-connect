import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Button,
  TextInput,
  Card,
  Title,
  ActivityIndicator,
} from 'react-native-paper';
import { CameraView, Camera } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import attendanceService from '../../services/attendance';
import bookingsService, { Booking } from '../../services/bookings';
import classesService, { Class } from '../../services/classes';

const AttendanceScannerPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);

  useEffect(() => {
    requestCameraPermission();
    loadAvailableClasses();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadAvailableClasses = async () => {
    try {
      // Get user's bookings
      const bookings = await bookingsService.getMyBookings();
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

      // Get class details for each booking
      const classIds = [...new Set(confirmedBookings.map(b => b.class_id))];
      const allClasses = await classesService.getClasses();
      const userClasses = allClasses.filter(c => classIds.includes(c.id));

      setAvailableClasses(userClasses);
    } catch (error: any) {
      console.error('Error loading available classes:', error);
    }
  };

  const findMatchingClass = (): Class | null => {
    if (availableClasses.length === 0) return null;

    const now = new Date();
    const currentDay = now.toLocaleDateString('ru-RU', { weekday: 'long' });
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find classes that:
    // 1. Are scheduled for today (match day of week)
    // 2. Are happening now or soon (within 30 minutes before to 30 minutes after start time)
    const matchingClasses = availableClasses.filter(classItem => {
      if (!classItem.days_of_week.includes(currentDay)) {
        return false;
      }

      // Parse class start time
      const [classHour, classMinute] = classItem.start_time.split(':').map(Number);
      const classStartTime = new Date(now);
      classStartTime.setHours(classHour, classMinute, 0, 0);

      // Calculate time difference in minutes
      const timeDiff = (classStartTime.getTime() - now.getTime()) / (1000 * 60);

      // Allow check-in from 30 minutes before to 30 minutes after class start
      return timeDiff >= -30 && timeDiff <= 30;
    });

    // Return the closest match
    if (matchingClasses.length > 0) {
      return matchingClasses[0];
    }

    return null;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Extract 3-digit code from QR data
    const qrCode = data.trim();

    if (!/^\d{3}$/.test(qrCode)) {
      Alert.alert(
        'Неверный код',
        'QR-код должен содержать 3 цифры. Попробуйте еще раз.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    markAttendance(qrCode, 'qr_scan');
  };

  const handleManualSubmit = () => {
    if (!manualCode || manualCode.length !== 3 || !/^\d{3}$/.test(manualCode)) {
      Alert.alert('Ошибка', 'Введите 3-значный код');
      return;
    }

    markAttendance(manualCode, 'manual_entry');
  };

  const markAttendance = async (qrCode: string, method: 'qr_scan' | 'manual_entry') => {
    try {
      setLoading(true);

      // Find matching class based on time and user's bookings
      const matchingClass = findMatchingClass();

      if (!matchingClass) {
        Alert.alert(
          'Занятие не найдено',
          'Не удалось найти подходящее занятие. Убедитесь, что:\n\n• Вы записаны на занятие\n• Занятие начинается сейчас (±30 минут)\n• Сегодня день проведения занятия',
          [
            { text: 'OK', onPress: () => setScanned(false) }
          ]
        );
        return;
      }

      // Mark attendance
      await attendanceService.markAttendance({
        class_id: matchingClass.id,
        qr_code: qrCode,
        method: method,
      });

      // Success!
      Alert.alert(
        'Успешно!',
        `Посещение отмечено для занятия "${matchingClass.name}"`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation?.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      Alert.alert(
        'Ошибка',
        error.message || 'Не удалось отметить посещение',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry);
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <Layout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Запрос доступа к камере...</Text>
        </View>
      </Layout>
    );
  }

  if (hasPermission === false) {
    return (
      <Layout>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#B0BEC5" />
          <Text style={styles.noPermissionText}>
            Нет доступа к камере
          </Text>
          <Text style={styles.noPermissionSubtext}>
            Пожалуйста, разрешите доступ к камере в настройках приложения
          </Text>
          <Button
            mode="outlined"
            onPress={toggleManualEntry}
            style={styles.manualEntryButton}
          >
            Ввести код вручную
          </Button>
        </View>
      </Layout>
    );
  }

  if (showManualEntry) {
    return (
      <Layout>
        <View style={styles.container}>
          <Card style={styles.manualCard}>
            <Card.Content>
              <Title style={styles.manualTitle}>Ручной ввод кода</Title>
              <Text style={styles.manualSubtitle}>
                Введите 3-значный код с QR-кода
              </Text>

              <TextInput
                mode="outlined"
                label="Код (3 цифры)"
                value={manualCode}
                onChangeText={setManualCode}
                keyboardType="number-pad"
                maxLength={3}
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#E74C3C',
                    background: '#0D1B2A',
                    placeholder: '#B0BEC5',
                    text: '#FFFFFF',
                  },
                }}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleManualSubmit}
                loading={loading}
                disabled={loading || manualCode.length !== 3}
                style={styles.submitButton}
              >
                Отметить посещение
              </Button>

              <Button
                mode="text"
                onPress={toggleManualEntry}
                style={styles.switchModeButton}
                disabled={loading}
              >
                Вернуться к сканированию
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop}>
              <Text style={styles.instructionText}>
                Наведите камеру на QR-код
              </Text>
            </View>

            <View style={styles.overlayMiddle}>
              <View style={styles.scanFrame} />
            </View>

            <View style={styles.overlayBottom}>
              <Button
                mode="text"
                onPress={toggleManualEntry}
                icon="keyboard"
                textColor="#FFFFFF"
              >
                Ввести код вручную
              </Button>
            </View>
          </View>

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingOverlayText}>
                Отмечаем посещение...
              </Text>
            </View>
          )}

          {/* Scanned overlay */}
          {scanned && !loading && (
            <View style={styles.scannedOverlay}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color="#4CAF50"
              />
              <Text style={styles.scannedText}>Код отсканирован!</Text>
            </View>
          )}
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B0BEC5',
  },
  noPermissionText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  noPermissionSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  manualEntryButton: {
    marginTop: 24,
    borderColor: '#E74C3C',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayMiddle: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#E74C3C',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualCard: {
    margin: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#E74C3C',
    marginBottom: 8,
  },
  switchModeButton: {
    marginTop: 8,
  },
});

export default AttendanceScannerPage;
