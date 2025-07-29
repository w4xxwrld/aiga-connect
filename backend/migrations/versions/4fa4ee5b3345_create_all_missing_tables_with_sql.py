"""create_all_missing_tables_with_sql

Revision ID: 4fa4ee5b3345
Revises: b0692d978dbb
Create Date: 2025-07-29 12:56:49.431251

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fa4ee5b3345'
down_revision: Union[str, Sequence[str], None] = 'b0692d978dbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Создаем недостающие enum типы только если они не существуют
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE notificationtype AS ENUM ('booking_confirmed', 'booking_cancelled', 'training_reminder', 'tournament_announcement', 'achievement_earned', 'belt_promotion', 'individual_training_accepted', 'individual_training_declined', 'schedule_change', 'general_announcement');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE notificationpriority AS ENUM ('low', 'normal', 'high', 'urgent');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE achievementtype AS ENUM ('belt_promotion', 'tournament_win', 'tournament_participation', 'attendance_milestone', 'technique_mastery', 'special_recognition');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE tournamentlevel AS ENUM ('local', 'regional', 'national', 'international');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE tournamentstatus AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE participationresult AS ENUM ('first_place', 'second_place', 'third_place', 'participation');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE productcategory AS ENUM ('gi', 'rashguard', 'shorts', 'belt', 'accessories', 'patches', 'apparel', 'equipment');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE chattype AS ENUM ('general', 'parents', 'athletes', 'coaches', 'announcement');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE messagetype AS ENUM ('text', 'image', 'file', 'announcement');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)
    
    # Создаем все недостающие таблицы в правильном порядке
    # Сначала создаем tournaments, чтобы на них могли ссылаться achievements
    op.execute("""
    CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        location VARCHAR NOT NULL,
        tournament_level tournamentlevel DEFAULT 'local',
        age_categories VARCHAR,
        weight_categories VARCHAR,
        belt_categories VARCHAR,
        registration_start TIMESTAMP,
        registration_end TIMESTAMP,
        event_date TIMESTAMP NOT NULL,
        status tournamentstatus DEFAULT 'upcoming',
        organizer VARCHAR,
        contact_info VARCHAR,
        registration_fee INTEGER,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_tournaments_id ON tournaments(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        athlete_id INTEGER NOT NULL REFERENCES users(id),
        current_belt beltlevel DEFAULT 'white',
        current_stripes INTEGER DEFAULT 0,
        total_classes_attended INTEGER DEFAULT 0,
        total_tournaments_participated INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        total_losses INTEGER DEFAULT 0,
        belt_received_date TIMESTAMP,
        last_promotion_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_progress_id ON progress(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        athlete_id INTEGER NOT NULL REFERENCES users(id),
        achievement_type achievementtype NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        tournament_id INTEGER REFERENCES tournaments(id),
        belt_level beltlevel,
        points_earned INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT TRUE,
        achieved_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_achievements_id ON achievements(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS tournament_participations (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
        athlete_id INTEGER NOT NULL REFERENCES users(id),
        weight_category VARCHAR,
        belt_division beltlevel,
        result participationresult,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_tournament_participations_id ON tournament_participations(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type notificationtype NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        priority notificationpriority DEFAULT 'normal',
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        scheduled_for TIMESTAMP,
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS notification_templates (
        id SERIAL PRIMARY KEY,
        type notificationtype UNIQUE NOT NULL,
        title_template VARCHAR NOT NULL,
        message_template TEXT NOT NULL,
        default_priority notificationpriority DEFAULT 'normal',
        is_push_enabled BOOLEAN DEFAULT TRUE,
        is_email_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_notification_templates_id ON notification_templates(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        device_token VARCHAR NOT NULL,
        platform VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_push_tokens_id ON push_tokens(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        short_description VARCHAR,
        category productcategory NOT NULL,
        tags JSON,
        price NUMERIC(10, 2) NOT NULL,
        original_price NUMERIC(10, 2),
        currency VARCHAR DEFAULT 'KZT',
        status productstatus DEFAULT 'active',
        is_featured BOOLEAN DEFAULT FALSE,
        main_image_url VARCHAR,
        images JSON,
        has_variants BOOLEAN DEFAULT FALSE,
        slug VARCHAR UNIQUE,
        meta_title VARCHAR,
        meta_description TEXT,
        external_url VARCHAR,
        sku VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_products_id ON products(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        slug VARCHAR UNIQUE NOT NULL,
        banner_image_url VARCHAR,
        thumbnail_image_url VARCHAR,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_product_collections_id ON product_collections(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        name VARCHAR NOT NULL,
        attributes JSON NOT NULL,
        price_adjustment NUMERIC(10, 2) DEFAULT 0,
        sku VARCHAR,
        stock_quantity INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_product_variants_id ON product_variants(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS collection_products (
        collection_id INTEGER NOT NULL REFERENCES product_collections(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        PRIMARY KEY (collection_id, product_id)
    );
    """)
    
    # Создаем таблицы чата и форума
    op.execute("""
    CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        chat_type chattype NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_public BOOLEAN DEFAULT TRUE,
        max_members INTEGER,
        is_moderated BOOLEAN DEFAULT FALSE,
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_chat_rooms_id ON chat_rooms(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS chat_memberships (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        is_admin BOOLEAN DEFAULT FALSE,
        is_moderator BOOLEAN DEFAULT FALSE,
        can_post BOOLEAN DEFAULT TRUE,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMP DEFAULT NOW(),
        last_read_at TIMESTAMP,
        UNIQUE(room_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS ix_chat_memberships_id ON chat_memberships(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        message_type messagetype DEFAULT 'text',
        content TEXT NOT NULL,
        file_url VARCHAR,
        reply_to_id INTEGER REFERENCES chat_messages(id),
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_chat_messages_id ON chat_messages(id);
    CREATE INDEX IF NOT EXISTS ix_chat_messages_room_id ON chat_messages(room_id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES chat_messages(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        emoji VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
    );
    CREATE INDEX IF NOT EXISTS ix_message_reactions_id ON message_reactions(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS forum_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        icon VARCHAR,
        color VARCHAR,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        is_moderated BOOLEAN DEFAULT FALSE,
        min_role_to_post VARCHAR DEFAULT 'athlete',
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_forum_categories_id ON forum_categories(id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS forum_topics (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES forum_categories(id),
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        views_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        last_reply_id INTEGER,
        last_reply_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_forum_topics_id ON forum_topics(id);
    CREATE INDEX IF NOT EXISTS ix_forum_topics_category_id ON forum_topics(category_id);
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS forum_replies (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES forum_topics(id),
        author_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        reply_to_id INTEGER REFERENCES forum_replies(id),
        is_edited BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_forum_replies_id ON forum_replies(id);
    CREATE INDEX IF NOT EXISTS ix_forum_replies_topic_id ON forum_replies(topic_id);
    """)
    
    # Добавляем внешний ключ для last_reply_id после создания таблицы
    op.execute("""
    ALTER TABLE forum_topics 
    ADD CONSTRAINT fk_forum_topics_last_reply 
    FOREIGN KEY (last_reply_id) REFERENCES forum_replies(id);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем таблицы в обратном порядке
    op.execute("DROP TABLE IF EXISTS forum_replies")
    op.execute("DROP TABLE IF EXISTS forum_topics")  
    op.execute("DROP TABLE IF EXISTS forum_categories")
    op.execute("DROP TABLE IF EXISTS message_reactions")
    op.execute("DROP TABLE IF EXISTS chat_messages")
    op.execute("DROP TABLE IF EXISTS chat_memberships")
    op.execute("DROP TABLE IF EXISTS chat_rooms")
    op.execute("DROP TABLE IF EXISTS collection_products")
    op.execute("DROP TABLE IF EXISTS product_variants")
    op.execute("DROP TABLE IF EXISTS product_collections")
    op.execute("DROP TABLE IF EXISTS products")
    op.execute("DROP TABLE IF EXISTS push_tokens")
    op.execute("DROP TABLE IF EXISTS notification_templates")
    op.execute("DROP TABLE IF EXISTS notifications")
    op.execute("DROP TABLE IF EXISTS tournament_participations")
    op.execute("DROP TABLE IF EXISTS tournaments")
    op.execute("DROP TABLE IF EXISTS achievements")
    op.execute("DROP TABLE IF EXISTS progress")
    
    # Удаляем enum типы
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS chattype")
    op.execute("DROP TYPE IF EXISTS productstatus")
    op.execute("DROP TYPE IF EXISTS productcategory")
    op.execute("DROP TYPE IF EXISTS participationresult")
    op.execute("DROP TYPE IF EXISTS tournamentstatus")
    op.execute("DROP TYPE IF EXISTS tournamentlevel")
    op.execute("DROP TYPE IF EXISTS achievementtype")
    op.execute("DROP TYPE IF EXISTS notificationpriority")
    op.execute("DROP TYPE IF EXISTS notificationtype")
