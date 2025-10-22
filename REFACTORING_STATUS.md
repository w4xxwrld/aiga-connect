# AIGA Connect Codebase Refactoring Status

## Overview
This document tracks the progress of refactoring the AIGA Connect codebase to align with the new technical specifications.

---

## ✅ COMPLETED

### Backend - Models
- ✅ **User model** (`backend/app/users/models.py`)
  - Removed: `iin`, `full_name`, `is_head_coach`, `UserRoleAssignment` model
  - Added: `phone` (primary identifier), `first_name`, `last_name`, `photo_url`
  - Made optional: `email`, `hashed_password`

- ✅ **Classes model** (`backend/app/classes/models.py`)
  - Updated `DifficultyLevel`: beginner/amateur/professional
  - Changed `day_of_week` → `days_of_week` (JSON array for multi-day)
  - Removed: `age_group_min/max`, `is_trial_available`, `status`, `ClassStatus` enum
  - Renamed: `price_per_class` → `price`

- ✅ **Bookings model** (`backend/app/bookings/models.py`)
  - Removed `BookingType` enum and `booking_type` field
  - Simplified to regular bookings only

- ✅ **Attendance model** (`backend/app/attendance/models.py`)
  - NEW: Created QR attendance tracking model

### Backend - Business Logic
- ✅ **Users CRUD** (`backend/app/users/crud.py`) - **COMPLETELY REWRITTEN**
  - All functions updated for phone-based auth
  - Removed all IIN, email, role assignment functions
  - Clean, simple functions aligned with new model

- ✅ **Users Router** (`backend/app/users/router.py`) - **COMPLETELY REWRITTEN**
  - Phone-based registration and login
  - Simplified endpoints (no head coach, role assignments)
  - TODO comments for Twilio SMS implementation

- ✅ **Dependencies** (`backend/app/deps.py`) - **COMPLETELY REWRITTEN**
  - Updated authentication to use phone instead of IIN
  - Added role-based dependency helpers
  - Clean WebSocket auth

- ✅ **Classes Schemas** (`backend/app/classes/schemas.py`) - **COMPLETELY REWRITTEN**
  - Updated for new model structure
  - Multi-day validation
  - Updated participant output schema

### Backend - Infrastructure
- ✅ **Main app** (`backend/app/main.py`)
  - Removed merchandise and feedback routers

- ✅ **Models registry** (`backend/app/models.py`)
  - Updated to import only active models

- ✅ **API v1 router** (`backend/app/api/v1.py`)
  - Removed deleted module routers

- ✅ **.env.example**
  - Added Twilio configuration

- ✅ **README.md**
  - Updated features list
  - Added phone-based auth documentation
  - Updated project structure

### Backend - Deletions
- ✅ Deleted `backend/app/merchandise/` module
- ✅ Deleted `backend/app/feedback/` module
- ✅ Deleted `backend/seed_merchandise.py`

### Frontend
- ✅ Deleted merchandise pages (StorePage, ProductDetailPage)
- ✅ Deleted feedback pages (CoachRatingPage, feedback service)
- ✅ Updated navigation (AppNavigator.tsx)
- ✅ Cleaned up HomePage (removed Quick Actions)

---

## ⚠️ PARTIALLY COMPLETED (Needs Finishing)

### Backend - Classes Module
- ⚠️ **Classes CRUD** (`backend/app/classes/crud.py`)
  - STATUS: NOT UPDATED - still references old model fields
  - NEEDS: Complete rewrite to match new model structure

- ⚠️ **Classes Router** (`backend/app/classes/router.py`)
  - STATUS: NOT UPDATED - still uses old schema/CRUD
  - NEEDS: Update to use new schemas and CRUD functions

### Backend - Bookings Module
- ⚠️ **Bookings Schemas** (`backend/app/bookings/schemas.py`)
  - STATUS: NOT UPDATED - references `booking_type`, old user fields
  - NEEDS: Remove booking_type, update user field references

- ⚠️ **Bookings CRUD** (`backend/app/bookings/crud.py`)
  - STATUS: NOT UPDATED - uses old model fields
  - NEEDS: Update for simplified booking model

- ⚠️ **Bookings Router** (`backend/app/bookings/router.py`)
  - STATUS: NOT UPDATED - references old schemas/CRUD
  - NEEDS: Update to use new schemas

---

## ❌ NOT STARTED

### Backend
- ❌ **Common schemas** (`backend/app/common/schemas.py`)
  - NEEDS: Review and update for any user/class references

