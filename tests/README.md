# TaskHub Test Suite

This directory contains test cases for the TaskHub application. The tests are organized into different categories to ensure comprehensive coverage of the application's functionality.

## Test Structure

The test suite is organized into the following structure:

```
tests/
├── unit/              # Unit tests for individual components
│   ├── auth/          # Tests for authentication components
│   └── task/          # Tests for task management components
├── integration/       # Tests for integration between components
│   ├── api/           # Tests for API endpoints
│   └── database/      # Tests for database operations
└── e2e/               # End-to-end tests
    └── flows/         # Tests for complete user flows
```

## Running Tests

To run the entire test suite:

```bash
npm test
```

To run specific test categories:

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e
```

To run a specific test file:

```bash
npm test -- tests/path/to/test-file.js
```

## Test Coverage

The test suite covers the following key areas:

### Unit Tests

1. **Authentication Components**
   - `LoginButton`: Tests for rendering and click event handling
   - `AuthModal`: Tests for rendering, form handling, validation, and submission

2. **Task Management Components**
   - `TaskItem`: Tests for rendering, state management, and user interactions
   - `TaskModal`: Tests for form validation, submission, and UI rendering
   - `TasksContainer`: Tests for task filtering, sorting, and CRUD operations

### Integration Tests

1. **API Endpoints**
   - `auth.api.test.js`: Tests for registration, login, status checking, and logout
   - `task.api.test.js`: Tests for task creation, retrieval, updating, and deletion

2. **Database Operations**
   - `storage.test.js`: Tests for database access, data persistence, and data retrieval

### End-to-End Tests (Future Implementation)

1. **User Flows**
   - User registration and login
   - Task creation, editing, and deletion
   - Task filtering and sorting

## Mocking Strategy

The test suite uses Jest's mocking capabilities to isolate components during testing:

- External dependencies are mocked to prevent network calls and database operations
- Authentication contexts are mocked to simulate different user states
- API responses are mocked to test various scenarios and error handling

## Best Practices

When adding new tests, please follow these best practices:

1. **Test Isolation**: Ensure each test is independent and doesn't rely on other tests
2. **Clear Test Names**: Use descriptive names that explain what is being tested
3. **Setup and Teardown**: Use `beforeEach` and `afterEach` for proper test setup and cleanup
4. **Mock External Dependencies**: Avoid real network calls or database operations in unit tests
5. **Test Edge Cases**: Include tests for error handling and edge cases

## Troubleshooting

If you encounter issues with the tests:

1. Make sure all dependencies are installed (`npm install`)
2. Ensure the test environment is properly set up
3. Check for any pending migrations or database setup requirements
4. Look for any mock implementations that may need updating