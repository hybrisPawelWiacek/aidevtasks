import React from "react";
import { Task, PriorityLevel } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Calendar, Edit, Tag, Trash } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const handleToggleComplete = () => {
    onToggleComplete(task.id, !task.completed);
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  const priorityClasses: Record<PriorityLevel, string> = {
    high: "bg-gray-800 text-white",
    medium: "bg-warning bg-opacity-10 text-warning",
    low: "bg-success bg-opacity-10 text-success",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-3">
        {/* Task Checkbox */}
        <button 
          className={cn(
            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-primary-500 flex items-center justify-center",
            task.completed && "bg-primary-500"
          )}
          onClick={handleToggleComplete}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-grow">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={cn(
              "font-medium pr-2",
              task.completed ? "text-gray-600 line-through" : "text-gray-900"
            )}>
              {task.title}
            </h3>

            {/* Priority Tag */}
            <div className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              task.completed ? "bg-gray-100 text-gray-600" : priorityClasses[task.priority as PriorityLevel] || priorityClasses.medium
            )}>
              {task.priority === "high" && "High Priority"}
              {task.priority === "medium" && "Medium Priority"}
              {task.priority === "low" && "Low Priority"}
            </div>
          </div>

          <p className={cn(
            "text-sm mb-3",
            task.completed ? "text-gray-500 line-through" : "text-gray-600"
          )}>
            {task.description}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-y-2">
            {/* Task Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {/* Due Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(task.dueDate)}</span>
              </div>

              {/* Category */}
              {task.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{task.category}</span>
                </div>
              )}
            </div>

            {/* Task Actions */}
            <div className="flex items-center gap-1">
              <button 
                className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full"
                onClick={handleEdit}
                aria-label="Edit task"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-gray-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={handleDelete}
                aria-label="Delete task"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};