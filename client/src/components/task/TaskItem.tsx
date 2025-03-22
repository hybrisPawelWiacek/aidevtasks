import React from "react";
import { format } from "date-fns";
import { Task } from "../../../shared/schema";
import { formatDateRelative } from "@/lib/dateUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Calendar } from "lucide-react";
import { TaskContextMenu } from "./TaskContextMenu";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onComplete, onEdit, onDelete }: TaskItemProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onComplete(task.id, checked);
  };

  return (
    <div className="task-item">
      <div className={cn("priority-circle", `priority-${task.priority}`, { "completed": task.completed })}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleCheckboxChange}
          className="opacity-0 absolute"
          id={`task-${task.id}`}
        />
        <div className="w-4 h-4 rounded-full bg-transparent"></div>
      </div>

      <div className="task-content">
        <div className={cn("task-title", { "completed": task.completed })}>
          {task.title}
        </div>

        <div className="task-meta">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">
            {formatDateRelative(new Date(task.dueDate))}
          </span>

          {task.category && (
            <>
              <span className="text-gray-400">•</span>
              <span className="task-category">{task.category}</span>
            </>
          )}

          {task.tags && task.tags.length > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-gray-500">#{task.tags[0]}</span>
            </>
          )}
        </div>
      </div>

      <TaskContextMenu task={task} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete}>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </TaskContextMenu>
    </div>
  );
}