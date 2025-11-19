"""
Service for handling user profile photo uploads to Supabase Storage.
"""

import io
import uuid
from pathlib import Path
from PIL import Image
from fastapi import UploadFile, HTTPException, status

from app.config import settings
from app.core.supabase_client import SupabaseClient


class PhotoService:
    """Service for profile photo upload, validation, and management."""

    @staticmethod
    def validate_file_size(file: UploadFile) -> None:
        """
        Validate file size before processing.

        Args:
            file: Uploaded file

        Raises:
            HTTPException: If file size exceeds limit
        """
        # Reset file position
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning

        if file_size > settings.MAX_UPLOAD_SIZE:
            max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed ({max_mb}MB)"
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file not allowed"
            )

    @staticmethod
    def validate_file_type(file: UploadFile) -> None:
        """
        Validate file type by extension and MIME type.

        Args:
            file: Uploaded file

        Raises:
            HTTPException: If file type is not allowed
        """
        # Check file extension
        if file.filename:
            extension = Path(file.filename).suffix.lower()
            if extension not in settings.ALLOWED_IMAGE_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
                )

        # Check MIME type
        if file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type. Allowed: {', '.join(settings.ALLOWED_MIME_TYPES)}"
            )

    @staticmethod
    def validate_image(file_data: bytes) -> None:
        """
        Validate that file is actually a valid image using Pillow.

        Args:
            file_data: File binary data

        Raises:
            HTTPException: If file is not a valid image
        """
        try:
            image = Image.open(io.BytesIO(file_data))
            image.verify()  # Verify it's a valid image
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file. File may be corrupted or not a real image."
            )

    @staticmethod
    def generate_filename(user_id: int, original_filename: str) -> str:
        """
        Generate unique filename for storage.

        Args:
            user_id: User ID
            original_filename: Original uploaded filename

        Returns:
            Unique filename with UUID

        Example:
            >>> generate_filename(123, "profile.jpg")
            "photo_a1b2c3d4.jpg"
        """
        extension = Path(original_filename).suffix.lower() if original_filename else ".jpg"
        unique_id = str(uuid.uuid4())[:8]  # Short UUID
        return f"photo_{unique_id}{extension}"

    @staticmethod
    def get_storage_path(user_id: int, filename: str) -> str:
        """
        Get full storage path for user's photo.

        Args:
            user_id: User ID
            filename: Photo filename

        Returns:
            Full storage path

        Example:
            >>> get_storage_path(123, "photo_abc.jpg")
            "users/123/photo_abc.jpg"
        """
        return f"users/{user_id}/{filename}"

    @classmethod
    async def upload_photo(cls, user_id: int, file: UploadFile) -> str:
        """
        Upload profile photo to Supabase Storage.

        Args:
            user_id: User ID
            file: Uploaded file

        Returns:
            Public URL of uploaded photo

        Raises:
            HTTPException: If validation fails or upload errors
        """
        # Validate file
        cls.validate_file_size(file)
        cls.validate_file_type(file)

        # Read file data
        file_data = await file.read()

        # Validate it's actually an image
        cls.validate_image(file_data)

        # Generate unique filename
        filename = cls.generate_filename(user_id, file.filename)

        # Get storage path
        storage_path = cls.get_storage_path(user_id, filename)

        # Upload to Supabase
        try:
            public_url = SupabaseClient.upload_file(
                bucket=settings.SUPABASE_BUCKET,
                path=storage_path,
                file_data=file_data,
                content_type=file.content_type
            )
            return public_url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload photo: {str(e)}"
            )

    @classmethod
    def delete_photo(cls, photo_url: str) -> None:
        """
        Delete photo from Supabase Storage.

        Args:
            photo_url: Full URL of photo to delete

        Raises:
            HTTPException: If deletion fails
        """
        if not photo_url:
            return  # Nothing to delete

        # Extract storage path from URL
        storage_path = SupabaseClient.extract_path_from_url(photo_url)

        if not storage_path:
            # Not a Supabase URL, skip deletion
            return

        # Delete from Supabase
        try:
            SupabaseClient.delete_file(
                bucket=settings.SUPABASE_BUCKET,
                path=storage_path
            )
        except Exception as e:
            # Log error but don't fail the request
            # Old photo might already be deleted
            print(f"Warning: Failed to delete old photo: {str(e)}")
