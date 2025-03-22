
import React from "react";
import { Plus } from "lucide-react";

interface AddTaskButtonProps {
  onClick: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <button
      onClick={onClick}
      className="add-task-button"
      aria-label="Add new task"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
