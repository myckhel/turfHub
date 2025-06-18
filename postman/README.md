# TurfMate API - Postman Collection Documentation

## 📋 Overview

This Postman collection provides comprehensive testing capabilities for the TurfMate API, including full authentication flow, user management, turf operations, match sessions, and player interactions.

## 🚀 Quick Start

### 1. Import Collection
Import `TurfMate-API-Collection.json` into Postman.

### 2. Set Environment
Import and select either:
- `TurfMate-Development.postman_environment.json` (for local development)
- `TurfMate-Production.postman_environment.json` (for production testing)

### 3. Run Authentication Flow
Execute the requests in the **Authentication** folder in order:
1. **Register User (API)** - Creates a new user account
2. **Login User (API)** - Authenticates and gets Bearer token
3. Other protected endpoints will now work with the stored token

## 🔐 Authentication System

### Complete Authentication Flow

The collection includes a comprehensive authentication system with the following endpoints:

#### Public Authentication (No token required)
- **Register User** - Create new account with email verification
- **Login User** - Authenticate with email/password, returns Bearer token
- **Forgot Password** - Send password reset email
- **Reset Password** - Reset password using token from email
- **Verify Email** - Verify email address using signed URL from email

#### Protected Authentication (Bearer token required)
- **Get User Profile** - Retrieve authenticated user information
- **Send Email Verification** - Resend verification email
- **Confirm Password** - Verify password for sensitive operations
- **Logout** - Revoke current session token
- **Logout All** - Revoke all user tokens (logout from all devices)

### Token Management

The collection automatically:
- ✅ Stores Bearer tokens from login/registration responses
- ✅ Uses stored tokens for protected endpoint authentication
- ✅ Clears tokens on logout operations
- ✅ Handles token expiration and refresh scenarios

## 📁 Files Structure

```
postman/
├── TurfMate-API-Collection.json              # Basic collection with core endpoints
├── TurfMate-Complete-Collection.json         # Advanced collection with comprehensive testing
├── TurfMate-Development.postman_environment.json    # Development environment
├── TurfMate-Production.postman_environment.json     # Production environment
├── run-tests.sh                             # Automated test runner script
├── reports/                                 # Test reports (generated)
│   ├── basic-suite-report.html
│   ├── complete-suite-results.json
│   └── ...
└── README.md                                # This documentation
```

## 🚀 Quick Start

### 1. Import Collections & Environments

1. **Import Collections:**
   - Open Postman
   - Click "Import" → "Upload Files"
   - Select both JSON collection files

2. **Import Environments:**
   - Import both environment files
   - Select the appropriate environment (Development/Production)

3. **Configure Environment Variables:**
   - Set `base_url` (default: `http://localhost:8000`)
   - Set `auth_token` (if you have one)
   - Configure other variables as needed

### 2. Run Your First Test

1. Ensure your Laravel server is running: `php artisan serve`
2. Select the "TurfMate Development" environment
3. Run the "Authentication" folder to set up test data
4. Explore other endpoints

## 🔧 Environment Configuration

### Development Environment Variables

| Variable      | Description                     | Default Value           | Required |
| ------------- | ------------------------------- | ----------------------- | -------- |
| `base_url`    | API base URL                    | `http://localhost:8000` | ✅        |
| `api_version` | API version                     | `v1`                    | ✅        |
| `auth_token`  | Bearer token for authentication | *(empty)*               | ⚠️        |
| `per_page`    | Default pagination size         | `15`                    | ❌        |
| `filter_role` | Default role filter             | *(empty)*               | ❌        |

### Production Environment Variables

Similar to development but with production URLs and settings.

## 📚 Collection Features

### 🔐 Authentication & Security

- **Bearer Token Authentication**: Automatically applied to protected endpoints
- **Session-based Authentication**: Support for Laravel's session authentication
- **Dynamic Token Management**: Automatic token extraction and storage
- **Security Headers Validation**: Checks for proper security headers

### 🧪 Advanced Testing

- **Comprehensive Test Coverage**: 100+ automated tests
- **Data Validation**: Schema validation for all responses
- **Error Scenario Testing**: Covers 4xx and 5xx error cases
- **Performance Monitoring**: Response time tracking and validation
- **Relationship Testing**: Validates eager loaded relationships

### 🔄 Smart Automation

- **Dynamic Data Generation**: Uses Postman's built-in fake data generators
- **Environment Synchronization**: Automatically stores IDs and data between requests
- **Conditional Logic**: Tests adapt based on available data
- **Cleanup Scripts**: Automatic test data cleanup

