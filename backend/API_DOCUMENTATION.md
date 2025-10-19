# 🚀 API Documentation

## 📍 Base URL
```
http://localhost:3003
```

---

## 🔐 AUTHENTICATION

### 📝 Register new user
**POST** `/authentication/sign-up`

**What you send:**
```json
{
  "nickname": "john_doe",
  "firstName": "John", 
  "lastName": "Doe",
  "password": "mypassword123"
}
```

**Rules:**
- `nickname`: 1-16 characters, unique (like login)
- `firstName`: 1-16 characters
- `lastName`: 1-16 characters  
- `password`: 8-16 characters

**What you get on success:**
```json
{
  "id": "user-uuid-here",
  "nickname": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-27T10:30:00.000Z"
}
```

**What you get on error:**
```json
{
  "message": "Nickname already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### 🔑 Sign in
**POST** `/authentication/sign-in`

**What you send:**
```json
{
  "nickname": "john_doe",
  "password": "mypassword123"
}
```

**What you get on success:**
```json
{
  "message": "Successfully signed in",
  "user": {
    "id": "user-uuid-here",
    "nickname": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**⚠️ IMPORTANT:** On successful sign-in, cookies are automatically set:
- `access_token` - for accessing protected endpoints
- `refresh_token` - for refreshing tokens

---

### 🚪 Sign out
**POST** `/authentication/sign-out`

**What you send:** Nothing (tokens are taken from cookies)

**What you get:**
```json
{
  "message": "Successfully signed out"
}
```

**What happens:** Cookies with tokens are deleted

---

### 🔄 Refresh tokens
**POST** `/authentication/refresh-tokens`

**What you send:** Nothing (refresh_token is taken from cookies)

**What you get:**
```json
{
  "message": "Tokens refreshed successfully"
}
```

**What happens:** New tokens are set in cookies

---

## 👥 USERS

### 📋 Get list of all users (with pagination)
**GET** `/users/all?page=1&limit=10`

**URL parameters:**
- `page` - page number (default 1)
- `limit` - number of users per page (default 10, max 100)

**What you get:**
```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "nickname": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-27T10:30:00.000Z"
    },
    {
      "id": "user-uuid-2", 
      "nickname": "jane_smith",
      "firstName": "Jane",
      "lastName": "Smith",
      "createdAt": "2025-01-27T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 👤 Get specific user
**GET** `/users/{id}`

**What you send:** User ID in URL

**What you get:**
```json
{
  "id": "user-uuid-here",
  "nickname": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-27T10:30:00.000Z"
}
```

---

### ✏️ Update user profile
**PATCH** `/users/{id}`

**⚠️ PROTECTED:** Requires access_token in cookies (only your own profile)

**What you send:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe Jr.",
  "password": "newpassword123"
}
```

**Rules:**
- You can update any fields separately
- `password` - 8-16 characters
- `firstName`, `lastName` - 1-16 characters
- `nickname` - 1-16 characters, unique

**What you get on success:**
```json
{
  "id": "user-uuid-here",
  "nickname": "john_doe",
  "firstName": "Johnny",
  "lastName": "Doe Jr.",
  "createdAt": "2025-01-27T10:30:00.000Z"
}
```

---

### 🗑️ Delete user
**DELETE** `/users/{id}`

**⚠️ PROTECTED:** Requires access_token in cookies (only your own account)

**What you send:** User ID in URL

**What you get:**
```json
{
  "message": "User deleted successfully"
}
```

---

## 🎯 AZURE SCANNER

### 🏥 Check scanner health
**GET** `/storage/azure-scanner/health`

**What you send:** Nothing

**What you get:**
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

---

### 🚀 Start scanning
**POST** `/storage/azure-scanner/scan`

**What you send:**
```json
{
  "target": "10.0.0.4"
}
```

**Rules:**
- `target` - valid IPv4 address

**What you get on success:**
```json
{
  "message": "Scan started successfully",
  "target": "10.0.0.4",
  "scanId": "scan-uuid-here",
  "status": "running"
}
```

---

### 📋 Get list of available targets
**GET** `/storage/azure-scanner/targets`

**What you send:** Nothing

**What you get:**
```json
{
  "targets": ["10.0.0.4", "10.0.0.5"],
  "warnings": ["Target 10.0.0.5 is offline"]
}
```

---

## 📊 SCAN RESULTS

### 📋 Get list of available scans
**GET** `/storage/available-scans?page=1&limit=10`

**URL parameters:**
- `page` - page number (default 1)
- `limit` - number of scans per page (default 10)

**What you get:**
```json
{
  "scans": [
    {
      "target": "10.0.0.4",
      "date": "2025-08-24T21:51:00.000Z",
      "files": ["nikto.txt", "nuclei.json", "hydra_dvwa.json"]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### 🎯 Get scans by target
**GET** `/storage/scan-data/{target}`

**What you send:** Target IP address in URL

**What you get:**
```json
[
  {
    "target": "10.0.0.4",
    "date": "2025-08-24T21:51:00.000Z",
    "files": ["nikto.txt", "nuclei.json", "hydra_dvwa.json"]
  }
]
```

---

### 📄 Get specific scan result
**GET** `/storage/scan-data/{target}/{date}`

**What you send:** IP address and date in URL

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "nikto": { /* nikto results */ },
  "nuclei": { /* nuclei results */ },
  "hydra": { /* hydra results */ }
}
```

---

## 📊 DETAILED REPORTS

### 🚨 Nikto Report
**GET** `/storage/reports/{target}/{date}/nikto`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "ip": "10.0.0.4",
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "description": "Server discloses version information",
      "severity": "medium"
    }
  ]
}
```

---

### 🔍 Nuclei Report
**GET** `/storage/reports/{target}/{date}/nuclei`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "ip": "10.0.0.4",
  "findings": [
    {
      "id": "CVE-2021-1234",
      "severity": "high",
      "description": "SQL Injection vulnerability"
    }
  ]
}
```

