# ============================================================
# STAGE 1: Builder 
# ============================================================
FROM python:3.12-slim as builder

ENV POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PATH="$POETRY_HOME/bin:$PATH"

# 
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# poetry installation
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app

# Копировать только зависимости (для кэширования)
COPY backend/pyproject.toml /app/

# Установить зависимости (без lock file)
RUN /opt/poetry/bin/poetry install --only main --no-cache --no-root


# ============================================================
# STAGE 2: Runtime
# ============================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/lib/libpython3.12.so* /usr/local/lib/

# copy application code
COPY backend /app

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]