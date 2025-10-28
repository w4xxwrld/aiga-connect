## 1. Twilio SMS OTP Authentication (Priority: HIGH)
**Current Status:** Config exists but endpoints NOT implemented (TODO comment in code)

### Backend Tasks

**[BE-AUTH-001] Implement POST /api/auth/send-otp endpoint**
- Validate phone number (E.164 format)
- Call Twilio Verify API to send SMS code
- Handle Twilio errors
- Add rate limiting (max 3 requests per 10 min)
- **Estimate:** 3 hours
- **Files:** `backend/app/users/router.py`, create `backend/app/users/twilio_service.py`

**[BE-AUTH-002] Implement POST /api/auth/verify-otp endpoint**
- Verify OTP code via Twilio
- Check if user exists, create if not
- Generate JWT token
- Handle role selection for new users
- **Estimate:** 3 hours
- **Files:** `backend/app/users/router.py`, `backend/app/users/crud.py`

**[BE-AUTH-003] Implement POST /api/auth/select-role endpoint**
- Validate user doesn't already have role
- Update user primary_role (athlete/coach)
- Return updated user data
- **Estimate:** 1 hour
- **Files:** `backend/app/users/router.py`, `backend/app/users/crud.py`

**[BE-AUTH-004] Add rate limiting middleware for OTP endpoints**
- Track OTP requests per phone number
- Store in Redis or database
- Return 429 error when limit exceeded
- **Estimate:** 2 hours
- **Files:** `backend/app/core/rate_limit.py`

### Frontend Tasks

**[FE-AUTH-001] Create phone input screen for OTP authentication**
- Design phone input UI with country code selector
- Validate E.164 format
- "Send Code" button
- Navigate to OTP verification on success
- **Estimate:** 3 hours
- **Files:** Create `app/src/pages/PhoneLoginPage.tsx`, update `app/src/services/auth.ts`

**[FE-AUTH-002] Create OTP verification screen**
- 6-digit code input fields
- Auto-focus and auto-submit
- "Resend code" with countdown timer
- Call verify-otp endpoint
- **Estimate:** 3 hours
- **Files:** Create `app/src/pages/OTPVerificationPage.tsx`

**[FE-AUTH-003] Create role selection screen**
- Two card options: Coach / Athlete
- Icons and descriptions
- Call select-role endpoint
- Navigate to main app
- **Estimate:** 2 hours
- **Files:** Create `app/src/pages/RoleSelectionPage.tsx`

**[FE-AUTH-004] Update navigation flow for new auth**
- Replace old auth flow with OTP flow
- Handle first-time users (role selection)
- Handle returning users (skip role selection)
- **Estimate:** 1 hour
- **Files:** `app/src/navigation/*.tsx`

---

## 2. Payment Integration - Stripe (Priority: HIGH)
**Current Status:** NOT implemented. Booking model has payment fields but no payment processing.

### Backend Tasks

**[BE-PAY-001] Setup Stripe SDK and configuration**
- Install `stripe` Python package
- Add Stripe API keys to `.env` and config
- Create Stripe service module
- **Estimate:** 1 hour
- **Files:** `backend/pyproject.toml`, `backend/app/config.py`, create `backend/app/payments/stripe_service.py`

**[BE-PAY-002] Create payment module structure**
- Create payments module folder
- Create models.py (Payment table)
- Create schemas.py (payment request/response schemas)
- Create router.py
- **Estimate:** 2 hours
- **Files:** Create `backend/app/payments/` directory with files

**[BE-PAY-003] Implement POST /api/payments/create-session endpoint**
- Validate trainingId (class_id) and userId
- Check user is registered for class
- Create Stripe Checkout session
- Return sessionId and payment URL
- **Estimate:** 3 hours
- **Files:** `backend/app/payments/router.py`, `backend/app/payments/crud.py`

**[BE-PAY-004] Implement POST /api/payments/webhook endpoint**
- Verify Stripe webhook signature
- Handle checkout.session.completed event
- Update Booking.is_paid = True
- Create Payment record
- **Estimate:** 3 hours
- **Files:** `backend/app/payments/router.py`

**[BE-PAY-005] Implement GET /api/payments/history endpoint**
- Get all payments for authenticated user
- Include training details
- Support pagination
- **Estimate:** 2 hours
- **Files:** `backend/app/payments/router.py`, `backend/app/payments/crud.py`

**[BE-PAY-006] Add Payment model and migration**
- Create Payment model (id, userId, trainingId, amount, currency, status, stripe_session_id)
- Generate Alembic migration
- Run migration
- **Estimate:** 1.5 hours
- **Files:** `backend/app/payments/models.py`, create migration

