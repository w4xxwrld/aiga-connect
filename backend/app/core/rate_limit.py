"""Simple rate limiting implementation."""

from fastapi import Request, HTTPException, status
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    Simple in-memory rate limiter.

    Note: This is a basic implementation suitable for single-instance deployments.
    For production with multiple instances, consider using Redis-based rate limiting.
    """

    def __init__(self):
        # Store: {identifier: [(timestamp, count)]}
        self._requests: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def is_rate_limited(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if identifier has exceeded rate limit.

        Args:
            identifier: Unique identifier (e.g., IP address)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_limited, remaining_requests, retry_after_seconds)
        """
        async with self._lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=window_seconds)

            # Clean up old requests
            self._requests[identifier] = [
                req_time for req_time in self._requests[identifier]
                if req_time > window_start
            ]

            current_count = len(self._requests[identifier])

            if current_count >= max_requests:
                # Calculate when the oldest request will expire
                oldest_request = min(self._requests[identifier])
                retry_after = int((oldest_request + timedelta(seconds=window_seconds) - now).total_seconds())
                return True, 0, max(retry_after, 1)

            # Add current request
            self._requests[identifier].append(now)
            remaining = max_requests - (current_count + 1)

            return False, remaining, 0

    async def cleanup(self):
        """Clean up old entries (should be called periodically)."""
        async with self._lock:
            cutoff = datetime.now() - timedelta(hours=1)
            for identifier in list(self._requests.keys()):
                self._requests[identifier] = [
                    req_time for req_time in self._requests[identifier]
                    if req_time > cutoff
                ]
                if not self._requests[identifier]:
                    del self._requests[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    # Check for X-Forwarded-For header (when behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct client
    return request.client.host if request.client else "unknown"


async def check_rate_limit(
    request: Request,
    max_requests: int = 10,
    window_seconds: int = 60,
    identifier_prefix: str = ""
):
    """
    Dependency to check rate limit.

    Args:
        request: FastAPI request object
        max_requests: Maximum requests allowed in window
        window_seconds: Time window in seconds
        identifier_prefix: Prefix for identifier (e.g., "login:")

    Raises:
        HTTPException: If rate limit is exceeded
    """
    client_ip = get_client_ip(request)
    identifier = f"{identifier_prefix}{client_ip}"

    is_limited, remaining, retry_after = await rate_limiter.is_rate_limited(
        identifier, max_requests, window_seconds
    )

    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

    # Add rate limit headers to response (will be set in middleware)
    request.state.rate_limit_remaining = remaining
    request.state.rate_limit_limit = max_requests


# Specific rate limiters for different endpoints
async def rate_limit_auth(request: Request):
    """Rate limiter for authentication endpoints (stricter)."""
    await check_rate_limit(request, max_requests=5, window_seconds=60, identifier_prefix="auth:")


async def rate_limit_api(request: Request):
    """Rate limiter for general API endpoints."""
    await check_rate_limit(request, max_requests=100, window_seconds=60, identifier_prefix="api:")
