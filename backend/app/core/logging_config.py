"""
Structured logging configuration using structlog.

This module provides production-ready logging with:
- JSON output for log aggregation systems
- Request ID tracking for distributed tracing
- PII masking for GDPR compliance
- Performance timing
- Context injection
"""

import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, Processor

from app.config import settings


def mask_sensitive_data(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """
    Mask sensitive data in logs (PII protection for GDPR compliance).

    Args:
        logger: The logger instance
        method_name: The method name being called
        event_dict: The event dictionary containing log data

    Returns:
        Modified event dict with masked sensitive data
    """
    # Fields that should be completely masked
    sensitive_fields = {"password", "token", "secret", "api_key", "authorization"}

    # Fields that should be partially masked (show first/last chars)
    partial_mask_fields = {"phone_number", "email"}

    for key, value in list(event_dict.items()):
        if isinstance(value, str):
            # Complete masking for sensitive fields
            if key.lower() in sensitive_fields:
                event_dict[key] = "***REDACTED***"

            # Partial masking for PII fields
            elif key.lower() in partial_mask_fields:
                if len(value) > 4:
                    event_dict[key] = f"{value[:2]}***{value[-2:]}"
                else:
                    event_dict[key] = "***"

    return event_dict


def add_request_id(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """
    Add request ID to log context if available.

    Args:
        logger: The logger instance
        method_name: The method name being called
        event_dict: The event dictionary

    Returns:
        Modified event dict with request_id if available
    """
    # Request ID will be bound to the logger context by middleware
    # This processor ensures it's always present
    if "request_id" not in event_dict:
        event_dict["request_id"] = "no-request-id"

    return event_dict


def add_log_level_name(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """
    Add human-readable log level name.

    Args:
        logger: The logger instance
        method_name: The method name being called
        event_dict: The event dictionary

    Returns:
        Modified event dict with level name
    """
    if "level" in event_dict:
        event_dict["level"] = event_dict["level"].upper()

    return event_dict


def configure_logging() -> None:
    """
    Configure structured logging for the application.

    In development: Human-readable console output
    In production: JSON output for log aggregation systems (ELK, CloudWatch, etc.)
    """
    # Determine if we're in production
    is_production = settings.ENVIRONMENT == "production"

    # Configure log level
    log_level = logging.INFO if is_production else logging.DEBUG

    # Define processors based on environment
    shared_processors: list[Processor] = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        add_request_id,
        add_log_level_name,
        mask_sensitive_data,
    ]

    if is_production:
        # JSON output for production (log aggregation systems)
        renderer = structlog.processors.JSONRenderer()
    else:
        # Human-readable colored output for development
        renderer = structlog.dev.ConsoleRenderer(
            colors=True,
            exception_formatter=structlog.dev.plain_traceback,
        )

    # Configure structlog
    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Set log levels for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("twilio").setLevel(logging.INFO)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a configured logger instance.

    Args:
        name: The logger name (usually __name__)

    Returns:
        Configured structlog logger

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("user_registered", user_id=123, email="user@example.com")
    """
    return structlog.get_logger(name)
