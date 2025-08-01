import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

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
}

interface ProductCollection {
  id: number;
  name: string;
  description: string;
  slug: string;
  banner_image_url: string;
  thumbnail_image_url: string;
  is_active: boolean;
  is_featured: boolean;
}

const { width } = Dimensions.get('window');

const StorePage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [productsResponse, collectionsResponse] = await Promise.all([
        api.get('/merchandise'),
        api.get('/merchandise/collections/'),
      ]);
      
      setProducts(productsResponse.data.products || productsResponse.data);
      setCollections(collectionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching store data:', error);
      // Don't show alert, just set empty arrays
      setProducts([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category: string) => {
    const categories = {
      rashguard: 'Рашгард',
      shorts: 'Шорты',
      equipment: 'Мерч',
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getStatusName = (status: string) => {
    const statuses = {
      active: 'В наличии',
      out_of_stock: 'Нет в наличии',
      discontinued: 'Снят с продажи',
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const formatPrice = (price: number, currency: string = 'KZT') => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const handleProductPress = (product: Product) => {
    (navigation as any).navigate('ProductDetail', { productId: product.id });
  };

  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }
    if (selectedCollection !== null) {
      // In a real app, you would filter by collection
      return true;
    }
    return true;
  });

  const categories = ['all', 'rashguard', 'shorts', 'equipment'];

  if (loading) {
    return (
      <Layout title="Магазин AIGA" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка магазина...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Магазин AIGA" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Рашгарды, шорты и мерч</Text>
        </View>

      {/* Featured Collections */}
      {collections.filter(c => c.is_featured).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Коллекции</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {collections.filter(c => c.is_featured).map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionCard}
                onPress={() => setSelectedCollection(collection.id)}
              >
                <View style={styles.collectionImageContainer}>
                  {collection.thumbnail_image_url ? (
                    <Image
                      source={{ uri: collection.thumbnail_image_url }}
                      style={styles.collectionImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.collectionImagePlaceholder}>
                      <MaterialCommunityIcons name="image" size={32} color="#B0BEC5" />
                    </View>
                  )}
                </View>
                <Text style={styles.collectionName}>{collection.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Категории</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.activeCategoryText
              ]}>
                {category === 'all' ? 'Все' : getCategoryName(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Товары</Text>
        {filteredProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
              >
                <View style={styles.productImageContainer}>
                  {product.main_image_url ? (
                    <Image
                      source={{ uri: product.main_image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <MaterialCommunityIcons name="image" size={32} color="#B0BEC5" />
                    </View>
                  )}
                  {product.is_featured && (
                    <View style={styles.featuredBadge}>
                      <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                    </View>
                  )}
                  {product.status !== 'active' && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{getStatusName(product.status)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.short_description || product.description}
                  </Text>
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
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => handleProductPress(product)}
                  >
                    <Text style={styles.buyButtonText}>Купить</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shopping-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Товары не найдены</Text>
            <Text style={styles.emptySubtext}>Попробуйте выбрать другую категорию</Text>
          </View>
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
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleContainer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  collectionCard: {
    width: 120,
    marginRight: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  collectionImageContainer: {
    height: 80,
    backgroundColor: '#2C3E50',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionName: {
    fontSize: 12,
    color: '#fff',
    padding: 8,
    textAlign: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1B263B',
  },
  activeCategoryTab: {
    backgroundColor: '#E74C3C',
  },
  categoryText: {
    fontSize: 14,
    color: '#B0BEC5',
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    backgroundColor: '#2C3E50',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#7F8C8D',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  buyButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default StorePage; 