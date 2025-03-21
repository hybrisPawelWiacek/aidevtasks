import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddTaskButtonProps {
  onClick: () => void;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onClick }) => {
  return (
    <Button 
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20 p-0"
      onClick={onClick}
      aria-label="Add task"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};
