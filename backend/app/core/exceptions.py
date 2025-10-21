"""Custom exception classes for the application."""

from fastapi import HTTPException, status


class BaseAPIException(HTTPException):
    """Base exception for all API exceptions."""

    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class AuthenticationError(BaseAPIException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(BaseAPIException):
    """Raised when user lacks permissions."""

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundError(BaseAPIException):
    """Raised when resource is not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ValidationError(BaseAPIException):
    """Raised when validation fails."""

    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


class ConflictError(BaseAPIException):
    """Raised when there's a conflict (e.g., duplicate resource)."""

    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_409_CONFLICT,
        )


class BusinessLogicError(BaseAPIException):
    """Raised when business logic constraints are violated."""

    def __init__(self, detail: str):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
