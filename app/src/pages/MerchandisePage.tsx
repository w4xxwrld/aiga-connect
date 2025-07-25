import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  FlatList,
  Linking,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  ActivityIndicator,
  Badge,
  Chip,
  IconButton,
  TextInput,
  Dialog,
  Portal,
  SegmentedButtons,
  FAB,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import merchandiseService, { 
  MerchandiseItem, 
  CartItem, 
  Order 
} from '../services/merchandise';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MerchandisePage: React.FC = () => {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    loadMerchandise();
    updateCartItems();
  }, [selectedCategory]);

  const loadMerchandise = async () => {
    try {
      setLoading(true);
      const data = await merchandiseService.getMerchandise(selectedCategory || undefined);
      setMerchandise(data);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItems = () => {
    setCartItems(merchandiseService.getCartItems());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMerchandise();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await merchandiseService.searchMerchandise(query);
        setMerchandise(results);
      } catch (error: any) {
        Alert.alert('Ошибка', error.message || 'Ошибка поиска');
      }
    } else {
      loadMerchandise();
    }
  };

  const handleAddToCart = (item: MerchandiseItem) => {
    if (item.sizes.length > 1 || item.colors.length > 1) {
      showSizeColorDialog(item);
    } else {
      merchandiseService.addToCart(
        item, 
        1, 
        item.sizes[0] || undefined, 
        item.colors[0] || undefined
      );
      updateCartItems();
      Alert.alert('Успешно', 'Товар добавлен в корзину!');
    }
  };

  const showSizeColorDialog = (item: MerchandiseItem) => {
    Alert.alert(
      'Выбор параметров',
      'Для товаров с размерами/цветами используйте веб-версию или свяжитесь с нами',
      [
        { 
          text: 'Добавить без выбора', 
          onPress: () => {
            merchandiseService.addToCart(item);
            updateCartItems();
            Alert.alert('Успешно', 'Товар добавлен в корзину!');
          }
        },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    merchandiseService.removeFromCart(itemId);
    updateCartItems();
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    merchandiseService.updateCartItemQuantity(itemId, quantity);
    updateCartItems();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Корзина пуста', 'Добавьте товары в корзину для оформления заказа');
      return;
    }
    setCartVisible(false);
    setCheckoutVisible(true);
  };

  const handleCreateOrder = async () => {
    if (!shippingAddress.trim() || !phone.trim()) {
      Alert.alert('Ошибка', 'Заполните адрес доставки и телефон');
      return;
    }

    setOrderLoading(true);
    try {
      const order = await merchandiseService.createOrder(
        shippingAddress.trim(),
        phone.trim(),
        notes.trim() || undefined
      );

      const whatsappLink = merchandiseService.generateOrderLink(order);
      
      Alert.alert(
        'Заказ оформлен!',
        'Ваш заказ создан. Сейчас откроется WhatsApp для связи с менеджером.',
        [
          {
            text: 'Открыть WhatsApp',
            onPress: () => {
              Linking.openURL(whatsappLink).catch(() => {
                Alert.alert('Ошибка', 'Не удалось открыть WhatsApp');
              });
            }
          }
        ]
      );

      // Reset form
      setShippingAddress('');
      setPhone('');
      setNotes('');
      setCheckoutVisible(false);
      updateCartItems();
      
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать заказ');
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredMerchandise = merchandise.filter(item => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const cartTotal = merchandiseService.getCartTotal();
  const cartItemsCount = merchandiseService.getCartItemsCount();

  const renderMerchandiseItem = ({ item }: { item: MerchandiseItem }) => (
    <Card style={styles.merchandiseCard}>
      <Card.Content>
        <View style={styles.merchandiseHeader}>
          <View style={styles.merchandiseInfo}>
            <Title style={styles.merchandiseTitle}>{item.name}</Title>
            <Text style={styles.merchandiseBrand}>{item.brand}</Text>
          </View>
          <View style={styles.merchandiseMeta}>
            <Text style={styles.merchandisePrice}>
              {merchandiseService.formatPrice(item.price)}
            </Text>
            {item.is_featured && (
              <Chip 
                mode="flat" 
                style={styles.featuredChip}
                textStyle={styles.featuredChipText}
              >
                Хит
              </Chip>
            )}
          </View>
        </View>

        <Paragraph style={styles.merchandiseDescription}>
          {item.description}
        </Paragraph>

        <View style={styles.merchandiseDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>
              {item.rating} ({item.reviews_count} отзывов)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="package" size={16} color="#4CAF50" />
            <Text style={styles.detailText}>
              {item.in_stock ? `В наличии (${item.stock_quantity})` : 'Нет в наличии'}
            </Text>
          </View>

          {item.material && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="information" size={16} color="#2196F3" />
              <Text style={styles.detailText}>{item.material}</Text>
            </View>
          )}
        </View>

        <View style={styles.sizesColors}>
          {item.sizes.length > 0 && (
            <View style={styles.optionsGroup}>
              <Text style={styles.optionsLabel}>Размеры:</Text>
              <View style={styles.optionsChips}>
                {item.sizes.slice(0, 3).map((size, index) => (
                  <Chip 
                    key={index}
                    mode="outlined" 
                    style={styles.optionChip}
                    textStyle={styles.optionChipText}
                  >
                    {size}
                  </Chip>
                ))}
                {item.sizes.length > 3 && (
                  <Text style={styles.moreOptions}>+{item.sizes.length - 3}</Text>
                )}
              </View>
            </View>
          )}

          {item.colors.length > 0 && (
            <View style={styles.optionsGroup}>
              <Text style={styles.optionsLabel}>Цвета:</Text>
              <View style={styles.optionsChips}>
                {item.colors.slice(0, 3).map((color, index) => (
                  <Chip 
                    key={index}
                    mode="outlined" 
                    style={styles.optionChip}
                    textStyle={styles.optionChipText}
                  >
                    {color}
                  </Chip>
                ))}
                {item.colors.length > 3 && (
                  <Text style={styles.moreOptions}>+{item.colors.length - 3}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {item.features.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Особенности:</Text>
            {item.features.slice(0, 2).map((feature, index) => (
              <Text key={index} style={styles.feature}>• {feature}</Text>
            ))}
            {item.features.length > 2 && (
              <Text style={styles.moreFeatures}>и еще {item.features.length - 2}...</Text>
            )}
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => handleAddToCart(item)}
          disabled={!item.in_stock}
          style={styles.addToCartButton}
          buttonColor="#E74C3C"
        >
          {item.in_stock ? 'В корзину' : 'Нет в наличии'}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.merchandise.name}</Text>
        {item.selected_size && (
          <Text style={styles.cartItemOption}>Размер: {item.selected_size}</Text>
        )}
        {item.selected_color && (
          <Text style={styles.cartItemOption}>Цвет: {item.selected_color}</Text>
        )}
        <Text style={styles.cartItemPrice}>
          {merchandiseService.formatPrice(item.unit_price)} x {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <View style={styles.quantityControls}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            style={styles.quantityButton}
          />
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            style={styles.quantityButton}
          />
        </View>
        <Text style={styles.cartItemTotal}>
          {merchandiseService.formatPrice(item.total_price)}
        </Text>
        <IconButton
          icon="delete"
          size={20}
          iconColor="#E74C3C"
          onPress={() => handleRemoveFromCart(item.id)}
        />
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <SegmentedButtons
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        buttons={[
          { value: '', label: 'Все' },
          { value: 'apparel', label: 'Одежда' },
          { value: 'gear', label: 'Защита' },
          { value: 'accessories', label: 'Аксессуары' },
        ]}
        style={styles.segmentedButtons}
        theme={{ colors: { primary: '#E74C3C' } }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка товаров...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск товаров..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          theme={{ colors: { primary: '#E74C3C' } }}
        />
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredMerchandise}
        renderItem={renderMerchandiseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.merchandiseList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="store-off" size={64} color="#B0BEC5" />
            <Text style={styles.emptyStateText}>Товары не найдены</Text>
          </View>
        }
      />

      {/* Cart FAB */}
      <FAB
        style={styles.cartFab}
        icon="shopping"
        onPress={() => setCartVisible(true)}
        label={cartItemsCount > 0 ? cartItemsCount.toString() : undefined}
      />

      {/* Cart Dialog */}
      <Portal>
        <Dialog visible={cartVisible} onDismiss={() => setCartVisible(false)} style={styles.cartDialog}>
          <Dialog.Title>Корзина ({cartItemsCount})</Dialog.Title>
          <Dialog.Content>
            {cartItems.length === 0 ? (
              <Text style={styles.emptyCartText}>Корзина пуста</Text>
            ) : (
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                style={styles.cartItemsList}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.cartDialogActions}>
            <View style={styles.cartTotal}>
              <Text style={styles.cartTotalText}>
                Итого: {merchandiseService.formatPrice(cartTotal)}
              </Text>
            </View>
            <Button onPress={() => setCartVisible(false)}>Закрыть</Button>
            <Button 
              mode="contained" 
              onPress={handleCheckout}
              disabled={cartItems.length === 0}
              buttonColor="#E74C3C"
            >
              Оформить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Checkout Dialog */}
      <Portal>
        <Dialog visible={checkoutVisible} onDismiss={() => setCheckoutVisible(false)} style={styles.checkoutDialog}>
          <Dialog.Title>Оформление заказа</Dialog.Title>
          <Dialog.Content>
            <View style={styles.checkoutContent}>
              <TextInput
                label="Адрес доставки *"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
                numberOfLines={2}
                style={styles.checkoutInput}
                theme={{ colors: { primary: '#E74C3C' } }}
              />
              <TextInput
                label="Телефон *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.checkoutInput}
                theme={{ colors: { primary: '#E74C3C' } }}
              />
              <TextInput
                label="Примечания"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                style={styles.checkoutInput}
                theme={{ colors: { primary: '#E74C3C' } }}
              />
              <Text style={styles.checkoutTotal}>
                Итого к оплате: {merchandiseService.formatPrice(cartTotal)}
              </Text>
              <Text style={styles.checkoutNote}>
                После оформления заказа откроется WhatsApp для связи с менеджером
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCheckoutVisible(false)}>Отмена</Button>
            <Button 
              mode="contained" 
              onPress={handleCreateOrder}
              loading={orderLoading}
              disabled={orderLoading}
              buttonColor="#E74C3C"
            >
              Оформить заказ
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  header: {
    padding: 16,
  },
  searchBar: {
    backgroundColor: '#1B263B',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: '#1B263B',
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
  merchandiseList: {
    padding: 16,
  },
  merchandiseCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
  },
  merchandiseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  merchandiseInfo: {
    flex: 1,
  },
  merchandiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  merchandiseBrand: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  merchandiseMeta: {
    alignItems: 'flex-end',
  },
  merchandisePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 4,
  },
  featuredChip: {
    backgroundColor: '#FF9800',
  },
  featuredChipText: {
    fontSize: 10,
    color: '#fff',
  },
  merchandiseDescription: {
    fontSize: 13,
    color: '#B0BEC5',
    marginBottom: 12,
  },
  merchandiseDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#fff',
  },
  sizesColors: {
    marginBottom: 12,
  },
  optionsGroup: {
    marginBottom: 8,
  },
  optionsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  optionChip: {
    borderColor: '#2196F3',
    height: 24,
  },
  optionChipText: {
    fontSize: 10,
    color: '#fff',
  },
  moreOptions: {
    fontSize: 10,
    color: '#B0BEC5',
    marginLeft: 4,
  },
  featuresSection: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  feature: {
    fontSize: 11,
    color: '#B0BEC5',
    marginLeft: 8,
  },
  moreFeatures: {
    fontSize: 11,
    color: '#B0BEC5',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  addToCartButton: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#B0BEC5',
    marginTop: 16,
  },
  cartFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#E74C3C',
  },
  cartDialog: {
    backgroundColor: '#1B263B',
    maxHeight: '80%',
  },
  emptyCartText: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    paddingVertical: 32,
  },
  cartItemsList: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  cartItemOption: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#E74C3C',
  },
  cartItemActions: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantityText: {
    fontSize: 14,
    color: '#fff',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 4,
  },
  cartDialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cartTotal: {
    flex: 1,
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  checkoutDialog: {
    backgroundColor: '#1B263B',
  },
  checkoutContent: {
    gap: 16,
  },
  checkoutInput: {
    backgroundColor: '#0D1B2A',
  },
  checkoutTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 8,
  },
  checkoutNote: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MerchandisePage; 