---

### 🔑 Hydra Report (bruteforce)
**GET** `/storage/reports/{target}/{date}/hydra`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "status": "completed",
  "results": [
    {
      "username": "admin",
      "password": "password123"
    }
  ]
}
```

---

### 📁 Gobuster Report (directory search)
**GET** `/storage/reports/{target}/{date}/gobuster`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "directories": ["/admin", "/login", "/config"],
  "error": null
}
```

---

### 🗄️ SQLMap Report
**GET** `/storage/reports/{target}/{date}/sqlmap`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "status": "vulnerable",
  "pathsTested": ["/login.php", "/search.php"]
}
```

---

### 🔐 Credentials Report
**GET** `/storage/reports/{target}/{date}/credentials`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "totalCredentials": 5,
  "credentials": [
    {"username": "admin", "password": "admin123"},
    {"username": "user", "password": "password"}
  ]
}
```

---

### 📝 Wordlist Report
**GET** `/storage/reports/{target}/{date}/wordlist`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "date": "2025-08-24T21:51:00.000Z",
  "totalWords": 1000,
  "words": ["admin", "login", "password", "user"]
}
```

---

### 📊 Summary Report
**GET** `/storage/reports/{target}/{date}/summary`

**What you get:**
```json
{
  "target": "10.0.0.4",
  "ip": "10.0.0.4",
  "scanDate": "2025-01-27T10:30:00.000Z",
  "summary": {
    "totalVulnerabilities": 15,
    "openPorts": 3,
    "criticalFindings": 2,
    "highFindings": 5,
    "mediumFindings": 6,
    "lowFindings": 2
  },
  "additionalData": {
    "credentials": {
      "total": 5,
      "list": [/* credentials list */]
    },
    "wordlist": {
      "total": 1000,
      "list": [/* words list */]
    }
  }
}
```

---

## 🚨 ERROR CODES

### 200 - OK
Request completed successfully

### 201 - Created
Resource created successfully (registration)

### 400 - Bad Request
Wrong data in request (validation failed)

### 401 - Unauthorized
Not authorized (no token or token expired)

### 403 - Forbidden
Access denied (attempt to change someone else's profile)

### 404 - Not Found
Resource not found

### 409 - Conflict
Conflict (e.g., nickname already exists)

### 500 - Internal Server Error
Server error

---

## 🔧 USAGE EXAMPLES

### JavaScript/TypeScript with fetch:

```javascript
// Registration
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:3003/authentication/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
    credentials: 'include' // ⚠️ IMPORTANT for cookies!
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Registration failed');
  }
};

// Sign in
const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:3003/authentication/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'include' // ⚠️ IMPORTANT for cookies!
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Login failed');
  }
};

// Get users (public)
const getUsers = async (page = 1, limit = 10) => {
  const response = await fetch(
    `http://localhost:3003/users/all?page=${page}&limit=${limit}`
  );
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to get users');
  }
};

// Update profile (protected)
const updateProfile = async (userId, updateData) => {
  const response = await fetch(`http://localhost:3003/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
    credentials: 'include' // ⚠️ IMPORTANT for cookies!
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to update profile');
  }
};
```

### PowerShell for testing:

```powershell
# Registration
Invoke-RestMethod -Uri "http://localhost:3003/authentication/sign-up" -Method POST -ContentType "application/json" -Body '{"nickname": "test_user", "firstName": "Test", "lastName": "User", "password": "testpass123"}'

# Sign in
Invoke-RestMethod -Uri "http://localhost:3003/authentication/sign-in" -Method POST -ContentType "application/json" -Body '{"nickname": "test_user", "password": "testpass123"}'

# Get users
Invoke-RestMethod -Uri "http://localhost:3003/users/all?page=1&limit=10" -Method GET

# Start scanning
Invoke-RestMethod -Uri "http://localhost:3003/storage/azure-scanner/scan" -Method POST -ContentType "application/json" -Body '{"target": "10.0.0.4"}'
```

---

## TIPS

1. **Always add `credentials: 'include'`** in fetch requests - without this cookies don't work
2. **Check response status** before parsing JSON
3. **Handle errors** - user should understand what went wrong
4. **Use try-catch** for handling network errors
5. **Check browser console** - all errors are logged there
6. **Test API** through PowerShell or Insomnia (import Insomnia examples from examples folder) before writing frontend

