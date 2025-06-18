# Authentication System Implementation

## Overview

This document describes the comprehensive authentication system implemented for both web and API interfaces, featuring shared business logic through a dedicated service layer.

## Architecture

### Service Layer
- **AuthService**: Central service containing all authentication business logic
- **Shared Form Requests**: Validation rules consistent across web and API
- **API Resources**: Standardized response formatting

### Features Implemented

1. **User Registration**
   - Web: Inertia.js forms with validation
   - API: JSON endpoints with token generation
   - Email verification support

2. **User Login**  
   - Web: Session-based authentication
   - API: Sanctum token-based authentication
   - Rate limiting and throttling

3. **Password Reset**
   - Web: Email-based reset flow
   - API: Token-based reset via JSON endpoints
   - Secure token validation

4. **Email Verification**
   - Web: Signed URL verification 
   - API: JSON endpoint verification
   - Automatic event dispatching

5. **Password Confirmation**
   - Web: Re-authentication for sensitive actions
   - API: Password confirmation endpoint

## File Structure

```
app/
├── Services/
│   └── AuthService.php              # Core authentication logic
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   │   └── AuthController.php   # API authentication endpoints
│   │   └── Web/Auth/                # Web authentication controllers
│   │       ├── RegisteredUserController.php
│   │       ├── AuthenticatedSessionController.php
│   │       ├── PasswordResetLinkController.php
│   │       ├── NewPasswordController.php
│   │       ├── EmailVerificationNotificationController.php
│   │       ├── VerifyEmailController.php
│   │       └── ConfirmablePasswordController.php
│   ├── Requests/Auth/               # Shared validation requests
│   │   ├── RegisterRequest.php
│   │   ├── LoginRequest.php
│   │   ├── ForgotPasswordRequest.php
│   │   ├── ResetPasswordRequest.php
│   │   └── EmailVerificationRequest.php
│   ├── Resources/Auth/
│   │   └── AuthUserResource.php     # API user response formatting
│   └── Middleware/
│       └── EnsureEmailIsVerified.php # Email verification middleware
```

## API Endpoints

### Public Endpoints
```
POST /api/auth/register               # User registration
POST /api/auth/login                  # User login
POST /api/auth/forgot-password        # Request password reset
POST /api/auth/reset-password         # Reset password with token
GET  /api/auth/verify-email/{id}/{hash} # Verify email address
```

### Protected Endpoints (requires authentication)
```
GET  /api/auth/user                   # Get authenticated user
POST /api/auth/logout                 # Logout (revoke current token)
POST /api/auth/logout-all            # Logout from all devices
POST /api/auth/email/verification-notification # Send verification email
POST /api/auth/confirm-password       # Confirm user password
```

## Web Routes

### Guest Routes
```
GET  /register                        # Registration form
POST /register                        # Process registration
GET  /login                          # Login form
POST /login                          # Process login
GET  /forgot-password                # Forgot password form
POST /forgot-password                # Send reset link
GET  /reset-password/{token}         # Password reset form
POST /reset-password                 # Process password reset
```

### Authenticated Routes
```
GET  /verify-email                   # Email verification notice
GET  /verify-email/{id}/{hash}       # Verify email
POST /email/verification-notification # Resend verification
GET  /confirm-password               # Password confirmation form
POST /confirm-password               # Process password confirmation
POST /logout                         # Logout
```

## Usage Examples

### API Usage

#### Registration
```javascript
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123'
    })
});

const { user, token } = await response.json();
```

#### Login
```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
    })
});

const { user, token } = await response.json();
localStorage.setItem('auth_token', token);
```

#### Authenticated Requests
```javascript
const response = await fetch('/api/auth/user', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Accept': 'application/json',
    }
});
```

### Web Usage (Inertia.js)

#### Navigation
```tsx
import { router } from '@inertiajs/react';

// Login
router.post('/login', {
    email: 'john@example.com',
    password: 'password123'
});

// Registration
router.post('/register', {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    password_confirmation: 'password123'
});

// Logout
router.post('/logout');
```

## Security Features

1. **Rate Limiting**: Login attempts and verification emails are throttled
2. **CSRF Protection**: Web forms protected against CSRF attacks
3. **Signed URLs**: Email verification uses signed URLs
4. **Token Management**: API tokens are properly managed and can be revoked
5. **Password Hashing**: Uses Laravel's secure password hashing
6. **Email Verification**: Optional email verification requirement

## Configuration

### Email Verification
To require email verification, ensure your User model implements `MustVerifyEmail`:

```php
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}
```

### Middleware Setup
Add email verification middleware to protected routes:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // Protected routes that require verified email
});
```

## Testing

Comprehensive test suites are provided:

- `tests/Feature/Auth/AuthServiceTest.php` - Service layer tests
- `tests/Feature/Api/AuthApiTest.php` - API endpoint tests
- Existing Laravel auth tests for web routes

Run tests with:
```bash
php artisan test --filter Auth
```

## Error Handling

The system provides consistent error handling:

- **Validation Errors**: Return structured validation messages
- **Authentication Failures**: Clear error messages for invalid credentials
- **API Responses**: JSON formatted errors with appropriate HTTP status codes
- **Web Responses**: Flash messages and form error display

## Customization

The service-based architecture allows easy customization:

1. **Extend AuthService**: Add custom authentication logic
2. **Custom Form Requests**: Modify validation rules
3. **Event Listeners**: Hook into authentication events
4. **API Resources**: Customize response formatting

## Security Best Practices

1. Use HTTPS in production
2. Implement proper CORS policies
3. Set appropriate session/token expiration times
4. Monitor authentication attempts
5. Implement account lockout policies
6. Use strong password requirements
7. Enable email verification for sensitive applications
