import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { LoginButton } from '@/components/auth/LoginButton';
import { AuthModal } from '@/components/auth/AuthModal';

// Mock the queryClient to avoid network requests
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation((endpoint, options) => {
    if (endpoint === '/api/auth/login') {
      return Promise.resolve({
        user: { id: 1, displayName: 'Test User', email: 'test@example.com' }
      });
    }
    if (endpoint === '/api/auth/register') {
      return Promise.resolve({
        user: { id: 2, displayName: 'New User', email: 'new@example.com' }
      });
    }
    if (endpoint === '/api/auth/status') {
      return Promise.resolve({
        user: null
      });
    }
    return Promise.resolve({});
  }),
  getQueryFn: () => jest.fn()
}));

// Simple test wrapper component to access the auth context
const TestAuthConsumer = ({ children, testId = 'auth-consumer' }) => {
  const auth = useAuth();
  return (
    <div data-testid={testId}>
      {children(auth)}
    </div>
  );
};

describe('Authentication Components', () => {
  describe('AuthContext', () => {
    it('provides authentication state to children', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer>
            {(auth) => (
              <>
                <div data-testid="is-loading">{String(auth.isLoading)}</div>
                <div data-testid="user-state">{auth.user ? 'logged-in' : 'logged-out'}</div>
              </>
            )}
          </TestAuthConsumer>
        </AuthProvider>
      );

      expect(screen.getByTestId('is-loading').textContent).toBe('true');
      
      // Wait for the initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('is-loading').textContent).toBe('false');
      });
      
      expect(screen.getByTestId('user-state').textContent).toBe('logged-out');
    });

    it('handles login correctly', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer>
            {(auth) => (
              <>
                <div data-testid="user-state">{auth.user ? 'logged-in' : 'logged-out'}</div>
                <button 
                  data-testid="login-button"
                  onClick={() => auth.emailLogin('test@example.com', 'password')}
                >
                  Login
                </button>
              </>
            )}
          </TestAuthConsumer>
        </AuthProvider>
      );

      // Wait for the initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('user-state').textContent).toBe('logged-out');
      });
      
      // Trigger login
      fireEvent.click(screen.getByTestId('login-button'));
      
      // User should be logged in after successful login
      await waitFor(() => {
        expect(screen.getByTestId('user-state').textContent).toBe('logged-in');
      });
    });
  });

  describe('LoginButton', () => {
    it('renders correctly', () => {
      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );
      
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });

    it('calls onMockLogin when in non-production environment', async () => {
      const mockLoginHandler = jest.fn();
      
      render(
        <AuthProvider>
          <LoginButton onMockLogin={mockLoginHandler} isProduction={false} />
        </AuthProvider>
      );
      
      fireEvent.click(screen.getByText(/Sign in/i));
      
      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
      });
      
      // Mock login option should be available in non-production
      fireEvent.click(screen.getByText(/Continue with Google/i));
      expect(mockLoginHandler).toHaveBeenCalled();
    });
  });

  describe('AuthModal', () => {
    it('toggles between login and register forms', async () => {
      render(
        <AuthProvider>
          <AuthModal isOpen={true} />
        </AuthProvider>
      );
      
      // Should start with login form
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
      
      // Switch to register form
      fireEvent.click(screen.getByText(/Create an account/i));
      
      // Should show register form
      await waitFor(() => {
        expect(screen.getByText(/Sign up for an account/i)).toBeInTheDocument();
      });
      
      // Switch back to login form
      fireEvent.click(screen.getByText(/Already have an account/i));
      
      // Should show login form again
      await waitFor(() => {
        expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
      });
    });
  });
});