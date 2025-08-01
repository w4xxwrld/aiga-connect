import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Product {
  id: number;
  name: string;
  description: string;
  short_description: string;
  category: string;
  price: number;
  original_price: number;
  currency: string;
  status: string;
  is_featured: boolean;
  main_image_url: string;
  images: string[];
  external_url: string;
  sku: string;
  tags?: string[];
  meta_description?: string;
}

const { width } = Dimensions.get('window');

const ProductDetailPage: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const navigation = useNavigation();
  const route = useRoute();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const productId = (route.params as any)?.productId;

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/merchandise/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о товаре');
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const getCategoryName = (category: string) => {
    const categories = {
      gi: 'Кимоно',
      rashguard: 'Рашгард',
      shorts: 'Шорты',
      belt: 'Пояс',
      accessories: 'Аксессуары',
      patches: 'Нашивки',
      apparel: 'Одежда',
      equipment: 'Оборудование',
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getStatusName = (status: string) => {
    const statuses = {
      active: 'В наличии',
      out_of_stock: 'Нет в наличии',
      discontinued: 'Снят с продажи',
      coming_soon: 'Скоро в продаже',
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const formatPrice = (price: number, currency: string = 'KZT') => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const handleOrderPress = async () => {
    if (!product?.external_url) {
      Alert.alert('Ошибка', 'Ссылка для заказа недоступна');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(product.external_url);
      if (supported) {
        await Linking.openURL(product.external_url);
      } else {
        Alert.alert('Ошибка', 'Не удается открыть ссылку для заказа');
      }
    } catch (error) {
      console.error('Error opening external URL:', error);
      Alert.alert('Ошибка', 'Не удается открыть ссылку для заказа');
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <Layout title="Детали товара" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout title="Детали товара" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>Товар не найден</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  const allImages = [product.main_image_url, ...(product.images || [])].filter(Boolean);

  return (
    <Layout title="Детали товара" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{product.name}</Text>
        </View>

        {/* Product Images */}
        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            {allImages.length > 0 ? (
              <Image
                source={{ uri: allImages[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image" size={64} color="#B0BEC5" />
              </View>
            )}
            {product.is_featured && (
              <View style={styles.featuredBadge}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.featuredText}>Рекомендуемый</Text>
              </View>
            )}
            {product.status !== 'active' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{getStatusName(product.status)}</Text>
              </View>
            )}
          </View>

          {/* Image Gallery */}
          {allImages.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
              {allImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.galleryThumbnail,
                    selectedImageIndex === index && styles.selectedThumbnail
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{getCategoryName(product.category)}</Text>
          </View>

          <View style={styles.priceContainer}>
            {product.original_price && product.original_price > product.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.original_price)}
              </Text>
            )}
            <Text style={styles.price}>
              {formatPrice(product.price)}
            </Text>
          </View>

          {product.short_description && (
            <Text style={styles.shortDescription}>{product.short_description}</Text>
          )}

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Описание</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsTitle}>Теги</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {product.sku && (
            <View style={styles.skuSection}>
              <Text style={styles.skuText}>Артикул: {product.sku}</Text>
            </View>
          )}
        </View>

        {/* Order Button */}
        <View style={styles.orderSection}>
          <TouchableOpacity
            style={[
              styles.orderButton,
              (!product.external_url || product.status !== 'active') && styles.disabledButton
            ]}
            onPress={handleOrderPress}
            disabled={!product.external_url || product.status !== 'active'}
          >
            <MaterialCommunityIcons name="shopping" size={20} color="#fff" />
            <Text style={styles.orderButtonText}>
              {product.external_url ? 'Заказать' : 'Ссылка недоступна'}
            </Text>
          </TouchableOpacity>
          
          {!product.external_url && (
            <Text style={styles.noLinkText}>
              Ссылка для заказа пока недоступна
            </Text>
          )}
        </View>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  imageSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainImageContainer: {
    height: 300,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  imageGallery: {
    marginTop: 8,
  },
  galleryThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#E74C3C',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 16,
    color: '#7F8C8D',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  shortDescription: {
    fontSize: 16,
    color: '#B0BEC5',
    lineHeight: 24,
    marginBottom: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  skuSection: {
    marginBottom: 20,
  },
  skuText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  orderSection: {
    padding: 20,
    paddingTop: 0,
  },
  orderButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#7F8C8D',
  },
  orderButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noLinkText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default ProductDetailPage; 