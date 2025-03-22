
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Task } from "../../../shared/schema";

interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number, completed: boolean) => void;
}

export function TaskContextMenu({ 
  task, 
  children, 
  onEdit, 
  onDelete, 
  onComplete 
}: TaskContextMenuProps) {
  const handleComplete = () => {
    if (typeof onComplete === 'function') {
      onComplete(task.id, !task.completed);
    } else {
      console.error("onComplete is not a function", onComplete);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit(task)} className="flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleComplete} 
          className="flex items-center gap-2"
        >
          {task.completed ? (
            <>
              <XCircle className="w-4 h-4" />
              <span>Mark as incomplete</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Mark as complete</span>
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onDelete(task.id)} 
          className="flex items-center gap-2 text-red-500"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
