# Admin Features Documentation

This document describes all admin features implemented in the AIGA Connect platform.

## Table of Contents
1. [Admin Role Creation](#admin-role-creation)
2. [Admin Account Management](#admin-account-management)
3. [Enhanced User Management](#enhanced-user-management)
4. [Enhanced Coach Management](#enhanced-coach-management)
5. [API Endpoint Reference](#api-endpoint-reference)

---

## Admin Role Creation

The admin role already exists in the system (`UserRole.admin`), but previously there was no way to create admin users through the API.

### Creating the First Admin

**Endpoint:** `POST /api/users/admin/create-first-admin`

**Purpose:** Create the first admin user in the system using a secret key.

**Requirements:**
1. Add `ADMIN_SECRET_KEY` to your `.env` file
2. This endpoint can only be used once (when no admins exist)

**Request Body:**
```json
{
  "phone_number": "+1234567890",
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "birth_date": "1990-01-01",
  "admin_secret_key": "YOUR_SECRET_KEY_FROM_ENV"
}
```

**Response:**
```json
{
  "success": true,
  "message": "First admin user created successfully",
  "user": {
    "id": 1,
    "phone": "+1234567890",
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "birth_date": "1990-01-01",
    "primary_role": "admin",
    "created_at": "2025-01-19T12:00:00Z"
  }
}
```

---

## Admin Account Management

### Promote User to Admin

**Endpoint:** `POST /api/users/admin/promote-user`

**Authorization:** Admin only

**Purpose:** Promote an existing user (athlete or coach) to admin role.

**Request Body:**
```json
{
  "user_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "User John Doe promoted to admin successfully",
  "user": {
    "id": 123,
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "admin",
    "role_status": null
  }
}
```

### Demote Admin

**Endpoint:** `POST /api/users/admin/demote-admin`

**Authorization:** Admin only

**Purpose:** Demote an admin back to athlete or coach role.

**Request Body:**
```json
{
  "user_id": 123,
  "new_role": "coach"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin John Doe demoted to coach successfully",
  "user": {
    "id": 123,
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "coach",
    "role_status": "approved"
  }
}
```

**Notes:**
- Admins cannot demote themselves
- Demoted coaches are automatically set to "approved" status

---

## Enhanced User Management

### List All Users

**Endpoint:** `GET /api/users/admin/users`

**Authorization:** Admin only

**Purpose:** List all users with advanced filtering and pagination.

**Query Parameters:**
- `role` (optional): Filter by role (`athlete`, `coach`, `admin`)
- `role_status` (optional): Filter by role status (`pending`, `approved`, `declined`)
- `search` (optional): Search by name, phone, or email
- `include_deleted` (optional): Include soft-deleted users (default: `false`)
- `skip` (optional): Number of records to skip for pagination (default: `0`)
- `limit` (optional): Maximum records to return, max 500 (default: `100`)

**Example Request:**
```
GET /api/users/admin/users?role=coach&role_status=pending&search=john&skip=0&limit=20
```

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "phone": "+1234567890",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "primary_role": "coach",
      "role_status": "pending",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 20
}
```

### Get User Details

**Endpoint:** `GET /api/users/admin/users/{user_id}`

**Authorization:** Admin only

**Purpose:** Get detailed information about a specific user.

**Response:**
```json
{
  "id": 123,
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "birth_date": "1995-05-15",
  "photo_url": "https://...",
  "primary_role": "coach",
  "role_status": "approved",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Update User Profile

**Endpoint:** `PUT /api/users/admin/users/{user_id}`

**Authorization:** Admin only

**Purpose:** Update any user's profile information.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "birth_date": "1995-05-15",
  "photo_url": "https://..."
}
```

**Note:** All fields are optional.

### Soft Delete User

**Endpoint:** `DELETE /api/users/admin/users/{user_id}`

**Authorization:** Admin only

**Purpose:** Soft delete a user account (preserves data, marks as deleted).

**Response:**
```json
{
  "success": true,
  "message": "User John Doe deleted successfully",
  "user": null
}
```

**Notes:**
- Admins cannot delete themselves
- User data is preserved but marked as deleted
- Soft-deleted users can be restored

### Restore User

**Endpoint:** `POST /api/users/admin/users/{user_id}/restore`

**Authorization:** Admin only

**Purpose:** Restore a soft-deleted user account.

**Response:**
```json
{
  "success": true,
  "message": "User John Doe restored successfully",
  "user": {
    "id": 123,
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "athlete",
    "deleted_at": null
  }
}
```

### Change User Role

**Endpoint:** `PUT /api/users/admin/users/{user_id}/role`

**Authorization:** Admin only

**Purpose:** Change a user's role (athlete, coach, or admin).

**Request Body:**
```json
{
  "new_role": "coach"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role changed from athlete to coach successfully",
  "user": {
    "id": 123,
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "coach",
    "role_status": "approved"
  }
}
```

**Notes:**
- Admins cannot change their own role
- Users changed to coach role are automatically set to "approved" status

---

## Enhanced Coach Management

### List All Coaches (Admin)

**Endpoint:** `GET /api/users/admin/coaches`

**Authorization:** Admin only

**Purpose:** List all coaches with advanced filtering.

**Query Parameters:**
- `role_status` (optional): Filter by approval status (`pending`, `approved`, `declined`)
- `search` (optional): Search by name or phone
- `include_deleted` (optional): Include suspended coaches (default: `false`)
- `skip` (optional): Pagination offset (default: `0`)
- `limit` (optional): Maximum records, max 500 (default: `100`)

**Example Request:**
```
GET /api/users/admin/coaches?role_status=approved&skip=0&limit=50
```

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "phone": "+1234567890",
      "first_name": "Coach",
      "last_name": "Name",
      "primary_role": "coach",
      "role_status": "approved",
      "created_at": "2025-01-10T08:00:00Z"
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 50
}
```

### Suspend Coach

**Endpoint:** `POST /api/users/admin/coaches/{coach_id}/suspend`

**Authorization:** Admin only

**Purpose:** Temporarily suspend a coach account.

**Response:**
```json
{
  "success": true,
  "message": "Coach John Doe suspended successfully",
  "user": null
}
```

**Notes:**
- Suspended coaches cannot access the system
- Implemented via soft delete
- Can be reactivated by admins

### Reactivate Coach

**Endpoint:** `POST /api/users/admin/coaches/{coach_id}/reactivate`

**Authorization:** Admin only

**Purpose:** Reactivate a suspended coach account.

**Response:**
```json
{
  "success": true,
  "message": "Coach John Doe reactivated successfully",
  "user": {
    "id": 123,
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "coach",
    "role_status": "approved"
  }
}
```

### Get Coach Statistics

**Endpoint:** `GET /api/users/admin/coaches/{coach_id}/stats`

**Authorization:** Admin only

**Purpose:** Get performance statistics for a specific coach.

**Response:**
```json
{
  "coach_id": 123,
  "coach_name": "John Doe",
  "total_classes": 45,
  "active_classes": 12,
  "total_bookings": 320,
  "total_students": 87,
  "approval_status": "approved"
}
```

**Statistics Explained:**
- `total_classes`: All classes ever created by this coach
- `active_classes`: Currently active (not deleted) classes
- `total_bookings`: Total number of bookings across all their classes
- `total_students`: Unique number of students who have booked their classes
- `approval_status`: Current approval status of the coach

---

## API Endpoint Reference

### Admin Account Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users/admin/create-first-admin` | Create first admin (secret key required) | None |
| POST | `/users/admin/promote-user` | Promote user to admin | Admin |
| POST | `/users/admin/demote-admin` | Demote admin to another role | Admin |

### Enhanced User Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/admin/users` | List all users with filters | Admin |
| GET | `/users/admin/users/{user_id}` | Get user details | Admin |
| PUT | `/users/admin/users/{user_id}` | Update user profile | Admin |
| DELETE | `/users/admin/users/{user_id}` | Soft delete user | Admin |
| POST | `/users/admin/users/{user_id}/restore` | Restore deleted user | Admin |
| PUT | `/users/admin/users/{user_id}/role` | Change user role | Admin |

### Enhanced Coach Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/admin/coaches` | List all coaches with filters | Admin |
| POST | `/users/admin/coaches/{coach_id}/suspend` | Suspend coach account | Admin |
| POST | `/users/admin/coaches/{coach_id}/reactivate` | Reactivate suspended coach | Admin |
| GET | `/users/admin/coaches/{coach_id}/stats` | Get coach performance stats | Admin |

### Existing Coach Approval Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/admin/pending-coaches` | List pending coach applications | Admin |
| POST | `/users/admin/review-coach` | Approve/decline coach application | Admin |

---

## Environment Configuration

Add the following to your `.env` file:

```env
# Admin secret key (for creating the first admin user)
ADMIN_SECRET_KEY=your-secure-random-string-here
```

**Security Note:** Keep the `ADMIN_SECRET_KEY` secret and secure. Only share it with authorized personnel who need to create the initial admin account.

---

## Implementation Details

### Files Modified/Created

1. **backend/app/config.py**
   - Added `ADMIN_SECRET_KEY` configuration

2. **backend/app/users/schemas.py**
   - Added admin account management schemas
   - Added user management schemas
   - Added coach management schemas

3. **backend/app/users/crud.py**
   - Added `get_users_by_role()` - Get users by role
   - Added `get_users_with_filters()` - Advanced user filtering

4. **backend/app/users/service.py**
   - Added admin account management methods
   - Added user management methods
   - Added coach management methods

5. **backend/app/users/router.py**
   - Added 13 new admin endpoints
   - Organized into logical sections with comments

6. **backend/.env.example**
   - Added `ADMIN_SECRET_KEY` example

---

## Future Enhancement Ideas

The following phases could be implemented to extend admin capabilities:

### Phase 4: Class Management Admin Endpoints
- View all classes across all coaches
- Cancel/delete any class
- Edit class details
- View class statistics

### Phase 5: Booking Management Admin Endpoints
- View all bookings with filters
- Cancel any booking
- View booking statistics and revenue metrics
- Handle refunds

### Phase 6: System Dashboard & Analytics
- Overall platform statistics
- Recent activity logs
- User growth metrics
- Revenue analytics
- System health monitoring

### Phase 7: Frontend Admin Dashboard
- React/TypeScript admin dashboard pages
- Admin navigation and sidebar
- User management UI
- Coach management UI
- Statistics visualization

---

## Testing the Admin Features

### 1. Create First Admin
```bash
curl -X POST "http://localhost:8000/api/users/admin/create-first-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567890",
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "birth_date": "1990-01-01",
    "admin_secret_key": "YOUR_SECRET_KEY"
  }'
```

### 2. Login as Admin
```bash
curl -X POST "http://localhost:8000/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567890",
    "password": "SecurePassword123!"
  }'
```

### 3. Use Admin Endpoints
```bash
# List all users
curl -X GET "http://localhost:8000/api/users/admin/users?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get coach statistics
curl -X GET "http://localhost:8000/api/users/admin/coaches/123/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Security Considerations

1. **Admin Secret Key**
   - Store securely in environment variables
   - Never commit to version control
   - Rotate periodically

2. **Authorization Checks**
   - All admin endpoints verify user role
   - Prevent self-modification (demote, delete, role change)
   - Detailed error messages for debugging

3. **Soft Delete**
   - Data is preserved for audit purposes
   - Can be restored if deleted by mistake
   - Includes timestamp for compliance

4. **Input Validation**
   - All inputs validated using Pydantic schemas
   - Phone numbers validated in E.164 format
   - Enum values validated

---

## Support

For questions or issues related to admin features, please:
1. Check this documentation
2. Review the code comments in the implementation files
3. Contact the development team

---

*Generated: 2025-01-19*
*Version: 1.0*
