import api from './api';

export interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'apparel' | 'gear' | 'accessories' | 'training';
  images: string[];
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  stock_quantity: number;
  brand?: string;
  material?: string;
  features: string[];
  rating: number;
  reviews_count: number;
  is_featured: boolean;
}

export interface CartItem {
  id: string;
  merchandise_id: string;
  merchandise: MerchandiseItem;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  user_id: number;
  items: CartItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  shipping_address: string;
  phone: string;
  notes?: string;
}

export interface Review {
  id: string;
  merchandise_id: string;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  timestamp: string;
  verified_purchase: boolean;
}

class MerchandiseService {
  // Mock data for MVP
  private mockMerchandise: MerchandiseItem[] = [
    {
      id: '1',
      name: 'Кимоно AIGA Classic',
      description: 'Профессиональное кимоно для грэпплинга из качественного хлопка. Плотность 450 GSM.',
      price: 25000,
      category: 'apparel',
      images: ['/placeholder-gi.jpg'],
      sizes: ['A1', 'A2', 'A3', 'A4'],
      colors: ['Белый', 'Синий', 'Черный'],
      in_stock: true,
      stock_quantity: 15,
      brand: 'AIGA',
      material: '100% хлопок',
      features: ['Усиленные швы', 'Предварительная усадка', 'Пояс в комплекте'],
      rating: 4.8,
      reviews_count: 24,
      is_featured: true
    },
    {
      id: '2',
      name: 'Рашгард AIGA Pro',
      description: 'Компрессионная футболка с длинным рукавом для тренировок',
      price: 8500,
      category: 'apparel',
      images: ['/placeholder-rashguard.jpg'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Черный', 'Синий', 'Красный'],
      in_stock: true,
      stock_quantity: 30,
      brand: 'AIGA',
      material: '88% полиэстер, 12% спандекс',
      features: ['Антибактериальная обработка', 'УФ защита', 'Сублимационная печать'],
      rating: 4.6,
      reviews_count: 18,
      is_featured: true
    },
    {
      id: '3',
      name: 'Шорты AIGA Fighter',
      description: 'Спортивные шорты для грэпплинга и MMA',
      price: 6500,
      category: 'apparel',
      images: ['/placeholder-shorts.jpg'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Черный', 'Синий'],
      in_stock: true,
      stock_quantity: 20,
      brand: 'AIGA',
      material: 'Полиэстер с эластаном',
      features: ['Эластичный пояс', 'Боковые разрезы', 'Карман на липучке'],
      rating: 4.4,
      reviews_count: 12,
      is_featured: false
    },
    {
      id: '4',
      name: 'Защита для зубов',
      description: 'Одночелюстная капа для контактных видов спорта',
      price: 1200,
      category: 'gear',
      images: ['/placeholder-mouthguard.jpg'],
      sizes: ['Взрослый', 'Детский'],
      colors: ['Прозрачный', 'Черный', 'Синий'],
      in_stock: true,
      stock_quantity: 50,
      brand: 'AIGA',
      material: 'Медицинский силикон',
      features: ['Термоформовка', 'Дыхательные каналы', 'Защитный кейс'],
      rating: 4.2,
      reviews_count: 8,
      is_featured: false
    },
    {
      id: '5',
      name: 'Наколенники AIGA Guard',
      description: 'Защитные наколенники для грэпплинга',
      price: 3500,
      category: 'gear',
      images: ['/placeholder-knee-pads.jpg'],
      sizes: ['S', 'M', 'L'],
      colors: ['Черный'],
      in_stock: true,
      stock_quantity: 12,
      brand: 'AIGA',
      material: 'Неопрен с EVA вставками',
      features: ['Анатомическая форма', 'Дышащий материал', 'Регулируемые ремни'],
      rating: 4.5,
      reviews_count: 15,
      is_featured: false
    },
    {
      id: '6',
      name: 'Сумка спортивная AIGA',
      description: 'Вместительная сумка для спортивной экипировки',
      price: 4500,
      category: 'accessories',
      images: ['/placeholder-gym-bag.jpg'],
      sizes: ['Один размер'],
      colors: ['Черный', 'Синий'],
      in_stock: true,
      stock_quantity: 25,
      brand: 'AIGA',
      material: 'Полиэстер 600D',
      features: ['Отделение для обуви', 'Водоотталкивающая ткань', 'Регулируемый ремень'],
      rating: 4.7,
      reviews_count: 20,
      is_featured: true
    },
    {
      id: '7',
      name: 'Гантели неопреновые 3кг',
      description: 'Пара гантелей для домашних тренировок',
      price: 5500,
      category: 'training',
      images: ['/placeholder-dumbbells.jpg'],
      sizes: ['3кг', '5кг', '8кг'],
      colors: ['Синий', 'Красный', 'Зеленый'],
      in_stock: true,
      stock_quantity: 8,
      brand: 'Fitness Pro',
      material: 'Чугун с неопреновым покрытием',
      features: ['Нескользящее покрытие', 'Эргономичная ручка', 'Плоское основание'],
      rating: 4.3,
      reviews_count: 6,
      is_featured: false
    },
    {
      id: '8',
      name: 'Толстовка AIGA Team',
      description: 'Командная толстовка с капюшоном',
      price: 12000,
      category: 'apparel',
      images: ['/placeholder-hoodie.jpg'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Черный', 'Серый', 'Темно-синий'],
      in_stock: true,
      stock_quantity: 18,
      brand: 'AIGA',
      material: '80% хлопок, 20% полиэстер',
      features: ['Флисовая подкладка', 'Карман-кенгуру', 'Вышитый логотип'],
      rating: 4.9,
      reviews_count: 32,
      is_featured: true
    }
  ];

  private cartItems: CartItem[] = [];

  // Merchandise methods
  async getMerchandise(category?: string): Promise<MerchandiseItem[]> {
    try {
      // Mock implementation - will be replaced with API call
      let items = this.mockMerchandise;
      if (category) {
        items = items.filter(item => item.category === category);
      }
      return items.sort((a, b) => {
        // Featured items first, then by rating
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return b.rating - a.rating;
      });
    } catch (error: any) {
      throw new Error('Failed to get merchandise');
    }
  }

  async getFeaturedMerchandise(): Promise<MerchandiseItem[]> {
    try {
      return this.mockMerchandise.filter(item => item.is_featured);
    } catch (error: any) {
      throw new Error('Failed to get featured merchandise');
    }
  }

  async getMerchandiseById(id: string): Promise<MerchandiseItem | null> {
    try {
      return this.mockMerchandise.find(item => item.id === id) || null;
    } catch (error: any) {
      throw new Error('Failed to get merchandise');
    }
  }

  async searchMerchandise(query: string): Promise<MerchandiseItem[]> {
    try {
      const lowercaseQuery = query.toLowerCase();
      return this.mockMerchandise.filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.description.toLowerCase().includes(lowercaseQuery) ||
        item.brand?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error: any) {
      throw new Error('Failed to search merchandise');
    }
  }

  // Cart methods
  addToCart(merchandise: MerchandiseItem, quantity: number = 1, size?: string, color?: string): void {
    const existingItem = this.cartItems.find(item => 
      item.merchandise_id === merchandise.id &&
      item.selected_size === size &&
      item.selected_color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.quantity * existingItem.unit_price;
    } else {
      const cartItem: CartItem = {
        id: Date.now().toString(),
        merchandise_id: merchandise.id,
        merchandise,
        quantity,
        selected_size: size,
        selected_color: color,
        unit_price: merchandise.price,
        total_price: merchandise.price * quantity
      };
      this.cartItems.push(cartItem);
    }
  }

  removeFromCart(itemId: string): void {
    const index = this.cartItems.findIndex(item => item.id === itemId);
    if (index > -1) {
      this.cartItems.splice(index, 1);
    }
  }

  updateCartItemQuantity(itemId: string, quantity: number): void {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        item.total_price = item.quantity * item.unit_price;
      }
    }
  }

  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.total_price, 0);
  }

  getCartItemsCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  clearCart(): void {
    this.cartItems = [];
  }

  // Order methods
  async createOrder(shippingAddress: string, phone: string, notes?: string): Promise<Order> {
    try {
      // Mock implementation - will be replaced with API call
      const order: Order = {
        id: Date.now().toString(),
        user_id: 1, // Current user
        items: [...this.cartItems],
        total_amount: this.getCartTotal(),
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        shipping_address: shippingAddress,
        phone,
        notes
      };

      // Clear cart after order creation
      this.clearCart();

      return order;
    } catch (error: any) {
      throw new Error('Failed to create order');
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      // Mock implementation - will be replaced with API call
      return [];
    } catch (error: any) {
      throw new Error('Failed to get orders');
    }
  }

  // Review methods
  async getReviews(merchandiseId: string): Promise<Review[]> {
    try {
      // Mock implementation - will be replaced with API call
      return [];
    } catch (error: any) {
      throw new Error('Failed to get reviews');
    }
  }

  async submitReview(merchandiseId: string, rating: number, comment: string): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      console.log('Review submitted', { merchandiseId, rating, comment });
    } catch (error: any) {
      throw new Error('Failed to submit review');
    }
  }

  // Helper methods
  formatPrice(price: number): string {
    return `${price.toLocaleString('ru-RU')} ₸`;
  }

  getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'apparel':
        return 'Одежда';
      case 'gear':
        return 'Защита';
      case 'accessories':
        return 'Аксессуары';
      case 'training':
        return 'Тренировки';
      default:
        return category;
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'confirmed':
        return 'Подтверждено';
      case 'processing':
        return 'В обработке';
      case 'shipped':
        return 'Отправлено';
      case 'delivered':
        return 'Доставлено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  }

  getPaymentStatusDisplayName(status: string): string {
    switch (status) {
      case 'pending':
        return 'Ожидает оплаты';
      case 'paid':
        return 'Оплачено';
      case 'failed':
        return 'Ошибка оплаты';
      case 'refunded':
        return 'Возврат';
      default:
        return status;
    }
  }

  generateOrderLink(order: Order): string {
    // Generate WhatsApp link for order placement
    const message = encodeURIComponent(
      `🏪 Заказ AIGA Connect\n\n` +
      `📦 Товары:\n${order.items.map(item => 
        `• ${item.merchandise.name}${item.selected_size ? ` (${item.selected_size})` : ''}${item.selected_color ? ` - ${item.selected_color}` : ''} x${item.quantity} = ${this.formatPrice(item.total_price)}`
      ).join('\n')}\n\n` +
      `💰 Итого: ${this.formatPrice(order.total_amount)}\n\n` +
      `📍 Адрес доставки: ${order.shipping_address}\n` +
      `📱 Телефон: ${order.phone}\n` +
      `${order.notes ? `📝 Примечания: ${order.notes}\n` : ''}` +
      `\n🆔 Номер заказа: ${order.id}`
    );
    
    return `https://wa.me/77777777777?text=${message}`;
  }
}

export default new MerchandiseService(); 