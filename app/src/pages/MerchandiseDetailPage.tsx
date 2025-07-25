import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Linking,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Divider,
  SegmentedButtons,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import merchandiseService, { MerchandiseItem } from '../services/merchandise';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MerchandiseDetailPageProps {
  route: {
    params: {
      itemId: string;
    };
  };
  navigation: any;
}

const MerchandiseDetailPage: React.FC<MerchandiseDetailPageProps> = ({ route, navigation }) => {
  const { user } = useAppContext();
  const { itemId } = route.params;
  
  const [item, setItem] = useState<MerchandiseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderDialogVisible, setOrderDialogVisible] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.full_name || '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      const itemData = await merchandiseService.getMerchandiseById(itemId);
      setItem(itemData);
      
      // Set default selections
      if (itemData && itemData.sizes && itemData.sizes.length > 0) {
        setSelectedSize(itemData.sizes[0]);
      }
      if (itemData && itemData.colors && itemData.colors.length > 0) {
        setSelectedColor(itemData.colors[0]);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить товар');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItemDetails();
    setRefreshing(false);
  };

  const handleAddToCart = () => {
    if (!item) return;

    const cartItem = {
      ...item,
      selectedSize,
      selectedColor,
      quantity,
    };

    merchandiseService.addToCart(cartItem);
    Alert.alert('Успешно', `${item.name} добавлен в корзину!`);
  };

  const handleBuyNow = () => {
    if (!item) return;
    setOrderDialogVisible(true);
  };

  const handleCreateOrder = async () => {
    if (!item) return;

    if (!customerInfo.name.trim() || !customerInfo.phone.trim() || !customerInfo.address.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      // Create a mock order structure for WhatsApp link generation
      const orderData = {
        id: Date.now().toString(),
        user_id: 1,
        items: [{
          id: Date.now().toString(),
          merchandise_id: item.id,
          merchandise: item,
          quantity,
          selected_size: selectedSize,
          selected_color: selectedColor,
          unit_price: item.price,
          total_price: item.price * quantity,
        }],
        total_amount: item.price * quantity,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        created_at: new Date().toISOString(),
        shipping_address: customerInfo.address,
        phone: customerInfo.phone,
        notes: customerInfo.notes,
      };

      const whatsappLink = merchandiseService.generateOrderLink(orderData);
      await Linking.openURL(whatsappLink);
      setOrderDialogVisible(false);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать заказ');
    }
  };

  const renderProductImages = () => {
    if (!item) return null;

    return (
      <Card style={styles.imageCard}>
        <Card.Content style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="image" size={64} color="#B0BEC5" />
            <Text style={styles.imagePlaceholderText}>Фото товара</Text>
          </View>
          {item.is_featured && (
            <Chip mode="flat" style={styles.featuredBadge} textStyle={styles.featuredBadgeText}>
              ХИТ
            </Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderProductInfo = () => {
    if (!item) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productTitleContainer}>
              <Title style={styles.productTitle}>{item.name}</Title>
              <View style={styles.categoryChip}>
                <Chip mode="outlined" style={styles.chip} textStyle={styles.chipText}>
                  {merchandiseService.getCategoryDisplayName(item.category)}
                </Chip>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{merchandiseService.formatPrice(item.price)}</Text>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{item.rating}</Text>
                <Text style={styles.reviewCount}>({item.reviews_count})</Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Paragraph style={styles.description}>{item.description}</Paragraph>

          <View style={styles.stockInfo}>
            <MaterialCommunityIcons 
              name={item.in_stock ? "check-circle" : "alert-circle"} 
              size={16} 
              color={item.in_stock ? "#4CAF50" : "#E74C3C"} 
            />
            <Text style={[styles.stockText, { color: item.in_stock ? "#4CAF50" : "#E74C3C" }]}>
              {item.in_stock ? 'В наличии' : 'Нет в наличии'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderProductOptions = () => {
    if (!item) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Варианты</Title>

          {item.sizes && item.sizes.length > 0 && (
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Размер</Text>
              <SegmentedButtons
                value={selectedSize}
                onValueChange={setSelectedSize}
                buttons={item.sizes.map(size => ({ value: size, label: size }))}
                style={styles.segmentedButtons}
              />
            </View>
          )}

          {item.colors && item.colors.length > 0 && (
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Цвет</Text>
              <View style={styles.colorContainer}>
                {item.colors.map((color) => (
                  <Chip
                    key={color}
                    mode={selectedColor === color ? 'flat' : 'outlined'}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorChip,
                      selectedColor === color && styles.selectedColorChip
                    ]}
                    textStyle={[
                      styles.chipText,
                      selectedColor === color && styles.selectedChipText
                    ]}
                  >
                    {color}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <View style={styles.quantitySection}>
            <Text style={styles.optionLabel}>Количество</Text>
            <View style={styles.quantityControls}>
              <Button
                mode="outlined"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={styles.quantityButton}
                textColor="#fff"
              >
                -
              </Button>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Button
                mode="outlined"
                onPress={() => setQuantity(quantity + 1)}
                style={styles.quantityButton}
                textColor="#fff"
              >
                +
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!item) return null;

    const totalPrice = item.price * quantity;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.totalPrice}>
            <Text style={styles.totalPriceLabel}>Итого:</Text>
            <Text style={styles.totalPriceValue}>
              {merchandiseService.formatPrice(totalPrice)}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleAddToCart}
              disabled={!item.in_stock}
              style={styles.addToCartButton}
              textColor="#E74C3C"
            >
              В корзину
            </Button>
            <Button
              mode="contained"
              onPress={handleBuyNow}
              disabled={!item.in_stock}
              buttonColor="#E74C3C"
              style={styles.buyNowButton}
            >
              Купить сейчас
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderOrderDialog = () => (
    <Portal>
      <Dialog visible={orderDialogVisible} onDismiss={() => setOrderDialogVisible(false)}>
        <Dialog.Title>Оформление заказа</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogText}>
            Заполните информацию для оформления заказа через WhatsApp
          </Text>
          
          <TextInput
            label="Имя *"
            value={customerInfo.name}
            onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, name: text }))}
            mode="outlined"
            style={styles.dialogInput}
            theme={{
              colors: {
                onSurfaceVariant: '#fff',
                placeholder: '#B0BEC5',
                onSurface: '#fff',
              }
            }}
          />

          <TextInput
            label="Телефон *"
            value={customerInfo.phone}
            onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, phone: text }))}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.dialogInput}
            theme={{
              colors: {
                onSurfaceVariant: '#fff',
                placeholder: '#B0BEC5',
                onSurface: '#fff',
              }
            }}
          />

          <TextInput
            label="Адрес доставки *"
            value={customerInfo.address}
            onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, address: text }))}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.dialogInput}
            theme={{
              colors: {
                onSurfaceVariant: '#fff',
                placeholder: '#B0BEC5',
                onSurface: '#fff',
              }
            }}
          />

          <TextInput
            label="Примечания"
            value={customerInfo.notes}
            onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, notes: text }))}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.dialogInput}
            theme={{
              colors: {
                onSurfaceVariant: '#fff',
                placeholder: '#B0BEC5',
                onSurface: '#fff',
              }
            }}
          />

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Ваш заказ:</Text>
            <Text style={styles.orderSummaryText}>
              {item?.name} ({selectedSize} {selectedColor}) x{quantity}
            </Text>
            <Text style={styles.orderSummaryTotal}>
              Итого: {merchandiseService.formatPrice((item?.price || 0) * quantity)}
            </Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setOrderDialogVisible(false)} textColor="#fff">
            Отмена
          </Button>
          <Button onPress={handleCreateOrder} textColor="#E74C3C">
            Заказать
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка товара...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#E74C3C" />
        <Text style={styles.errorText}>Товар не найден</Text>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          textColor="#fff"
          style={styles.backButton}
        >
          Назад
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderProductImages()}
      {renderProductInfo()}
      {renderProductOptions()}
      {renderActionButtons()}
      {renderOrderDialog()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    borderColor: '#E74C3C',
  },
  card: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginBottom: 8,
  },
  imageCard: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 32,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 64,
    height: 200,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0BEC5',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF9800',
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  chip: {
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  description: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    borderColor: '#E74C3C',
  },
  selectedColorChip: {
    backgroundColor: '#E74C3C',
  },
  selectedChipText: {
    color: '#fff',
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    minWidth: 40,
    borderColor: '#E74C3C',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 30,
    textAlign: 'center',
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalPriceLabel: {
    fontSize: 16,
    color: '#fff',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    borderColor: '#E74C3C',
  },
  buyNowButton: {
    flex: 1,
  },
  dialogText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
  },
  dialogInput: {
    marginBottom: 12,
    backgroundColor: '#2C3E50',
  },
  orderSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  orderSummaryText: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  orderSummaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 8,
  },
});

export default MerchandiseDetailPage; 