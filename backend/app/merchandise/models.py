from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Boolean, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime
from decimal import Decimal

class ProductCategory(str, Enum):
    gi = "gi"  # Кимоно
    rashguard = "rashguard"  # Рашгарды
    shorts = "shorts"  # Шорты
    belt = "belt"  # Пояса
    accessories = "accessories"  # Аксессуары
    patches = "patches"  # Нашивки
    apparel = "apparel"  # Одежда
    equipment = "equipment"  # Оборудование

class ProductStatus(str, Enum):
    active = "active"
    discontinued = "discontinued"
    out_of_stock = "out_of_stock"
    coming_soon = "coming_soon"

class Product(Base):
    """Товары мерчендайза"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    name = Column(String, nullable=False)  # "AIGA Кимоно белое"
    description = Column(Text, nullable=True)
    short_description = Column(String, nullable=True)  # Краткое описание для списка
    
    # Категория и теги
    category = Column(SqlEnum(ProductCategory), nullable=False)
    tags = Column(JSON, nullable=True)  # ["cotton", "competition", "premium"]
    
    # Цена и наличие
    price = Column(Numeric(10, 2), nullable=False)  # Цена в тенге
    original_price = Column(Numeric(10, 2), nullable=True)  # Оригинальная цена (для скидок)
    currency = Column(String, default="KZT")
    
    # Статус и наличие
    status = Column(SqlEnum(ProductStatus), default=ProductStatus.active)
    is_featured = Column(Boolean, default=False)  # Рекомендуемый товар
    
    # Изображения и медиа
    main_image_url = Column(String, nullable=True)
    images = Column(JSON, nullable=True)  # Массив URL изображений
    
    # Варианты (размеры, цвета)
    has_variants = Column(Boolean, default=False)
    
    # SEO и метаданные
    slug = Column(String, unique=True, nullable=True)  # aiga-kimono-white
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Данные для заказа
    external_url = Column(String, nullable=True)  # Ссылка на внешний магазин
    sku = Column(String, nullable=True)  # Артикул
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    """Варианты товара (размеры, цвета)"""
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Характеристики варианта
    name = Column(String, nullable=False)  # "Размер A2", "Белый M"
    attributes = Column(JSON, nullable=False)  # {"size": "A2", "color": "white"}
    
    # Цена и наличие для варианта
    price_adjustment = Column(Numeric(10, 2), default=0)  # Доплата к основной цене
    sku = Column(String, nullable=True)
    stock_quantity = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    
    # Изображения варианта
    image_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="variants")

class ProductCollection(Base):
    """Коллекции товаров"""
    __tablename__ = "product_collections"

    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    name = Column(String, nullable=False)  # "Летняя коллекция 2025"
    description = Column(Text, nullable=True)
    slug = Column(String, unique=True, nullable=False)
    
    # Изображения
    banner_image_url = Column(String, nullable=True)
    thumbnail_image_url = Column(String, nullable=True)
    
    # Настройки отображения
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("Product", secondary="collection_products", back_populates="collections")

# Промежуточная таблица для связи many-to-many
from sqlalchemy import Table
collection_products = Table(
    'collection_products',
    Base.metadata,
    Column('collection_id', Integer, ForeignKey('product_collections.id'), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True)
)

# Добавляем обратную связь в Product
Product.collections = relationship("ProductCollection", secondary=collection_products, back_populates="products")
