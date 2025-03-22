# TaskHub Testing Suite

This directory contains test scenarios and test cases for the TaskHub application. The tests are organized by feature and include both unit tests and integration tests.

## Test Structure
- `unit/`: Contains unit tests for individual components
- `integration/`: Contains integration tests for API endpoints and combined functionality
- `e2e/`: Contains end-to-end tests for complete user flows

## Running Tests
Tests can be run using Jest with the following command:
```
npm test
```

To run a specific test file:
```
npm test -- tests/unit/auth/login.test.js
```