**[BE-PAY-007] Update booking endpoints to include payment status**
- Add payment_required field to booking response
- Add payment_url if not paid
- **Estimate:** 1 hour
- **Files:** `backend/app/bookings/router.py`, `backend/app/bookings/schemas.py`

**[BE-PAY-008] Register payments router in main.py**
- Import and include payments router
- Add /payments prefix
- **Estimate:** 0.5 hours
- **Files:** `backend/app/main.py`

### Frontend Tasks

**[FE-PAY-001] Create payment service**
- Create API functions for create-session, webhook, history
- Handle payment URL opening
- **Estimate:** 2 hours
- **Files:** Create `app/src/services/payment.ts`

**[FE-PAY-002] Add "Pay Now" button to booking detail**
- Show "Pay Now" button if booking not paid
- Call create-session endpoint
- Open Stripe Checkout in WebView or browser
- **Estimate:** 2 hours
- **Files:** `app/src/pages/BookingDetailPage.tsx`

**[FE-PAY-003] Handle payment redirect and confirmation**
- Detect when user returns from Stripe
- Refresh booking status
- Show success/failure message
- **Estimate:** 2 hours
- **Files:** `app/src/pages/BookingDetailPage.tsx`, create payment success screen

**[FE-PAY-004] Create payment history screen**
- List all user payments
- Show date, amount, training name, status
- Add filters (paid/pending)
- **Estimate:** 3 hours
- **Files:** Create `app/src/pages/PaymentHistoryPage.tsx`

**[FE-PAY-005] Add payment history navigation**
- Add menu item in profile or bookings
- Navigate to payment history screen
- **Estimate:** 0.5 hours
- **Files:** Update navigation

---

## 3. Profile Avatar Upload (Priority: MEDIUM)
**Current Status:** Profile exists but no avatar upload endpoint

### Backend Tasks

**[BE-PROFILE-001] Implement POST /api/users/upload-avatar endpoint**
- Accept multipart/form-data image file
- Validate file type (JPG, PNG) and size (≤ 5MB)
- Upload to storage (AWS S3 / Cloudinary / Supabase Storage)
- Update User.photo_url in database
- Return new avatar URL
- **Estimate:** 3 hours
- **Files:** `backend/app/users/router.py`, create upload utility

**[BE-PROFILE-002] Setup file storage service**
- Choose storage provider (Supabase Storage recommended)
- Add credentials to .env
- Create upload/delete utility functions
- **Estimate:** 2 hours
- **Files:** Create `backend/app/core/storage.py`, `backend/app/config.py`

### Frontend Tasks

**[FE-PROFILE-001] Add avatar picker to profile edit**
- Add "Change Photo" button
- Open image picker (camera or gallery)
- Show preview before upload
- Call upload-avatar endpoint
- Update profile with new avatar
- **Estimate:** 3 hours
- **Files:** `app/src/pages/EditProfilePage.tsx`

**[FE-PROFILE-002] Display avatar in profile and other screens**
- Show avatar in profile screen
- Show avatar in class participants list
- Show avatar in bookings list
- **Estimate:** 1 hour
- **Files:** Multiple component files

---

## 4. API Path Alignment (Priority: LOW)
**Current Status:** API paths don't match spec (e.g., /classes vs /trainings, /users/me vs /profile)

### Backend Tasks

**[BE-API-001] Add /api/profile alias endpoints (Optional)**
- Create GET /api/profile → forwards to /users/me
- Create PUT /api/profile → forwards to /users/me
- Or update frontend to use /users/me
- **Decision needed:** Keep /users/me or migrate to /profile?
- **Estimate:** 1 hour (if creating aliases)
- **Files:** `backend/app/main.py` or update frontend

**[BE-API-002] Add /api/trainings alias endpoints (Optional)**
- Create /api/trainings/* → forwards to /classes/*
- Or update frontend to consistently use /classes
- **Decision needed:** Keep /classes or migrate to /trainings?
- **Estimate:** 1 hour (if creating aliases)
- **Files:** `backend/app/main.py` or update frontend

### UI/UX Polish

**[FE-UI-001] Add loading states across all screens**
- Add skeleton loaders
- Add spinner for API calls
- Handle slow network
- **Estimate:** 2 hours
- **Files:** Multiple component files

**[FE-UI-002] Improve error handling and messages**
- User-friendly error messages
- Toast notifications for success/error
- Retry mechanisms for failed requests
- **Estimate:** 2 hours
- **Files:** `app/src/utils/errorHandler.ts`, multiple screens

**[FE-UI-003] Apply AIGA branding consistently**
- Update colors (dark blue, red, white)
- Update typography
- Add transitions and animations
- **Estimate:** 3 hours
- **Files:** `app/src/config/theme.ts`, style files