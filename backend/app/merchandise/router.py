from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.merchandise import schemas, crud

router = APIRouter()

# Public endpoints (доступны всем)
@router.get("/", response_model=schemas.ProductListResponse)
async def get_products(
    category: Optional[schemas.ProductCategory] = Query(None, description="Фильтр по категории"),
    is_featured: Optional[bool] = Query(None, description="Только рекомендуемые товары"),
    search: Optional[str] = Query(None, description="Поиск по названию"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(20, ge=1, le=100, description="Товаров на странице"),
    db: AsyncSession = Depends(get_db)
):
    """Получить список товаров с фильтрами и пагинацией"""
    filters = schemas.ProductFilters(
        category=category,
        is_featured=is_featured,
        search=search,
        status=schemas.ProductStatus.active  # Показываем только активные товары
    )
    
    result = await crud.get_products_with_filters(db, filters, page, per_page)
    return result

@router.get("/featured", response_model=List[schemas.ProductOut])
async def get_featured_products(
    limit: int = Query(6, le=20, description="Количество товаров"),
    db: AsyncSession = Depends(get_db)
):
    """Получить рекомендуемые товары"""
    products = await crud.get_featured_products(db, limit)
    return products

@router.get("/categories", response_model=List[str])
async def get_product_categories():
    """Получить список всех категорий товаров"""
    return [category.value for category in schemas.ProductCategory]

@router.get("/{product_id}", response_model=schemas.ProductWithVariants)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить товар по ID с вариантами"""
    product = await crud.get_product_with_variants(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.get("/slug/{slug}", response_model=schemas.ProductWithVariants)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить товар по slug с вариантами"""
    product = await crud.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

# Collections endpoints
@router.get("/collections/", response_model=List[schemas.ProductCollectionOut])
async def get_collections(
    is_featured: Optional[bool] = Query(None, description="Только рекомендуемые коллекции"),
    db: AsyncSession = Depends(get_db)
):
    """Получить список коллекций"""
    try:
        collections = await crud.get_collections(db, is_featured)
        return collections
    except Exception as e:
        print(f"Error getting collections: {e}")
        # Return empty list if there's an error
        return []

@router.get("/collections/{collection_id}", response_model=schemas.ProductCollectionWithProducts)
async def get_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить коллекцию с товарами"""
    collection = await crud.get_collection_with_products(db, collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    return collection

# Admin endpoints (только для тренеров)
@router.post("/", response_model=schemas.ProductOut)
async def create_product(
    product_data: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать товар (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create products"
        )
    
    product = await crud.create_product(db, product_data)
    return product

@router.post("/quick", response_model=schemas.ProductOut)
async def create_quick_product(
    product_data: schemas.QuickProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Быстрое создание товара для MVP (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create products"
        )
    
    # Преобразуем в полную схему
    full_data = schemas.ProductCreate(
        name=product_data.name,
        description=product_data.description,
        category=product_data.category,
        price=product_data.price,
        external_url=product_data.external_url,
        main_image_url=product_data.image_url,
        short_description=product_data.description[:100] + "..." if len(product_data.description) > 100 else product_data.description
    )
    
    product = await crud.create_product(db, full_data)
    return product

@router.put("/{product_id}", response_model=schemas.ProductOut)
async def update_product(
    product_id: int,
    product_data: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить товар (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can update products"
        )
    
    product = await crud.update_product(db, product_id, product_data)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить товар (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can delete products"
        )
    
    success = await crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return {"message": "Product deleted successfully"}
