"""
Script to export OpenAPI schema from FastAPI application.
This is used to generate TypeScript types for the frontend.
"""
import json
import os
import sys

# Set minimal environment variables to avoid validation errors
# These are only used for schema generation and won't affect the actual app
# Use postgresql+asyncpg:// for async database driver
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://dummy:dummy@localhost/dummy")
os.environ.setdefault("ALEMBIC_DATABASE_URL", "postgresql+asyncpg://dummy:dummy@localhost/dummy")
os.environ.setdefault("SECRET_KEY", "dummy-secret-key-for-schema-generation")
os.environ.setdefault("ADMIN_SECRET_KEY", "dummy-admin-secret-key")
os.environ.setdefault("TWILIO_ACCOUNT_SID", "dummy-sid")
os.environ.setdefault("TWILIO_AUTH_TOKEN", "dummy-token")
os.environ.setdefault("TWILIO_VERIFY_SERVICE_SID", "dummy-service-sid")
os.environ.setdefault("SUPABASE_URL", "https://dummy.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "dummy-key")

try:
    from app.main import app

    if __name__ == "__main__":
        openapi_schema = app.openapi()

        # Write to file
        with open("openapi.json", "w", encoding="utf-8") as f:
            json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

        print("✓ OpenAPI schema exported to openapi.json")
except Exception as e:
    print(f"❌ Error exporting OpenAPI schema: {e}", file=sys.stderr)
    sys.exit(1)
