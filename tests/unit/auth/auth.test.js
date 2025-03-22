const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

// Mock the AuthContext before importing components that use it
jest.mock('@/components/auth/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => children
}));

// Import the components after mocking
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { LoginButton } = require('@/components/auth/LoginButton');
const { AuthModal } = require('@/components/auth/AuthModal');
const { useAuth } = require('@/components/auth/AuthContext');

describe('Authentication Components', () => {
  // Tests for LoginButton component
  describe('LoginButton', () => {
    beforeEach(() => {
      // Default mock implementation
      useAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: jest.fn(),
        emailLogin: jest.fn(),
        register: jest.fn(),
        logout: jest.fn()
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should render the login button correctly', () => {
      render(<LoginButton />);
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should handle click events correctly', () => {
      const mockOnClick = jest.fn();
      render(<LoginButton onMockLogin={mockOnClick} />);
      
      const button = screen.getByText('Sign in with Google');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  // Tests for AuthModal component
  describe('AuthModal', () => {
    const mockEmailLogin = jest.fn();
    const mockRegister = jest.fn();
    
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: jest.fn(),
        emailLogin: mockEmailLogin,
        register: mockRegister,
        logout: jest.fn()
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should render the auth modal correctly when open', () => {
      render(<AuthModal isOpen={true} />);
      expect(screen.getByText('AI Dev Tasks')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should switch between login and register tabs', async () => {
      render(<AuthModal isOpen={true} />);
      
      // Initially on the login tab
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      
      // Switch to register tab
      fireEvent.click(screen.getByText('Register'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      });
    });

    it('should handle login form submission correctly', async () => {
      render(<AuthModal isOpen={true} />);
      
      // Fill in login form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      
      // Submit form
      fireEvent.submit(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(mockEmailLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should validate login form fields', async () => {
      render(<AuthModal isOpen={true} />);
      
      // Submit form without filling fields
      fireEvent.submit(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      
      expect(mockEmailLogin).not.toHaveBeenCalled();
    });

    it('should handle registration form submission correctly', async () => {
      render(<AuthModal isOpen={true} />);
      
      // Switch to register tab
      fireEvent.click(screen.getByText('Register'));
      
      // Fill in registration form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      
      // Submit form
      fireEvent.submit(screen.getByText('Sign Up'));
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          password: 'password123',
          confirmPassword: 'password123'
        });
      });
    });

    it('should validate password matching in registration form', async () => {
      render(<AuthModal isOpen={true} />);
      
      // Switch to register tab
      fireEvent.click(screen.getByText('Register'));
      
      // Fill registration form with mismatched passwords
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password456' } });
      
      // Submit form
      fireEvent.submit(screen.getByText('Sign Up'));
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });
});