
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../shared/schema";
import { fetchTasks, completeTask, createTask, updateTask, deleteTask } from "@/lib/api";
import { TaskList } from "@/components/task/TaskList";
import { TaskModal } from "@/components/task/TaskModal";
import { AddTaskButton } from "@/components/task/AddTaskButton";
import { ConfirmDialog } from "@/components/task/ConfirmDialog";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function TasksPage() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: "all" as "all" | "active" | "completed",
    priority: [] as string[],
    category: [] as string[],
    search: ""
  });
  const [sortOrder, setSortOrder] = useState({
    field: "dueDate" as "dueDate" | "priority" | "title" | "createdAt",
    direction: "asc" as "asc" | "desc"
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks
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
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (selectedTask) {
      updateMutation.mutate({ ...task, id: selectedTask.id });
    } else {
      createMutation.mutate(task);
    }
  };

  const handleConfirmDelete = () => {
    if (taskToDelete !== null) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 pb-24">
      <TaskList
        tasks={tasks}
        onComplete={handleTaskComplete}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        filters={filters}
        sortOrder={sortOrder}
      />

      <AddTaskButton onClick={handleAddTask} />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />

      <Toaster />
    </div>
  );
}
