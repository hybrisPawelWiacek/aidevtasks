import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TasksContainer } from '@/components/task/TasksContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the queryClient to avoid network requests
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation((endpoint, options) => {
    if (endpoint === '/api/tasks') {
      return Promise.resolve([
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          completed: false,
          userId: 1,
          priority: 'high',
          category: 'work',
          dueDate: '2025-03-30T12:00:00.000Z'
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          completed: true,
          userId: 1,
          priority: 'medium',
          category: 'personal',
          dueDate: '2025-04-15T12:00:00.000Z'
        }
      ]);
    }
    // Mock update task completion
    if (endpoint === '/api/tasks/1/complete') {
      return Promise.resolve({
        id: 1,
        title: 'Task 1',
        description: 'Description 1',
        completed: options.method === 'POST', // Will be true if marking complete
        userId: 1,
        priority: 'high',
        category: 'work',
        dueDate: '2025-03-30T12:00:00.000Z'
      });
    }
    // Mock update task
    if (endpoint === '/api/tasks/1') {
      return Promise.resolve(options.body);
    }
    // Mock create task
    if (endpoint === '/api/tasks' && options.method === 'POST') {
      return Promise.resolve({
        id: 3,
        ...options.body,
        userId: 1
      });
    }
    // Mock delete task
    if (endpoint === '/api/tasks/1' && options.method === 'DELETE') {
      return Promise.resolve({ success: true });
    }
    return Promise.resolve({});
  }),
  getQueryFn: () => jest.fn().mockResolvedValue([]),
  queryClient: {
    invalidateQueries: jest.fn()
  }
}));

// Mock child components
jest.mock('@/components/task/TaskList', () => ({
  TaskList: ({ tasks, onEditTask, onDeleteTask, onCompleteTask }) => (
    <div data-testid="task-list">
      <span>Task Count: {tasks.length}</span>
      <button 
        data-testid="edit-task-button" 
        onClick={() => onEditTask(tasks[0])}
      >
        Edit Task
      </button>
      <button 
        data-testid="delete-task-button" 
        onClick={() => onDeleteTask(tasks[0].id)}
      >
        Delete Task
      </button>
      <button 
        data-testid="complete-task-button" 
        onClick={() => onCompleteTask(tasks[0].id, !tasks[0].completed)}
      >
        Toggle Complete
      </button>
    </div>
  )
}));

jest.mock('@/components/task/TaskModal', () => ({
  TaskModal: ({ isOpen, task, onSave, onClose }) => (
    <div data-testid="task-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <span>Editing: {task ? task.title : 'New Task'}</span>
      <button 
        data-testid="save-task-button" 
        onClick={() => onSave({ 
          title: 'Updated Task', 
          description: 'Updated Description',
          priority: 'medium',
          category: 'work',
          dueDate: '2025-04-01T12:00:00.000Z'
        })}
      >
        Save
      </button>
      <button data-testid="close-modal-button" onClick={onClose}>Close</button>
    </div>
  )
}));

jest.mock('@/components/task/TaskFilters', () => ({
  TaskFilters: ({ activeFilter, onFilterChange }) => (
    <div data-testid="task-filters">
      <span>Active Filter: {activeFilter}</span>
      <button 
        data-testid="change-filter-button" 
        onClick={() => onFilterChange('completed')}
      >
        Change Filter
      </button>
    </div>
  )
}));

jest.mock('@/components/task/TaskSort', () => ({
  TaskSort: ({ sortOption, onSortChange }) => (
    <div data-testid="task-sort">
      <span>Sort Option: {sortOption}</span>
      <button 
        data-testid="change-sort-button" 
        onClick={() => onSortChange('priority')}
      >
        Change Sort
      </button>
    </div>
  )
}));

jest.mock('@/components/task/AddTaskButton', () => ({
  AddTaskButton: ({ onClick }) => (
    <button data-testid="add-task-button" onClick={onClick}>
      Add Task
    </button>
  )
}));

jest.mock('@/components/task/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, message, onConfirm, onCancel }) => (
    <div data-testid="confirm-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
      <span>{message}</span>
      <button data-testid="confirm-button" onClick={onConfirm}>Confirm</button>
      <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
    </div>
  )
}));

// Create a wrapper for the component with QueryClientProvider
const renderWithQueryClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('TasksContainer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tasks container with initial state', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    // Initially should show loading state
    expect(screen.getByText(/Loading tasks.../i)).toBeInTheDocument();
    
    // After loading completes
    await waitFor(() => {
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });
    
    // Check if filter and sort components are rendered
    expect(screen.getByTestId('task-filters')).toBeInTheDocument();
    expect(screen.getByTestId('task-sort')).toBeInTheDocument();
    
    // Add task button should be present
    expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
  });

  it('opens task modal when add task button is clicked', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
    });
    
    // Click add task button
    fireEvent.click(screen.getByTestId('add-task-button'));
    
    // Task modal should be visible
    expect(screen.getByTestId('task-modal')).toHaveStyle('display: block');
  });

  it('opens edit modal when edit task is clicked', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-task-button')).toBeInTheDocument();
    });
    
    // Click edit task button
    fireEvent.click(screen.getByTestId('edit-task-button'));
    
    // Task modal should be visible with the task title
    expect(screen.getByTestId('task-modal')).toHaveStyle('display: block');
    expect(screen.getByText(/Editing: Task 1/i)).toBeInTheDocument();
  });

  it('shows confirmation dialog when delete task is clicked', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-task-button')).toBeInTheDocument();
    });
    
    // Click delete task button
    fireEvent.click(screen.getByTestId('delete-task-button'));
    
    // Confirm dialog should be visible
    expect(screen.getByTestId('confirm-dialog')).toHaveStyle('display: block');
  });

  it('changes task filter when filter is changed', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('change-filter-button')).toBeInTheDocument();
    });
    
    // Initial filter should be 'all'
    expect(screen.getByText(/Active Filter: all/i)).toBeInTheDocument();
    
    // Click change filter button (mocked to change to 'completed')
    fireEvent.click(screen.getByTestId('change-filter-button'));
    
    // Filter should be updated
    expect(screen.getByText(/Active Filter: completed/i)).toBeInTheDocument();
  });

  it('changes sort option when sort is changed', async () => {
    renderWithQueryClient(<TasksContainer userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('change-sort-button')).toBeInTheDocument();
    });
    
    // Initial sort option should be 'date-desc'
    expect(screen.getByText(/Sort Option: date-desc/i)).toBeInTheDocument();
    
    // Click change sort button (mocked to change to 'priority')
    fireEvent.click(screen.getByTestId('change-sort-button'));
    
    // Sort option should be updated
    expect(screen.getByText(/Sort Option: priority/i)).toBeInTheDocument();
  });
});