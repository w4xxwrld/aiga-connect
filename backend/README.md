# AIGA Connect Backend

FastAPI-based backend for AIGA Connect - a comprehensive management system for a grappling club.

## Features

- **User Management**: Athletes and coaches with phone-based authentication
- **Training Classes**: Create and manage trainings with multi-day scheduling and difficulty levels (beginner/amateur/professional)
- **Booking System**: Training enrollment with approval workflow
- **Individual Training**: Request and schedule individual training sessions
- **QR Attendance**: QR code-based attendance tracking system for athletes
- **Tournaments**: Create and manage tournament events

## Tech Stack

- **Framework**: FastAPI 0.116+
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Authentication**: JWT tokens with phone-based SMS verification (Twilio)
- **Migrations**: Alembic
- **Security**: Bcrypt password hashing, rate limiting
- **Python**: 3.12+

## Project Structure

```
backend/
├── app/
│   ├── api/               # API versioning
│   │   └── v1.py          # API v1 router
│   ├── core/              # Core functionality
│   │   ├── exceptions.py  # Custom exception classes
│   │   ├── middleware.py  # Error handling & logging middleware
│   │   ├── permissions.py # Role-based access control decorators
│   │   ├── rate_limit.py  # Rate limiting implementation
│   │   ├── security.py    # JWT & password hashing
│   │   └── utils.py       # Utility functions
│   ├── users/             # User management module
│   ├── classes/           # Training classes module
│   ├── bookings/          # Booking system module
│   ├── attendance/        # QR attendance tracking module
│   ├── config.py          # Application configuration
│   ├── database.py        # Database connection
│   ├── deps.py            # FastAPI dependencies
│   ├── main.py            # Application entry point
│   └── models.py          # Model imports
├── migrations/            # Alembic migrations
├── tests/                 # Test files
├── .env.example           # Environment variables template
├── pyproject.toml         # Poetry dependencies
└── README.md              # This file
```

## Setup

### Prerequisites

- Python 3.12+
- PostgreSQL database
- Poetry (recommended) or pip

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**

   Using Poetry (recommended):
   ```bash
   poetry install
   poetry shell
   ```

   Using pip:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `DATABASE_URL`: PostgreSQL connection string (async)
   - `ALEMBIC_DATABASE_URL`: PostgreSQL connection string (sync)
   - `SECRET_KEY`: Generate a secure random key (at least 32 characters)
   - `TWILIO_ACCOUNT_SID`: Twilio account SID for SMS verification
   - `TWILIO_AUTH_TOKEN`: Twilio auth token
   - `TWILIO_VERIFY_SERVICE_SID`: Twilio Verify service SID
   - `CORS_ORIGINS`: Comma-separated list of allowed origins

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `DATABASE_URL` | Async PostgreSQL connection URL | Required |
| `ALEMBIC_DATABASE_URL` | Sync PostgreSQL connection URL | Required |
| `DATABASE_ECHO` | Log SQL queries | `False` |
| `SECRET_KEY` | JWT signing key (min 32 chars) | Required |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Required |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | Required |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service SID | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:8081` |

## Authentication

The API uses phone-based SMS verification with JWT tokens:

1. **Send SMS Code**: `POST /users/send-sms` with phone number → Sends verification code via Twilio
2. **Verify Code**: `POST /users/verify-sms` with phone and code → Creates user and returns JWT tokens
3. **Login**: `POST /users/login` with phone → Returns access & refresh tokens
4. **Refresh**: `POST /users/refresh` → Returns new access & refresh tokens
5. **Use**: Include `Authorization: Bearer <access_token>` in headers

### Rate Limiting

Authentication endpoints are rate-limited to prevent brute-force attacks:
- **Auth endpoints** (login, register, refresh): 5 requests per minute per IP
- **General API**: 100 requests per minute per IP

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## Development

### Code Style

- Follow PEP 8 guidelines
- Use type hints
- Write docstrings for public functions and classes

### Project Conventions

1. **Models**: Each module has its own `models.py`
2. **Schemas**: Pydantic models for request/response validation
3. **CRUD**: Database operations separated in `crud.py`
4. **Routers**: API endpoints in `router.py`

### Adding a New Module

1. Create directory under `app/`
2. Add `models.py` (SQLAlchemy models)
3. Add `schemas.py` (Pydantic schemas)
4. Add `crud.py` (database operations)
5. Add `router.py` (API endpoints)
6. Import router in `app/main.py`
7. Import models in `app/models.py`

## Testing

```bash
# Install test dependencies
poetry install --with dev

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Performance Optimizations

- **Connection Pooling**: Configured with pool size of 10, max overflow of 20
- **Database Indexes**: Added on frequently queried columns
- **Eager Loading**: Relationships loaded with `selectinload` to avoid N+1 queries
- **Rate Limiting**: In-memory rate limiter (consider Redis for production scale)

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting on authentication endpoints
- ✅ CORS protection
- ✅ Environment variable validation
- ✅ Timezone-aware datetime handling
- ✅ Centralized error handling

## Production Deployment

### Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DATABASE_ECHO=False`
- [ ] Use strong `SECRET_KEY` (32+ characters)
- [ ] Configure appropriate `CORS_ORIGINS`
- [ ] Use managed PostgreSQL database
- [ ] Set up proper logging
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Use Redis for rate limiting (optional but recommended for multi-instance)

### Running with Gunicorn

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify connection string format:
  - Async: `postgresql+asyncpg://user:password@host:5432/database`
  - Sync: `postgresql+psycopg2://user:password@host:5432/database`

### Migration Conflicts

If you encounter migration conflicts (multiple heads):
```bash
alembic merge -m "merge heads" <revision1> <revision2>
alembic upgrade head
```

### Rate Limiting Issues

The in-memory rate limiter is suitable for single-instance deployments. For production with multiple instances, consider:
- Implementing Redis-based rate limiting
- Using external rate limiting (e.g., nginx, API gateway)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Create a pull request

## License

See LICENSE file in the project root.
