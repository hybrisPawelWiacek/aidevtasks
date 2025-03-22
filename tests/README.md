# TaskHub Testing Documentation

This directory contains comprehensive tests for the TaskHub application, providing coverage for both frontend components and backend services.

## Test Structure

The tests are organized into the following structure:

```
tests/
├── unit/              # Tests for individual components
│   ├── auth/          # Authentication components tests
│   └── task/          # Task-related components tests
├── integration/       # Integration tests across components
│   ├── api/           # API endpoint integration tests
│   └── database/      # Database interaction tests
├── setup.js           # Jest setup file
└── README.md          # This documentation
```

## Running Tests

You can run the tests using the provided shell script:

```bash
# Run all tests
./run-tests.sh

# Run only unit tests
./run-tests.sh tests/unit

# Run specific test file
./run-tests.sh tests/unit/auth/auth.test.js
```

## Test Coverage

The test suite provides coverage for the following key areas:

### Unit Tests

- **Authentication Components**
  - AuthContext: Authentication state management
  - LoginButton: Sign-in functionality
  - AuthModal: Login/Register form switching and submission

- **Task Management Components**
  - TaskItem: Individual task display and interaction
  - TaskModal: Task creation and editing form
  - TasksContainer: Task filtering, sorting, and CRUD operations

### Integration Tests

- **API Endpoints**
  - Auth API: Registration, login, logout, and status endpoints
  - Task API: Task creation, retrieval, updates, and deletion endpoints

- **Database Operations**
  - User operations: Creating, retrieving, and updating users
  - Task operations: Creating, retrieving, updating, and deleting tasks

## Mocking Strategy

The tests use the following mocking strategies to ensure isolation and reproducibility:

- **Component Mocks**: Child components are mocked to focus testing on the component under test
- **API Mocks**: The `apiRequest` function from `queryClient` is mocked to simulate backend responses
- **Database Mocks**: Database operations are mocked to provide a controlled test environment
- **Authentication Mocks**: Authentication state and session handling are mocked for testing protected routes

## Test Environment Setup

The test environment is configured in `setup.js` to provide:

- Mock implementations of browser APIs (window, document, etc.)
- Mock implementations of Vite-specific features (import.meta.env)
- Spy/mock implementations for console methods to reduce test output noise

## Best Practices

When writing additional tests, follow these best practices:

1. **Isolation**: Test components in isolation by mocking dependencies
2. **Reproducibility**: Ensure tests are deterministic and don't depend on external state
3. **Readability**: Use descriptive test names and organize tests logically
4. **Coverage**: Test both happy paths and error conditions
5. **Performance**: Keep tests focused and fast by minimizing unnecessary setup

## Known Limitations

- End-to-end tests are not included in this test suite
- Some tests may require adjustments if component implementations change significantly
- Vite-specific environment variables require special handling in the test environment