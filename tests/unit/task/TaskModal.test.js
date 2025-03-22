import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskModal } from '@/components/task/TaskModal';
import { CATEGORY_OPTIONS, PRIORITY_LEVELS } from '@/lib/constants';

// Mock the required components and hooks
jest.mock('@/components/ui/form', () => ({
  Form: ({ children, onSubmit }) => <form onSubmit={onSubmit} data-testid="form">{children}</form>,
  FormField: ({ children }) => <div data-testid="form-field">{children}</div>,
  FormItem: ({ children }) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }) => <label>{children}</label>,
  FormControl: ({ children }) => <div data-testid="form-control">{children}</div>,
  FormMessage: ({ children }) => <div data-testid="form-message">{children}</div>,
  FormDescription: ({ children }) => <div data-testid="form-description">{children}</div>,
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: (cb) => (e) => {
      e?.preventDefault();
      cb({
        title: 'New Task Title',
        description: 'New Task Description',
        dueDate: '2025-03-30T12:00:00.000Z',
        priority: 'high',
        category: 'work'
      });
    },
    control: { field: {} },
    formState: { errors: {} },
    setValue: jest.fn(),
    getValues: jest.fn(),
    watch: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} data-testid="input" />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea {...props} data-testid="textarea" />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }) => <button data-testid="select-trigger">{children}</button>,
  SelectValue: (props) => <span {...props} data-testid="select-value" />,
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectGroup: ({ children }) => <div data-testid="select-group">{children}</div>,
  SelectItem: ({ children, value }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children }) => <div data-testid="radio-group">{children}</div>,
  RadioGroupItem: ({ children, value }) => (
    <div data-testid={`radio-group-item-${value}`}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, type, onClick }) => (
    <button data-testid={`button-${type || 'default'}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

// Sample task data for testing
const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'This is a test task description',
  completed: false,
  userId: 1,
  priority: 'medium',
  category: 'work',
  dueDate: '2025-03-30T12:00:00.000Z'
};

describe('TaskModal Component', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly when creating a new task', () => {
    render(
      <TaskModal
        isOpen={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Create Task/i)).toBeInTheDocument();
    expect(screen.getByTestId('form')).toBeInTheDocument();
  });

  it('renders correctly when editing an existing task', () => {
    render(
      <TaskModal
        isOpen={true}
        task={mockTask}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Edit Task/i)).toBeInTheDocument();
    expect(screen.getByTestId('form')).toBeInTheDocument();
  });

  it('calls onSave with form data when submitted', async () => {
    render(
      <TaskModal
        isOpen={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Submit the form (which uses the mocked form data)
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'New Task Title',
        description: 'New Task Description',
        dueDate: '2025-03-30T12:00:00.000Z',
        priority: 'high',
        category: 'work'
      });
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <TaskModal
        isOpen={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Find and click the cancel button
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays form fields for all task properties', () => {
    render(
      <TaskModal
        isOpen={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Check for title field
    expect(screen.getByText(/Title/i)).toBeInTheDocument();
    
    // Check for description field
    expect(screen.getByText(/Description/i)).toBeInTheDocument();
    
    // Check for due date field
    expect(screen.getByText(/Due Date/i)).toBeInTheDocument();
    
    // Priority and category should be present
    expect(screen.getByText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Category/i)).toBeInTheDocument();
  });
});