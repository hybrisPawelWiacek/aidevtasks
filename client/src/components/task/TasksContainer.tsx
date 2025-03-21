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
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "completed") return task.completed;
      if (activeFilter === "today") {
        try {
          return isToday(parseISO(task.dueDate));
        } catch {
          return false;
        }
      }
      if (activeFilter === "upcoming") {
        try {
          return isFuture(parseISO(task.dueDate));
        } catch {
          return false;
        }
      }
      if (activeFilter === "high") return task.priority === "high";
      return true;
    });
  }, [tasks, activeFilter]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortOption === "date-asc") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortOption === "date-desc") {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      if (sortOption === "priority") {
        const priorityValue = { high: 3, medium: 2, low: 1 };
        return (
          (priorityValue[b.priority as "high" | "medium" | "low"] || 0) -
          (priorityValue[a.priority as "high" | "medium" | "low"] || 0)
        );
      }
      if (sortOption === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredTasks, sortOption]);

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
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
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
