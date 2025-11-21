import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import {
  Button,
  TextInput,
  Card,
  Title,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { CameraView, Camera } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import attendanceService, { AvailableClassForAttendance } from '../../services/attendance';
import { getDeviceTimezone } from '../../utils/timezone';

const AttendanceScannerPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  // UI State
  const [currentStep, setCurrentStep] = useState<'class-selection' | 'qr-scan'>('class-selection');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Data State
  const [availableClasses, setAvailableClasses] = useState<AvailableClassForAttendance[]>([]);
  const [selectedClass, setSelectedClass] = useState<AvailableClassForAttendance | null>(null);
  const [timezone, setTimezone] = useState<string>('UTC');

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    // Get device timezone
    const deviceTimezone = getDeviceTimezone();
    setTimezone(deviceTimezone);

    // Load available classes
    await loadAvailableClasses(deviceTimezone);
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadAvailableClasses = async (tz: string) => {
    try {
      setLoading(true);
      const classes = await attendanceService.getAvailableClassesForAttendance(tz);
      setAvailableClasses(classes);

      if (classes.length === 0) {
        Alert.alert(
          'Нет доступных занятий',
          'В данный момент нет занятий, доступных для отметки посещения. Убедитесь, что:\n\n• У вас есть подтвержденная запись на занятие\n• Занятие начинается в пределах ближайших 30 минут или уже началось'
        );
      }
    } catch (error: any) {
      console.error('Error loading available classes:', error);
      Alert.alert(
        'Ошибка',
        error.message || 'Не удалось загрузить доступные занятия'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (classItem: AvailableClassForAttendance) => {
    setSelectedClass(classItem);
    // Request camera permission when moving to scanner
    await requestCameraPermission();
    setCurrentStep('qr-scan');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Extract QR code data
    const qrCode = data.trim();

    if (!qrCode) {
      Alert.alert(
        'Неверный код',
        'QR-код не может быть пустым. Попробуйте еще раз.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    markAttendance(qrCode, 'qr_scan');
  };

  const handleManualSubmit = () => {
    if (!manualCode || !manualCode.trim()) {
      Alert.alert('Ошибка', 'Введите код посещения');
      return;
    }

    markAttendance(manualCode.trim(), 'manual_entry');
  };

  const markAttendance = async (qrCode: string, method: 'qr_scan' | 'manual_entry') => {
    if (!selectedClass) {
      Alert.alert('Ошибка', 'Класс не выбран');
      return;
    }

    try {
      setLoading(true);

      // Mark attendance with timezone
      await attendanceService.markAttendance({
        class_id: selectedClass.class_id,
        qr_code: qrCode,
        timezone: timezone,
        method: method,
      });

      // Success!
      Alert.alert(
        'Успешно!',
        `Посещение отмечено для занятия "${selectedClass.class_name}"`,
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

  const handleBackToClassSelection = () => {
    setCurrentStep('class-selection');
    setSelectedClass(null);
    setScanned(false);
    setShowManualEntry(false);
  };

  // Show class selection first
  if (currentStep === 'class-selection') {
    return (
      <Layout>
        <View style={styles.container}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <Title style={styles.headerTitle}>Выберите занятие</Title>
              <Text style={styles.headerSubtitle}>
                Выберите занятие для отметки посещения
              </Text>
            </Card.Content>
          </Card>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#E74C3C" />
              <Text style={styles.loadingText}>Загрузка занятий...</Text>
            </View>
          ) : availableClasses.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons name="calendar-alert" size={64} color="#B0BEC5" />
              <Text style={styles.noClassesText}>
                Нет доступных занятий
              </Text>
              <Text style={styles.noClassesSubtext}>
                В данный момент нет занятий, доступных для отметки посещения
              </Text>
              <Button
                mode="contained"
                onPress={() => loadAvailableClasses(timezone)}
                style={styles.refreshButton}
              >
                Обновить
              </Button>
            </View>
          ) : (
            <FlatList
              data={availableClasses}
              keyExtractor={(item) => item.class_id.toString()}
              renderItem={({ item }) => (
                <Card style={styles.classCard} onPress={() => handleClassSelect(item)}>
                  <Card.Content>
                    <View style={styles.classCardHeader}>
                      <Title style={styles.className}>{item.class_name}</Title>
                      <Chip
                        mode="flat"
                        style={styles.timeChip}
                        textStyle={styles.timeChipText}
                      >
                        {item.minutes_remaining} мин
                      </Chip>
                    </View>
                    <View style={styles.classCardInfo}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#B0BEC5" />
                      <Text style={styles.classTime}>
                        {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                      </Text>
                    </View>
                    <Text style={styles.classDescription}>
                      Нажмите, чтобы отметить посещение
                    </Text>
                  </Card.Content>
                </Card>
              )}
              contentContainerStyle={styles.classList}
            />
          )}
        </View>
      </Layout>
    );
  }

  // QR Scanner flow
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
          <Button
            mode="text"
            onPress={handleBackToClassSelection}
            style={styles.backButton}
          >
            Назад к выбору занятия
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
                Занятие: {selectedClass?.class_name}
              </Text>
              <Text style={styles.manualSubtitle}>
                Введите код посещения с QR-кода
              </Text>

              <TextInput
                mode="outlined"
                label="Код посещения"
                value={manualCode}
                onChangeText={setManualCode}
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
                disabled={loading || !manualCode.trim()}
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

              <Button
                mode="text"
                onPress={handleBackToClassSelection}
                style={styles.switchModeButton}
                disabled={loading}
              >
                Выбрать другое занятие
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
        {/* Class info header */}
        <Card style={styles.scannerHeaderCard}>
          <Card.Content>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={handleBackToClassSelection} style={styles.backIconButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.scannerHeaderText}>
                <Text style={styles.scannerClassName}>{selectedClass?.class_name}</Text>
                <Text style={styles.scannerClassTime}>
                  {selectedClass?.start_time.substring(0, 5)} - {selectedClass?.end_time.substring(0, 5)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

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
              <View style={styles.overlaySide} />
              <View style={styles.scanFrame} />
              <View style={styles.overlaySide} />
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
  // Class selection styles
  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  classList: {
    padding: 16,
    paddingTop: 8,
  },
  classCard: {
    marginBottom: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  timeChip: {
    backgroundColor: '#E74C3C',
  },
  timeChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  classCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  classTime: {
    fontSize: 14,
    color: '#B0BEC5',
    marginLeft: 4,
  },
  classDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    fontStyle: 'italic',
  },
  noClassesText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  noClassesSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: '#E74C3C',
  },
  // Scanner header styles
  scannerHeaderCard: {
    backgroundColor: '#1B263B',
    borderRadius: 0,
    marginBottom: 0,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconButton: {
    marginRight: 12,
  },
  scannerHeaderText: {
    flex: 1,
  },
  scannerClassName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scannerClassTime: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 2,
  },
  backButton: {
    marginTop: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlaySide: {
    flex: 1,
    height: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    borderWidth: 6,
    borderColor: '#E74C3C',
    borderRadius: 0,
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
