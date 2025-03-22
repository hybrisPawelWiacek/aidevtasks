import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '@/components/task/TaskItem';
import { TaskContextMenu } from '@/components/task/TaskContextMenu';

// Mock the components used in TaskItem
jest.mock('@/components/task/TaskContextMenu', () => ({
  TaskContextMenu: ({ children, task, onEdit, onDelete, onComplete }) => (
    <div data-testid="task-context-menu" onClick={() => onEdit(task)}>
      {children}
      <button data-testid="mock-edit-button" onClick={() => onEdit(task)}>Edit</button>
      <button data-testid="mock-delete-button" onClick={() => onDelete(task.id)}>Delete</button>
      <button data-testid="mock-complete-button" onClick={() => onComplete(task.id, !task.completed)}>
        Toggle Complete
      </button>
    </div>
  )
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

describe('TaskItem Component', () => {
  const mockOnToggleComplete = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    // Clear mock function calls before each test
    mockOnToggleComplete.mockClear();
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders task correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check if task title is displayed
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    
    // Verify task description is present
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
    
    // Verify priority badge is displayed
    expect(screen.getByText(new RegExp(mockTask.priority, 'i'))).toBeInTheDocument();
    
    // Verify category is displayed
    expect(screen.getByText(new RegExp(mockTask.category, 'i'))).toBeInTheDocument();
  });

  it('calls onToggleComplete when checkbox is clicked', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Find and click on the checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Verify the toggle function was called with correct args
    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTask.id, true);
  });

  it('calls onEdit through context menu', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Find and click on the edit button in the mocked context menu
    const editButton = screen.getByTestId('mock-edit-button');
    fireEvent.click(editButton);

    // Verify the edit function was called with the task
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete through context menu', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Find and click on the delete button in the mocked context menu
    const deleteButton = screen.getByTestId('mock-delete-button');
    fireEvent.click(deleteButton);

    // Verify the delete function was called with the task id
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows different styles for completed tasks', () => {
    const completedTask = { ...mockTask, completed: true };
    
    render(
      <TaskItem
        task={completedTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Find the checkbox and verify it's checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    // The title should have a completed style (this might need to be adjusted based on actual implementation)
    const titleElement = screen.getByText(mockTask.title);
    // Check for a class that indicates completion (e.g., line-through)
    expect(titleElement.closest('div')).toHaveClass('line-through', { exact: false });
  });

  it('renders due date correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Due date should be displayed in some format
    // This might need adjustment based on your date formatting
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });
});