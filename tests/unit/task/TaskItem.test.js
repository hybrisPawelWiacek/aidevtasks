const { describe, it, expect, jest } = require('@jest/globals');
const { render, screen, fireEvent } = require('@testing-library/react');
const { TaskItem } = require('@/components/task/TaskItem');

// Mock the dateUtils functions
jest.mock('@/lib/dateUtils', () => ({
  formatDate: jest.fn((date) => '2023-03-01'),
  isDateInPast: jest.fn((date) => false)
}));

describe('TaskItem Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'This is a test task description',
    completed: false,
    priority: 'medium',
    dueDate: '2023-03-01',
    category: 'Work',
    userId: 1
  };

  const mockToggleComplete = jest.fn();
  const mockEdit = jest.fn();
  const mockDelete = jest.fn();

  it('should render task information correctly', () => {
    render(
      <TaskItem 
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('2023-03-01')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should display the correct priority indicator', () => {
    render(
      <TaskItem 
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    // Medium priority should have a specific styling
    const priorityIndicator = screen.getByRole('status');
    expect(priorityIndicator).toHaveClass('bg-yellow-500');
  });

  it('should handle toggle complete action', () => {
    render(
      <TaskItem 
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggleComplete).toHaveBeenCalledWith(1, true);
  });

  it('should handle edit action', () => {
    render(
      <TaskItem 
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit task');
    fireEvent.click(editButton);

    expect(mockEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should handle delete action', () => {
    render(
      <TaskItem 
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete task');
    fireEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('should render completed task with appropriate styling', () => {
    const completedTask = {...mockTask, completed: true};
    
    render(
      <TaskItem 
        task={completedTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const taskTitle = screen.getByText('Test Task');
    expect(taskTitle).toHaveClass('line-through');
  });

  it('should render different styling for high priority tasks', () => {
    const highPriorityTask = {...mockTask, priority: 'high'};
    
    render(
      <TaskItem 
        task={highPriorityTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const priorityIndicator = screen.getByRole('status');
    expect(priorityIndicator).toHaveClass('bg-red-500');
  });

  it('should render different styling for low priority tasks', () => {
    const lowPriorityTask = {...mockTask, priority: 'low'};
    
    render(
      <TaskItem 
        task={lowPriorityTask}
        onToggleComplete={mockToggleComplete}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const priorityIndicator = screen.getByRole('status');
    expect(priorityIndicator).toHaveClass('bg-green-500');
  });
});