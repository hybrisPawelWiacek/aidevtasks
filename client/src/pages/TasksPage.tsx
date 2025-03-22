
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask } from "../../shared/schema";
import { TaskList } from "@/components/task/TaskList";
import { AddTaskButton } from "@/components/task/AddTaskButton";
import { TaskModal } from "@/components/task/TaskModal";
import { ConfirmDialog } from "@/components/task/ConfirmDialog";
import { TaskFilters, FilterType } from "@/components/task/TaskFilters";
import { TaskSort, SortOption } from "@/components/task/TaskSort";
import { fetchTasks, createTask, updateTask, deleteTask, completeTask } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function TasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeSortOption, setActiveSortOption] = useState<SortOption>("dueDate-asc");

  // Tasks query
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  // Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => 
      completeTask(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setIsTaskModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully."
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully."
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully."
      });
    }
  });

  // Handlers
  const handleTaskComplete = (id: number, completed: boolean) => {
    completeMutation.mutate({ id, completed });
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setSelectedTask(task);
      setIsDeleteModalOpen(true);
    }
  };

  const handleSaveTask = (data: InsertTask) => {
    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask.id);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <TaskFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <TaskSort activeSortOption={activeSortOption} onSortChange={setActiveSortOption} />
      </div>
      
      <TaskList
        tasks={tasks}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onCompleteTask={handleTaskComplete}
      />
      
      <AddTaskButton onClick={handleAddTask} />
      
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
      />
      
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
