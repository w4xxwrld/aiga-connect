import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.merchandise.models import Product, ProductVariant, ProductCollection, ProductCategory, ProductStatus

async def seed_merchandise():
    """Добавить тестовые товары мерча для MVP"""
    async with AsyncSessionLocal() as db:
        # Проверяем, есть ли уже товары
        from sqlalchemy import select
        result = await db.execute(select(Product))
        if result.first():
            print("Товары уже существуют, пропускаем...")
            return

        # Создаем тестовые товары
        products = [
            Product(
                name="AIGA Кимоно белое",
                description="Качественное кимоно для грэпплинга из 100% хлопка. Подходит для тренировок и соревнований.",
                short_description="Белое кимоно для грэпплинга",
                category=ProductCategory.gi,
                price=25000,
                currency="KZT",
                status=ProductStatus.active,
                is_featured=True,
                main_image_url="https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRt6_ZoYS9c9csDPp_wDM39Hzsul0apqUIOhTv-lpOmrWVwsB0pFyIAQ3OZivOt7rD8zqTLfqOA_gg3QKtMNquUgeesvh6J7IKZ8U9WAqDUFbiET7xXF-9D",
                sku="AIGA-GI-WHITE",
                has_variants=True,
                tags=["cotton", "competition", "bjj"]
            ),
            Product(
                name="AIGA Рашгард черный",
                description="Компрессионный рашгард с логотипом AIGA. Отводит влагу и обеспечивает комфорт во время тренировок.",
                short_description="Черный рашгард AIGA",
                category=ProductCategory.rashguard,
                price=8000,
                currency="KZT",
                status=ProductStatus.active,
                is_featured=True,
                main_image_url="https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTti1WE3CiKouREcvIRXV2El83WypZzMV9Ei4zV8qi7L32TVJaMD0fa4-_y2D9OkvtMCvbKaJFfqDnSWK7FUAeRFG1utUmY5uCSfJTXN9fwLwy1fBoc7ET56Q",
                sku="AIGA-RASH-BLACK",
                has_variants=True,
                tags=["compression", "moisture-wicking"]
            ),
            Product(
                name="AIGA Шорты для грэпплинга",
                description="Удобные шорты для тренировок по грэпплингу с эластичным поясом и боковыми разрезами.",
                short_description="Шорты для грэпплинга",
                category=ProductCategory.shorts,
                price=6000,
                currency="KZT",
                status=ProductStatus.active,
                main_image_url="https://s.alicdn.com/@sc04/kf/A1ab109b529624409ae448c785ee96fa8t.jpg",
                sku="AIGA-SHORTS",
                has_variants=True,
                tags=["training", "flexible"]
            )
        ]

        # Добавляем товары в БД
        for product in products:
            db.add(product)
        
        await db.commit()

        # Получаем ID созданных товаров для создания вариантов
        await db.refresh(products[0])  # Кимоно
        await db.refresh(products[1])  # Рашгард
        await db.refresh(products[2])  # Шорты

        # Создаем варианты товаров
        variants = [
            # Варианты кимоно
            ProductVariant(
                product_id=products[0].id,
                name="Размер A1",
                attributes={"size": "A1"},
                stock_quantity=10,
                sku="AIGA-GI-WHITE-A1"
            ),
            ProductVariant(
                product_id=products[0].id,
                name="Размер A2",
                attributes={"size": "A2"},
                stock_quantity=15,
                sku="AIGA-GI-WHITE-A2"
            ),
            ProductVariant(
                product_id=products[0].id,
                name="Размер A3",
                attributes={"size": "A3"},
                stock_quantity=8,
                sku="AIGA-GI-WHITE-A3"
            ),
            
            # Варианты рашгарда
            ProductVariant(
                product_id=products[1].id,
                name="Размер S",
                attributes={"size": "S"},
                stock_quantity=20,
                sku="AIGA-RASH-BLACK-S"
            ),
            ProductVariant(
                product_id=products[1].id,
                name="Размер M",
                attributes={"size": "M"},
                stock_quantity=25,
                sku="AIGA-RASH-BLACK-M"
            ),
            ProductVariant(
                product_id=products[1].id,
                name="Размер L",
                attributes={"size": "L"},
                stock_quantity=15,
                sku="AIGA-RASH-BLACK-L"
            ),
            
            # Варианты шорт
            ProductVariant(
                product_id=products[2].id,
                name="Размер M",
                attributes={"size": "M"},
                stock_quantity=12,
                sku="AIGA-SHORTS-M"
            ),
            ProductVariant(
                product_id=products[2].id,
                name="Размер L",
                attributes={"size": "L"},
                stock_quantity=18,
                sku="AIGA-SHORTS-L"
            ),
        ]

        for variant in variants:
            db.add(variant)

        await db.commit()
        print(f"Создано {len(products)} товаров и {len(variants)} вариантов")

if __name__ == "__main__":
    asyncio.run(seed_merchandise())