- ❌ **Database Migration**
  - NEEDS: Create Alembic migration for all model changes
  - Critical tables to modify: users, classes, bookings
  - Tables to drop: feedback, merchandise tables, user_role_assignments

- ❌ **Tournaments Module**
  - STATUS: Unknown if exists in backend
  - Frontend has tournament pages - backend needs matching endpoints

- ❌ **Attendance Router/CRUD**
  - NEW: Need to create router and CRUD for QR attendance
  - Model exists, but no endpoints yet

### Frontend
- ❌ **AuthScreen.tsx**
  - NEEDS: Update from IIN to phone-based auth
  - Implement SMS OTP flow

- ❌ **Auth Service** (`app/src/services/auth.ts`)
  - NEEDS: Update API calls for phone-based auth
  - Update user data structure

- ❌ **User Interface Components**
  - NEEDS: Update all forms/displays using full_name → first_name/last_name
  - Update profile pages

- ❌ **Classes Components**
  - NEEDS: Update for multi-day display
  - Update difficulty levels (intermediate→amateur, advanced→professional)

---

## 🔴 CRITICAL ISSUES

### Broken Code That Will Cause Errors
1. **Classes CRUD/Router** - References deleted model fields (`age_group_min`, `is_trial_available`, etc.)
2. **Bookings CRUD/Router** - References deleted `booking_type` field
3. **Frontend Auth** - Still sends IIN instead of phone
4. **Frontend User Display** - References `full_name` which doesn't exist

### Missing Functionality
1. **Twilio SMS Integration** - Schemas exist, but no implementation
2. **QR Attendance System** - Model exists, but no router/CRUD/frontend
3. **Tournaments Backend** - Frontend exists, backend unknown
4. **Database Migration** - Schema changes not applied to database

---

## 📋 RECOMMENDED NEXT STEPS

### Immediate (Required for App to Work)
1. ✅ Update **classes/crud.py** for new model
2. ✅ Update **classes/router.py** for new schemas
3. ✅ Update **bookings/schemas.py** to remove booking_type
4. ✅ Update **bookings/crud.py** for simplified model
5. ✅ Update **bookings/router.py** for new schemas
6. ✅ Create **database migration** for all changes
7. ✅ Test that basic API endpoints work

### Short-term (Complete Core Refactor)
8. ⚠️ Implement **QR attendance router and CRUD**
9. ⚠️ Update **frontend authentication** for phone/SMS
10. ⚠️ Update **frontend user components** for new field names
11. ⚠️ Review and fix **common/schemas.py**

### Medium-term (New Features)
12. 🔄 Implement **Twilio SMS verification**
13. 🔄 Implement **QR attendance frontend**
14. 🔄 Verify **tournaments backend** exists or create it
15. 🔄 Update **classes frontend** for multi-day display

---

## 🚨 KNOWN BREAKING CHANGES

### API Breaking Changes
- `/users/register` - Now requires `phone`, `first_name`, `last_name` instead of `iin`, `full_name`
- `/users/login` - Now uses `phone` instead of `iin`
- `/classes/*` - days_of_week is now array, price_per_class → price
- `/bookings/*` - booking_type removed

### Database Schema Changes
- `users.iin` → `users.phone`
- `users.full_name` → `users.first_name` + `users.last_name`
- `classes.day_of_week` → `classes.days_of_week` (JSON)
- `classes.price_per_class` → `classes.price`
- Dropped tables: `feedback`, `products`, `product_variants`, `product_collections`, `user_role_assignments`

---

## 💡 ARCHITECTURE IMPROVEMENTS MADE

1. **Simplified User Model** - Removed complex role assignment system
2. **Phone-Based Auth** - Modern, mobile-first authentication
3. **Cleaner Dependencies** - Role-based access helpers
4. **Better Separation** - Clear CRUD/Router boundaries
5. **Removed Dead Code** - Deleted unused modules entirely

---

## ⏭️ WHAT TO DO NOW

### Option 1: Continue Automated Refactoring
Let me continue and finish updating:
- Classes CRUD/Router
- Bookings Schemas/CRUD/Router
- Create migration
- Fix remaining issues

### Option 2: Manual Review
- Review what's been done
- Manually fix remaining modules
- Test as you go

### Option 3: Staged Approach
- Get basic API working first (finish classes/bookings)
- Then tackle frontend
- Then add new features (QR, Twilio)

**Recommend: Option 1 - Let me finish the backend refactoring completely, then you can handle frontend and new features.**
