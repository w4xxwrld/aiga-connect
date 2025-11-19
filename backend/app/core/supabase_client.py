"""
Supabase client for file storage operations.
"""

from supabase import create_client, Client
from app.config import settings


class SupabaseClient:
    """Singleton Supabase client for storage operations."""

    _instance: Client | None = None

    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance."""
        if cls._instance is None:
            cls._instance = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY
            )
        return cls._instance

    @classmethod
    def upload_file(
        cls,
        bucket: str,
        path: str,
        file_data: bytes,
        content_type: str
    ) -> str:
        """
        Upload file to Supabase storage.

        Args:
            bucket: Storage bucket name
            path: File path in bucket (e.g., "users/123/photo.jpg")
            file_data: File binary data
            content_type: MIME type (e.g., "image/jpeg")

        Returns:
            Public URL of uploaded file

        Raises:
            Exception: If upload fails
        """
        try:
            client = cls.get_client()

            # Upload file (upsert replaces existing file)
            response = client.storage.from_(bucket).upload(
                path=path,
                file=file_data,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )

            # Get public URL
            public_url = client.storage.from_(bucket).get_public_url(path)

            return public_url
        except Exception as e:
            print(f"DEBUG: Supabase upload error - Bucket: {bucket}, Path: {path}, Error: {str(e)}")
            raise

    @classmethod
    def delete_file(cls, bucket: str, path: str) -> None:
        """
        Delete file from Supabase storage.

        Args:
            bucket: Storage bucket name
            path: File path in bucket

        Raises:
            Exception: If deletion fails
        """
        client = cls.get_client()
        client.storage.from_(bucket).remove([path])

    @classmethod
    def extract_path_from_url(cls, url: str) -> str | None:
        """
        Extract storage path from Supabase public URL.

        Args:
            url: Full Supabase storage URL

        Returns:
            Storage path or None if not a Supabase URL

        Example:
            >>> url = "https://xxx.supabase.co/storage/v1/object/public/profile-photos/users/123/photo.jpg"
            >>> extract_path_from_url(url)
            "users/123/photo.jpg"
        """
        if not url or not isinstance(url, str):
            return None

        # Extract path after bucket name
        try:
            parts = url.split(f"/{settings.SUPABASE_BUCKET}/")
            if len(parts) == 2:
                return parts[1]
        except Exception:
            pass

        return None
