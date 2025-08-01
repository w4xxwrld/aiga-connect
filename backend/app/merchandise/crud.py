from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc, func, asc
from typing import List, Optional
from datetime import datetime
import re

from app.merchandise.models import Product, ProductVariant, ProductCollection, ProductStatus
from app.merchandise.schemas import (
    ProductCreate, ProductUpdate, ProductFilters, ProductListResponse,
    ProductVariantCreate, ProductVariantUpdate,
    ProductCollectionCreate, ProductCollectionUpdate
)

# Product CRUD
async def create_product(db: AsyncSession, product_data: ProductCreate) -> Product:
    """Создать товар"""
    # Генерируем slug если не указан
    if not product_data.slug:
        slug = generate_slug(product_data.name)
        product_data.slug = await ensure_unique_slug(db, slug)
    
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

async def get_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    """Получить товар по ID"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    return result.scalar_one_or_none()

async def get_product_by_slug(db: AsyncSession, slug: str) -> Optional[Product]:
    """Получить товар по slug"""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.slug == slug)
    )
    return result.scalar_one_or_none()

async def get_product_with_variants(db: AsyncSession, product_id: int) -> Optional[Product]:
    """Получить товар с вариантами"""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.id == product_id)
    )
    return result.scalar_one_or_none()

async def get_products_with_filters(
    db: AsyncSession, 
    filters: ProductFilters, 
    page: int = 1, 
    per_page: int = 20
) -> ProductListResponse:
    """Получить товары с фильтрами и пагинацией"""
    query = select(Product)
    
    # Применяем фильтры
    conditions = []
    
    if filters.category:
        conditions.append(Product.category == filters.category)
    
    if filters.status:
        conditions.append(Product.status == filters.status)
    
    if filters.is_featured is not None:
        conditions.append(Product.is_featured == filters.is_featured)
    
    if filters.min_price:
        conditions.append(Product.price >= filters.min_price)
    
    if filters.max_price:
        conditions.append(Product.price <= filters.max_price)
    
    if filters.search:
        search_term = f"%{filters.search}%"
        conditions.append(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.short_description.ilike(search_term)
            )
        )
    
    if filters.tags:
        # Поиск по тегам (JSON содержит любой из указанных тегов)
        tag_conditions = []
        for tag in filters.tags:
            tag_conditions.append(Product.tags.op('?')(tag))
        conditions.append(or_(*tag_conditions))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Подсчитываем общее количество
    count_query = select(func.count(Product.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Применяем пагинацию и сортировку
    offset = (page - 1) * per_page
    query = query.order_by(desc(Product.is_featured), desc(Product.created_at))
    query = query.limit(per_page).offset(offset)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    pages = (total + per_page - 1) // per_page
    
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )

async def get_featured_products(db: AsyncSession, limit: int = 6) -> List[Product]:
    """Получить рекомендуемые товары"""
    result = await db.execute(
        select(Product)
        .where(and_(Product.is_featured == True, Product.status == ProductStatus.active))
        .order_by(desc(Product.created_at))
        .limit(limit)
    )
    return result.scalars().all()

async def update_product(db: AsyncSession, product_id: int, product_data: ProductUpdate) -> Optional[Product]:
    """Обновить товар"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return None
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    product.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(product)
    return product

async def delete_product(db: AsyncSession, product_id: int) -> bool:
    """Удалить товар"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return False
    
    await db.delete(product)
    await db.commit()
    return True

# Product Variant CRUD
async def create_product_variant(db: AsyncSession, variant_data: ProductVariantCreate) -> ProductVariant:
    """Создать вариант товара"""
    variant = ProductVariant(**variant_data.model_dump())
    db.add(variant)
    
    # Обновляем флаг has_variants у товара
    product = await get_product(db, variant_data.product_id)
    if product:
        product.has_variants = True
    
    await db.commit()
    await db.refresh(variant)
    return variant

async def get_product_variants(db: AsyncSession, product_id: int) -> List[ProductVariant]:
    """Получить варианты товара"""
    result = await db.execute(
        select(ProductVariant)
        .where(ProductVariant.product_id == product_id)
        .order_by(asc(ProductVariant.name))
    )
    return result.scalars().all()

# Product Collection CRUD
async def create_collection(db: AsyncSession, collection_data: ProductCollectionCreate) -> ProductCollection:
    """Создать коллекцию"""
    collection = ProductCollection(**collection_data.model_dump())
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return collection

async def get_collections(db: AsyncSession, is_featured: Optional[bool] = None) -> List[ProductCollection]:
    """Получить коллекции"""
    try:
        query = select(ProductCollection).where(ProductCollection.is_active == True)
        
        if is_featured is not None:
            query = query.where(ProductCollection.is_featured == is_featured)
        
        query = query.order_by(asc(ProductCollection.sort_order), desc(ProductCollection.created_at))
        
        result = await db.execute(query)
        collections = result.scalars().all()
        
        # Filter out collections without required fields
        valid_collections = []
        for collection in collections:
            if collection.name:  # Only include collections with names
                valid_collections.append(collection)
        
        return valid_collections
    except Exception as e:
        print(f"Error in get_collections: {e}")
        return []

async def get_collection_with_products(db: AsyncSession, collection_id: int) -> Optional[ProductCollection]:
    """Получить коллекцию с товарами"""
    result = await db.execute(
        select(ProductCollection)
        .options(selectinload(ProductCollection.products))
        .where(ProductCollection.id == collection_id)
    )
    return result.scalar_one_or_none()

# Utility functions
def generate_slug(name: str) -> str:
    """Генерировать slug из названия"""
    # Транслитерация основных русских букв
    translit_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    }
    
    slug = name.lower()
    
    # Транслитерация
    for cyrillic, latin in translit_map.items():
        slug = slug.replace(cyrillic, latin)
    
    # Удаляем все кроме букв, цифр и пробелов
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    
    # Заменяем пробелы и множественные дефисы на одиночные дефисы
    slug = re.sub(r'[\s-]+', '-', slug)
    
    # Убираем дефисы в начале и конце
    slug = slug.strip('-')
    
    return slug

async def ensure_unique_slug(db: AsyncSession, base_slug: str) -> str:
    """Обеспечить уникальность slug"""
    slug = base_slug
    counter = 1
    
    while True:
        result = await db.execute(
            select(Product).where(Product.slug == slug)
        )
        if not result.scalar_one_or_none():
            break
        
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug
