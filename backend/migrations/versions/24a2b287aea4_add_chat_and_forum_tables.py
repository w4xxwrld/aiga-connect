"""add_chat_and_forum_tables

Revision ID: 24a2b287aea4
Revises: 4fa4ee5b3345
Create Date: 2025-07-29 13:07:26.951399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24a2b287aea4'
down_revision: Union[str, Sequence[str], None] = '4fa4ee5b3345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Создаем enum типы для чата
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
    
    # Удаляем enum типы
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS chattype")
