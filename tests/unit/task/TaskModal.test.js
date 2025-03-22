const { describe, it, expect, jest, beforeEach } = require('@jest/globals');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { TaskModal } = require('@/components/task/TaskModal');

// Mock components used by TaskModal
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogFooter: ({ children }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ onSubmit, children }) => <form onSubmit={onSubmit} data-testid="form">{children}</form>,
  FormField: ({ name, control, render }) => render({ field: { name, value: '', onChange: jest.fn() } }),
  FormItem: ({ children }) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }) => <label>{children}</label>,
  FormControl: ({ children }) => <div data-testid="form-control">{children}</div>,
  FormMessage: ({ children }) => <div data-testid="form-message">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} data-testid="input" />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea {...props} data-testid="textarea" />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ children }) => <div data-testid="select-value">{children}</div>,
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props} data-testid="button">{children}</button>,
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (cb) => (e) => {
      e.preventDefault();
      cb({
        title: 'Test Task',
        description: 'Test description',
        dueDate: '2023-03-01',
        priority: 'medium',
        category: 'Work'
      });
    },
    reset: jest.fn(),
    formState: { errors: {} }
  }),
}));

// Mock the hookform/resolvers/zod
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => ({})),
}));

describe('TaskModal Component', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly when opened for creating a new task', () => {
    render(
      <TaskModal
        isOpen={true}
        task={undefined}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('should render correctly when opened for editing an existing task', () => {
    const mockTask = {
      id: 1,
      title: 'Existing Task',
      description: 'This is an existing task',
      completed: false,
      priority: 'high',
      dueDate: '2023-03-01',
      category: 'Work',
      userId: 1
    };

    render(
      <TaskModal
        isOpen={true}
        task={mockTask}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TaskModal
        isOpen={false}
        task={undefined}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should call onSave with the correct data when form is submitted', async () => {
    render(
      <TaskModal
        isOpen={true}
        task={undefined}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const form = screen.getByTestId('form');
    fireEvent.submit(form);

    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Test Task',
      description: 'Test description',
      dueDate: '2023-03-01',
      priority: 'medium',
      category: 'Work'
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <TaskModal
        isOpen={true}
        task={undefined}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});