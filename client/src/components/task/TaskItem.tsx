
import React from "react";
import { format } from "date-fns";
import { Task } from "../../../shared/schema";
import { formatDateRelative } from "@/lib/dateUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Calendar } from "lucide-react";
import { TaskContextMenu } from "./TaskContextMenu";
import { cn } from "@/lib/utils";

export interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number, completed: boolean) => void;
}

export function TaskItem({ task, onEdit, onDelete, onComplete }: TaskItemProps) {
  const priorityClass = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-orange-100 text-orange-800",
    high: "bg-red-100 text-red-800",
  }[task.priority || "medium"];

  return (
    <TaskContextMenu task={task} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete}>
      <div className="group flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow">
        <div className="mt-0.5">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
            className="mt-0.5"
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-medium text-gray-900 break-words",
                task.completed && "line-through text-gray-500"
              )}
            >
              {task.title}
            </h3>
            <div className="flex items-center mt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={cn(
                "text-sm text-gray-500 mt-1 break-words",
                task.completed && "line-through"
              )}
            >
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDateRelative(task.dueDate)}</span>
              </div>
            )}
            {task.priority && (
              <div className={`text-xs px-2 py-0.5 rounded-full ${priorityClass}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </div>
            )}
            {task.category && task.category !== "none" && (
              <div className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {task.category}
              </div>
            )}
          </div>
        </div>
      </div>
    </TaskContextMenu>
  );
}
