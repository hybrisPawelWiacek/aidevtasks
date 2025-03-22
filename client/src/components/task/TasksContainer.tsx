import React, { useState, useEffect, useMemo } from "react";
import { Task } from "@shared/schema";
import { TaskFilters, FilterType } from "./TaskFilters";
import { TaskSort, SortOption } from "./TaskSort";
import { TaskItem } from "./TaskItem";
import { AddTaskButton } from "./AddTaskButton";
import { TaskModal } from "./TaskModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isToday, isFuture, isPast, parseISO } from "date-fns";
import { CheckCheck } from "lucide-react";

interface TasksContainerProps {
  userId: number;
}

export const TasksContainer: React.FC<TasksContainerProps> = ({ userId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortOption, setSortOption] = useState<SortOption>("default"); // Default sort option
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [activeTasksOpen, setActiveTasksOpen] = useState(true);
  const [completedTasksOpen, setCompletedTasksOpen] = useState(true);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 10000, // 10 seconds
  });

  // Create task mutation
  const { mutate: createTask } = useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating task",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const { mutate: updateTask } = useMutation({
    mutationFn: async (task: Task) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Your task has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Update task completion mutation
  const { mutate: updateTaskCompletion } = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}/complete`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating task status",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const { mutate: deleteTask } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting task",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on the active filter
  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case "all":
        return tasks;
      case "today":
        return tasks.filter(task => task.dueDate && isToday(parseISO(task.dueDate)));
      case "upcoming":
        return tasks.filter(task => task.dueDate && isFuture(parseISO(task.dueDate)));
      case "completed":
        return tasks.filter(task => task.completed);
      case "high":
        return tasks.filter(task => task.priority === "high");
      case "overdue":
        return tasks.filter(task => task.dueDate && isPast(parseISO(task.dueDate)) && !task.completed);
      default:
        return tasks;
    }
  }, [tasks, activeFilter]);

  // Helper function to get priority value from a task
  const getPriorityValue = (task: Task) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[task.priority] || 0;
  };

  // Custom sort functions for different sorting options
  const sortFunctions = {
    default: (a: Task, b: Task) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;

      // First level: Completed status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Completed tasks come after open tasks
      }

      // Second level: Priority
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // High priority tasks come first
      }

      // Third level: Due date (closer dates come first)
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      if (dateA !== dateB) {
        // For same priority, closer due date comes first (today before tomorrow)
        // If one has no due date, it comes last
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;
        return dateA - dateB; // Reversed from dateB - dateA to prioritize closer dates
      }

      // Fourth level: Content completeness
      const countFilledProperties = (task: Task) => {
        let count = 0;
        // Count non-empty properties that represent content
        if (task.title && task.title.trim() !== '') count++;
        if (task.description && task.description.trim() !== '') count++;
        if (task.dueDate) count++;
        // Only count category if it's not "none"
        if (task.category && task.category.trim() !== '' && task.category.toLowerCase() !== 'none') count++;
        if (task.labels && task.labels.length > 0) count++;
        // Add more properties here as they're added to the model
        return count;
      };

      const contentCountA = countFilledProperties(a);
      const contentCountB = countFilledProperties(b);

      if (contentCountA !== contentCountB) {
        return contentCountB - contentCountA; // More filled properties come first
      }

      // Fifth level: Creation timestamp
      const createdAtA = new Date(a.createdAt || 0).getTime();
      const createdAtB = new Date(b.createdAt || 0).getTime();

      return createdAtB - createdAtA; // More recent creation comes first
    },
    "date-asc": (a: Task, b: Task) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      if (dateA === 0) return 1;
      if (dateB === 0) return -1;
      return dateA - dateB; // Oldest first
    },

    "date-desc": (a: Task, b: Task) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      if (dateA === 0) return 1;
      if (dateB === 0) return -1;
      return dateB - dateA; // Newest first
    },

    priority: (a: Task, b: Task) => {
      const priorityA = getPriorityValue(a);
      const priorityB = getPriorityValue(b);
      return priorityB - priorityA; // Higher priority first
    },

    alphabetical: (a: Task, b: Task) => {
      return a.title.localeCompare(b.title); // A to Z
    }
  };

  // Sort tasks using the selected sort option
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort(sortFunctions[sortOption]);
  }, [filteredTasks, sortOption]);

  // Separate active and completed tasks (preserving the sort order within each section)
  const { activeTasks, completedTasks } = useMemo(() => {
    const active = sortedTasks.filter(task => !task.completed);
    const completed = sortedTasks.filter(task => task.completed);
    return { activeTasks: active, completedTasks: completed };
  }, [sortedTasks]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
  };

  const handleAddTaskClick = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, "id">) => {
    // Add userId to the task data
    const taskWithUserId = {
      ...taskData,
      userId,
    };

    if (editingTask) {
      updateTask({ ...taskWithUserId, id: editingTask.id });
    } else {
      createTask(taskWithUserId);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: number) => {
    setTaskToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
    setIsConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setTaskToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleToggleComplete = (id: number, completed: boolean) => {
    updateTaskCompletion({ id, completed });
  };

  return (
    <>
      {/* Task Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <TaskFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          {/* Task Counter and Sort */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {sortedTasks.length} {sortedTasks.length === 1 ? "Task" : "Tasks"}
            </h2>

            <TaskSort sortOption={sortOption} onSortChange={handleSortChange} />
          </div>

          {/* Task List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse p-4" />
              ))}
            </div>
          ) : sortedTasks.length > 0 ? (
            <div className="space-y-6">
              {/* Active Tasks Section */}
              {activeTasks.length > 0 && (
                <div>
                  <h3 
                    className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider cursor-pointer flex items-center gap-2"
                    onClick={() => setActiveTasksOpen(!activeTasksOpen)}
                  >
                    <svg 
                      className={`h-4 w-4 transition-transform duration-300 ${activeTasksOpen ? 'rotate-0' : '-rotate-90'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Active Tasks
                  </h3>
                  <div 
                    className={`space-y-3 transition-all duration-300 overflow-hidden ${
                      activeTasksOpen ? 'max-h-[5000px] opacity-100' : 'max-h-[70px] opacity-80'
                    }`}
                    style={{
                      maskImage: !activeTasksOpen ? 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0))' : 'none',
                      WebkitMaskImage: !activeTasksOpen ? 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0))' : 'none',
                    }}
                  >
                    {activeTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks Section */}
              {completedTasks.length > 0 && (
                <div className="mt-6">
                  <h3 
                    className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider cursor-pointer flex items-center gap-2"
                    onClick={() => setCompletedTasksOpen(!completedTasksOpen)}
                  >
                    <svg 
                      className={`h-4 w-4 transition-transform duration-300 ${completedTasksOpen ? 'rotate-0' : '-rotate-90'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Completed Tasks
                  </h3>
                  <div 
                    className={`space-y-3 opacity-80 transition-all duration-300 overflow-hidden ${
                      completedTasksOpen ? 'max-h-[5000px] opacity-80' : 'max-h-[70px] opacity-60'
                    }`}
                    style={{
                      maskImage: !completedTasksOpen ? 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0))' : 'none',
                      WebkitMaskImage: !completedTasksOpen ? 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0))' : 'none',
                    }}
                  >
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCheck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
              <p className="text-gray-500 mb-6">There are no tasks matching your current filter.</p>
              <button
                className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                onClick={handleAddTaskClick}
              >
                Add a new task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Button */}
      <AddTaskButton onClick={handleAddTaskClick} />

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        onSave={handleSaveTask}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        message="Are you sure you want to delete this task?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};