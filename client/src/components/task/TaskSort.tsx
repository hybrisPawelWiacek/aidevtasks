import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ListOrdered, Calendar, Flag, SortAsc } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "default" | "date-asc" | "date-desc" | "priority" | "alphabetical";

interface TaskSortProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const TaskSort: React.FC<TaskSortProps> = ({
  sortOption,
  onSortChange,
}) => {
  const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
    { id: "default", label: "Default", icon: <ListOrdered className="h-4 w-4" /> },
    { id: "date-asc", label: "Date (Oldest)", icon: <Calendar className="h-4 w-4" /> },
    { id: "date-desc", label: "Date (Newest)", icon: <Calendar className="h-4 w-4" /> },
    { id: "priority", label: "Priority", icon: <Flag className="h-4 w-4" /> },
    { id: "alphabetical", label: "Alphabetical", icon: <SortAsc className="h-4 w-4" /> },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100">
          <ListOrdered className="h-4 w-4" />
          Sort
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem 
            key={option.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onSortChange(option.id)}
          >
            {option.icon}
            {option.label}
            {sortOption === option.id && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