### 📊 Monitoring & Reporting

- **Real-time Console Logging**: Detailed execution logs
- **Performance Metrics**: Response time and size monitoring
- **Test Results Export**: JSON and HTML reports
- **Error Tracking**: Detailed error information and stack traces

## 🎯 Test Suites

### 1. Basic Suite (`TurfMate-API-Collection.json`)

**Scope**: Core functionality testing
**Endpoints Covered**:
- ✅ Authentication (Register, Login, Get User)
- ✅ Users CRUD operations
- ✅ Basic error handling
- ✅ Pagination validation

**Run Time**: ~2-3 minutes
**Tests**: 25+ automated tests

### 2. Complete Suite (`TurfMate-Complete-Collection.json`)

**Scope**: Comprehensive testing with advanced scenarios
**Endpoints Covered**:
- ✅ All Basic Suite endpoints
- ✅ Turfs management
- ✅ Match Sessions
- ✅ Teams and Players
- ✅ Nested resource routes
- ✅ Advanced filtering and searching
- ✅ Performance testing
- ✅ Error scenario validation

**Run Time**: ~8-10 minutes
**Tests**: 100+ automated tests

## 🛠️ Command Line Testing

### Prerequisites

```bash
# Install Newman (Postman CLI)
npm install -g newman
npm install -g newman-reporter-htmlextra

# Or using yarn
yarn global add newman newman-reporter-htmlextra
```

### Running Tests

```bash
# Navigate to your project directory
cd /path/to/TurfMate

# Make script executable (first time only)
chmod +x postman/run-tests.sh

# Run all tests
./postman/run-tests.sh

# Run specific test suite
./postman/run-tests.sh basic
./postman/run-tests.sh complete

# Check API health
./postman/run-tests.sh health

# Validate environment
./postman/run-tests.sh validate

# Show help
./postman/run-tests.sh help
```

### Test Reports

After running tests, reports are generated in `postman/reports/`:

- **HTML Report**: Visual test results with charts and details
- **JSON Report**: Machine-readable test results for CI/CD integration

## 📋 API Endpoints Coverage

### 🔐 Authentication
- `POST /api/users` - Register user
- `POST /login` - Web login
- `GET /api/user` - Get authenticated user (Sanctum)

### 👥 Users Management
- `GET /api/users` - List users (with filtering, search, pagination)
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get specific user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### 🏟️ Turfs Management
- `GET /api/turfs` - List turfs (with filtering)
- `POST /api/turfs` - Create turf
- `GET /api/turfs/{id}` - Get specific turf
- `PUT /api/turfs/{id}` - Update turf
- `DELETE /api/turfs/{id}` - Delete turf

### 🏆 Match Sessions
- `GET /api/match-sessions` - List match sessions
- `POST /api/match-sessions` - Create match session
- `GET /api/match-sessions/{id}` - Get specific match session
- `PUT /api/match-sessions/{id}` - Update match session
- `DELETE /api/match-sessions/{id}` - Delete match session

### � Player Flow (NEW)
The complete player experience as specified in the project requirements:

#### **Core Player Journey**
- `GET /api/players/{player}/match-sessions` - **View active/scheduled sessions** 
- `GET /api/players/{player}/match-sessions/{session}/teams` - **View available teams with slots**
- `POST /api/players/{player}/can-join-team` - **Validate join eligibility** (pre-payment check)
- `POST /api/players/{player}/join-team` - **Join team slot & pay online** (core flow)

#### **Team Management**  
- `GET /api/players/{player}/team-status` - **Track team wins/losses/draws**
- `POST /api/players/{player}/leave-team` - **Leave team** (before match starts)

#### **Payment & History**
- `GET /api/players/{player}/payment-history` - **View payment history** (turf-related)

