# Security Implementation Guide

## 🔐 Overview

This document provides comprehensive security guidelines for the User Management API.

## 🚨 Critical Security Requirements

### 1. Environment Variables
**NEVER commit these to version control:**
```env
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-min-32-chars
SESSION_SECRET=averylogphrasebiggerthanthirtytwochars
SESSION_SALT=sa1tySa1t1234567
```

**Requirements:**
- JWT secrets: Minimum 32 characters
- Session secrets: Minimum 32 characters
- Use cryptographically secure random generators
- Different secrets for different environments

### 2. Password Security
```typescript
// Current PBKDF2 Configuration
PASSWORD_ITERATIONS=10000      // Minimum 10,000
PASSWORD_KEY_LENGTH=32        // 256-bit key
PASSWORD_DIGEST=sha256        // SHA-256 algorithm
SALT_RANDOM_BYTES=16         // 128-bit salt
```

**Why PBKDF2 over bcrypt?**
- Industry standard (NIST approved)
- Configurable iteration count
- Better for high-security applications
- Consistent performance across platforms

### 3. JWT Token Security
```typescript
JWT_ACCESS_TOKEN_TTL=900      // 15 minutes
JWT_REFRESH_TOKEN_TTL=604800  // 7 days
JWT_TOKEN_AUDIENCE=foxminded  // Specific audience
JWT_TOKEN_ISSUER=foxminded    // Specific issuer
```

**Security Benefits:**
- Short-lived access tokens limit exposure
- Refresh token rotation prevents replay attacks

## 🛡️ Security Layers

### Layer 1: Input Validation
```typescript
// DTO Validation with class-validator
export class UserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  nickname!: string;

  @IsString()
  @MinLength(8)  // Minimum password length
  @MaxLength(16)
  password!: string;
}
```

### Layer 2: Authentication
```typescript
// JWT Guard for protected routes
@UseGuards(JwtGuard)
export class ProtectedController {
  // Routes require valid JWT token
}

// Basic Auth for sensitive operations
@UseGuards(BasicAuthGuard)
export class UserController {
  // Routes require username/password
}
```

### Layer 3: Authorization
```typescript
// User can only modify their own data
if (user.sub !== id) {
  throw new ForbiddenException('You can only update your own account');
}
```

## 🔒 Frontend Security Guidelines

### 1. Cookie Management
```typescript
// ✅ CORRECT: Let server manage cookies
const response = await fetch('/auth/sign-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials),
  credentials: 'include', // Important!
});

// ❌ WRONG: Don't manually set cookies
document.cookie = 'token=...'; // Never do this
```

### 2. Credential Storage
```typescript
// ✅ CORRECT: Store minimal user info
const userInfo = {
  id: 'user-id',
  nickname: 'john_doe',
  firstName: 'John',
  lastName: 'Doe'
};

// ❌ WRONG: Never store sensitive data
localStorage.setItem('password', 'user-password'); // Never!
sessionStorage.setItem('jwt-token', 'token'); // Never!
```

### 3. API Error Handling
```typescript
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    
    // Don't expose internal errors to users
    switch (response.status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Show generic forbidden message
        alert('Access denied');
        break;
      default:
        // Show generic error
        alert('An error occurred. Please try again.');
    }
  }
};
```

### 4. Token Refresh Strategy
```typescript
// Automatic token refresh every 10 minutes
const setupTokenRefresh = () => {
  setInterval(async () => {
    try {
      await refreshTokens();
    } catch (error) {
      // Redirect to login on refresh failure
      window.location.href = '/login';
    }
  }, 10 * 60 * 1000); // 10 minutes
};
```

## 📚 Security Resources

### Documentation
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

### Tools
- [Class Validator](https://github.com/typestack/class-validator) - Input validation

---

**Remember:** Security is an ongoing process. Regularly review and update your security measures.
