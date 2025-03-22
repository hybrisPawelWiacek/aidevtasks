const { describe, it, expect, jest, beforeEach } = require('@jest/globals');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { TasksContainer } = require('@/components/task/TasksContainer');

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn()
  }))
}));

// Mock child components
jest.mock('@/components/task/TaskFilters', () => ({
  TaskFilters: ({ activeFilter, onFilterChange }) => (
    <div data-testid="task-filters">
      <button onClick={() => onFilterChange('all')}>All</button>
      <button onClick={() => onFilterChange('today')}>Today</button>
      <button onClick={() => onFilterChange('completed')}>Completed</button>
    </div>
  )
}));

jest.mock('@/components/task/TaskSort', () => ({
  TaskSort: ({ sortOption, onSortChange }) => (
    <div data-testid="task-sort">
      <button onClick={() => onSortChange('date-asc')}>Date Asc</button>
      <button onClick={() => onSortChange('priority')}>Priority</button>
    </div>
  )
}));

jest.mock('@/components/task/TaskItem', () => ({
  TaskItem: ({ task, onToggleComplete, onEdit, onDelete }) => (
    <div data-testid={`task-item-${task.id}`}>
      {task.title}
      <button onClick={() => onToggleComplete(task.id, !task.completed)}>Toggle</button>
      <button onClick={() => onEdit(task)}>Edit</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  )
}));

jest.mock('@/components/task/AddTaskButton', () => ({
  AddTaskButton: ({ onClick }) => (
    <button data-testid="add-task-button" onClick={onClick}>Add Task</button>
  )
}));

jest.mock('@/components/task/TaskModal', () => ({
  TaskModal: ({ isOpen, task, onSave, onClose }) => (
    isOpen ? (
      <div data-testid="task-modal">
        <div>Task: {task ? task.title : 'New Task'}</div>
        <button onClick={() => onSave({ title: 'New Task', priority: 'medium', dueDate: '2023-03-01' })}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  )
}));

jest.mock('@/components/task/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, message, onConfirm, onCancel }) => (
    isOpen ? (
      <div data-testid="confirm-dialog">
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  )
}));

// Mock the api request function
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ id: 999 })
  })
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

const { useQuery, useMutation } = require('@tanstack/react-query');

describe('TasksContainer Component', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      completed: false,
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0], // Today
      category: 'Work',
      userId: 1
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      completed: true,
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0], // Today
      category: 'Personal',
      userId: 1
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Description 3',
      completed: false,
      priority: 'low',
      dueDate: '2023-12-31', // Future date
      category: 'Other',
      userId: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useQuery hook
    useQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false
    });
    
    // Mock the useMutation hook
    useMutation.mockReturnValue({
      mutate: jest.fn((task, callbacks) => {
        if (callbacks && callbacks.onSuccess) {
          callbacks.onSuccess();
        }
      }),
      isPending: false
    });
  });

  it('should render all tasks by default', () => {
    render(<TasksContainer userId={1} />);
    
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-3')).toBeInTheDocument();
  });

  it('should filter tasks when filter is changed', () => {
    render(<TasksContainer userId={1} />);
    
    // Click on "Completed" filter
    fireEvent.click(screen.getByText('Completed'));
    
    // Should render only the completed task
    waitFor(() => {
      expect(screen.queryByTestId('task-item-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-item-3')).not.toBeInTheDocument();
    });
  });

  it('should sort tasks when sort option is changed', () => {
    render(<TasksContainer userId={1} />);
    
    // Click on "Priority" sort
    fireEvent.click(screen.getByText('Priority'));
    
    // Task order should change based on priority (high first)
    waitFor(() => {
      const tasks = screen.getAllByTestId(/task-item/);
      expect(tasks[0]).toBe(screen.getByTestId('task-item-2')); // High priority
      expect(tasks[1]).toBe(screen.getByTestId('task-item-1')); // Medium priority
      expect(tasks[2]).toBe(screen.getByTestId('task-item-3')); // Low priority
    });
  });

  it('should open the task modal when add task button is clicked', () => {
    render(<TasksContainer userId={1} />);
    
    // Initially, the modal should not be visible
    expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
    
    // Click on add task button
    fireEvent.click(screen.getByTestId('add-task-button'));
    
    // Modal should now be visible
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
  });

  it('should open edit modal with task data when edit is clicked', () => {
    render(<TasksContainer userId={1} />);
    
    // Click edit on the first task
    fireEvent.click(screen.getAllByText('Edit')[0]);
    
    // Modal should be visible with task data
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    expect(screen.getByText('Task: Task 1')).toBeInTheDocument();
  });

  it('should open confirm dialog when delete is clicked', () => {
    render(<TasksContainer userId={1} />);
    
    // Initially, the confirm dialog should not be visible
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    
    // Click delete on the first task
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Confirm dialog should now be visible
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('should create a new task when task modal is saved', () => {
    // Get the mutate mock function
    const mockMutate = jest.fn();
    useMutation.mockReturnValueOnce({
      mutate: mockMutate,
      isPending: false
    }).mockReturnValue({
      mutate: jest.fn(),
      isPending: false
    });
    
    render(<TasksContainer userId={1} />);
    
    // Open the add task modal
    fireEvent.click(screen.getByTestId('add-task-button'));
    
    // Save the new task
    fireEvent.click(screen.getByText('Save'));
    
    // Should call the mutate function with the new task data
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
        priority: 'medium',
        dueDate: expect.any(String)
      }),
      expect.anything()
    );
  });

  it('should update task completion when toggle is clicked', () => {
    // Get the mutate mock function for the toggle complete mutation
    const mockMutate = jest.fn();
    useMutation.mockReturnValueOnce({
      mutate: jest.fn(),
      isPending: false
    }).mockReturnValueOnce({
      mutate: mockMutate,
      isPending: false
    });
    
    render(<TasksContainer userId={1} />);
    
    // Toggle the completion of the first task
    fireEvent.click(screen.getAllByText('Toggle')[0]);
    
    // Should call the mutate function with the task ID and the new completion status
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        completed: true
      }),
      expect.anything()
    );
  });
});