### �👥 Teams & Players
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/players` - List players
- `POST /api/players` - Create player
- `GET /api/team-players` - List team players
- `POST /api/team-players` - Add player to team

### 🎮 Game Management
- `GET /api/game-matches` - List game matches
- `POST /api/game-matches` - Create game match
- `GET /api/match-events` - List match events
- `POST /api/match-events` - Create match event
- `GET /api/queue-logic` - List queue logic
- `POST /api/queue-logic` - Create queue logic

### 🔗 Nested Routes
- `GET /api/turfs/{turf}/players` - Get turf players
- `GET /api/turfs/{turf}/match-sessions` - Get turf match sessions
- `GET /api/match-sessions/{session}/teams` - Get session teams
- `GET /api/users/{user}/turfs` - Get user's turfs
- And many more...

## 🧪 Testing Features

### Automated Test Types

1. **Status Code Validation**
   ```javascript
   pm.test('Status code is 200', function () {
       pm.response.to.have.status(200);
   });
   ```

2. **Response Structure Validation**
   ```javascript
   pm.test('Response has pagination structure', function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData).to.have.property('data');
       pm.expect(jsonData).to.have.property('meta');
       pm.expect(jsonData).to.have.property('links');
   });
   ```

3. **Data Validation**
   ```javascript
   pm.test('User has valid email format', function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.data.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
   });
   ```

4. **Performance Testing**
   ```javascript
   pm.test('Response time is acceptable', function () {
       pm.expect(pm.response.responseTime).to.be.below(2000);
   });
   ```

5. **Security Testing**
   ```javascript
   pm.test('Password not exposed in response', function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.data).to.not.have.property('password');
   });
   ```

### Pre-request Scripts

- **Dynamic Data Generation**: Automatically generates realistic test data
- **Environment Setup**: Configures variables based on previous responses
- **Authentication Management**: Handles token refresh and session management

### Post-request Scripts

- **Data Extraction**: Stores IDs and tokens for subsequent requests
- **Cleanup Operations**: Removes test data after use
- **Validation Logging**: Detailed logging of test results

## 🚨 Error Handling & Testing

### Error Scenarios Covered

1. **404 - Not Found**
   - Non-existent resource IDs
   - Invalid endpoints

2. **422 - Validation Errors**
   - Missing required fields
   - Invalid data formats
   - Business rule violations

3. **401 - Unauthorized**
   - Missing authentication tokens
   - Invalid credentials
   - Expired sessions

4. **403 - Forbidden**
   - Insufficient permissions
   - Resource access restrictions

5. **500 - Server Errors**
   - Database connection issues
   - Application errors

### Error Response Testing

```javascript
pm.test('Validation error has proper structure', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('errors');
    pm.expect(jsonData.errors).to.be.an('object');
});
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install Newman
      run: |
        npm install -g newman
        npm install -g newman-reporter-htmlextra
    
    - name: Start Laravel Server
      run: |
        php artisan serve &
        sleep 5
    
    - name: Run API Tests
      run: ./postman/run-tests.sh basic
    
    - name: Upload Test Reports
      uses: actions/upload-artifact@v2
      with:
        name: test-reports
        path: postman/reports/
```

## 📈 Performance Monitoring

### Response Time Tracking

The collection automatically tracks and validates response times:

- **Fast Endpoints**: < 500ms (GET requests)
- **Medium Endpoints**: < 2000ms (POST/PUT requests)
- **Slow Endpoints**: < 5000ms (Complex operations)

### Performance Alerts

Tests will fail if response times exceed acceptable thresholds, helping identify performance regressions.

## 🛠️ Customization & Extension

### Adding New Endpoints

1. **Create Request**: Add new request to appropriate folder
2. **Add Tests**: Include comprehensive test scripts
3. **Update Variables**: Add any new environment variables needed
4. **Document**: Update this README with new endpoint info

### Custom Test Scripts

```javascript
// Example: Custom validation for specific business rules
pm.test('Turf hourly rate is within acceptable range', function () {
    const jsonData = pm.response.json();
    const rate = jsonData.data.hourly_rate;
    pm.expect(rate).to.be.at.least(50).and.at.most(1000);
});
```

### Environment-specific Configurations

You can create custom environments for different scenarios:
- Staging environment
- Integration testing
- Load testing
- Security testing

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:8000
   ```
   **Solution**: Ensure Laravel server is running (`php artisan serve`)

2. **Authentication Failures**
   ```
   401 Unauthorized
   ```
   **Solution**: Check if `auth_token` is set correctly in environment

3. **Validation Errors**
   ```
   422 Unprocessable Entity
   ```
   **Solution**: Check request body data matches API expectations

4. **Missing Environment Variables**
   ```
   ReferenceError: sample_user_id is not defined
   ```
   **Solution**: Run authentication/user creation requests first

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=true ./postman/run-tests.sh
```

## 📞 Support & Contributing

### Getting Help

1. Check this documentation first
2. Review test logs in console
3. Check HTML reports for detailed error information
4. Create an issue in the project repository

### Contributing

1. Fork the repository
2. Create feature branch for your changes
3. Add/update tests for new functionality
4. Update documentation
5. Submit pull request

## 📄 License

This Postman collection is part of the TurfMate project and follows the same licensing terms.

---

**Happy Testing! 🚀**

*For questions or issues, please refer to the project documentation or create an issue in the repository.*
