from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.merchandise.models import ProductCategory, ProductStatus

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: ProductCategory
    price: Decimal
    original_price: Optional[Decimal] = None
    currency: str = "KZT"
    tags: Optional[List[str]] = None

class ProductCreate(ProductBase):
    slug: Optional[str] = None
    external_url: Optional[str] = None
    sku: Optional[str] = None
    main_image_url: Optional[str] = None
    images: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[ProductCategory] = None
    price: Optional[Decimal] = None
    original_price: Optional[Decimal] = None
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None
    main_image_url: Optional[str] = None
    images: Optional[List[str]] = None
    external_url: Optional[str] = None
    tags: Optional[List[str]] = None

class ProductOut(ProductBase):
    id: int
    status: ProductStatus
    is_featured: bool
    slug: Optional[str] = None
    main_image_url: Optional[str] = None
    images: Optional[List[str]] = None
    external_url: Optional[str] = None
    sku: Optional[str] = None
    has_variants: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Product Variant Schemas
class ProductVariantBase(BaseModel):
    name: str
    attributes: Dict[str, Any]  # {"size": "A2", "color": "white"}
    price_adjustment: Decimal = Decimal('0.00')
    stock_quantity: int = 0
    is_available: bool = True

class ProductVariantCreate(ProductVariantBase):
    product_id: int
    sku: Optional[str] = None
    image_url: Optional[str] = None

class ProductVariantUpdate(BaseModel):
    name: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    price_adjustment: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    sku: Optional[str] = None
    image_url: Optional[str] = None

class ProductVariantOut(ProductVariantBase):
    id: int
    product_id: int
    sku: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Product with Variants
class ProductWithVariants(ProductOut):
    variants: List[ProductVariantOut] = []

# Product Collection Schemas
class ProductCollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None  # Make slug optional to handle existing data
    banner_image_url: Optional[str] = None
    thumbnail_image_url: Optional[str] = None

class ProductCollectionCreate(ProductCollectionBase):
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0

class ProductCollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    banner_image_url: Optional[str] = None
    thumbnail_image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None

class ProductCollectionOut(ProductCollectionBase):
    id: int
    is_active: bool
    is_featured: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Collection with Products
class ProductCollectionWithProducts(ProductCollectionOut):
    products: List[ProductOut] = []

# Filter and Search Schemas
class ProductFilters(BaseModel):
    category: Optional[ProductCategory] = None
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None  # Поиск по названию и описанию

class ProductListResponse(BaseModel):
    """Ответ для списка товаров с пагинацией"""
    products: List[ProductOut]
    total: int
    page: int
    per_page: int
    pages: int

# Quick Create for MVP
class QuickProductCreate(BaseModel):
    """Упрощенное создание товара для MVP"""
    name: str
    description: str
    category: ProductCategory
    price: Decimal
    external_url: str  # Ссылка на покупку
    image_url: Optional[str] = None
