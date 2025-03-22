import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, CheckCircle, Flag, List } from "lucide-react";

export type FilterType = "all" | "today" | "upcoming" | "completed" | "high";

interface TaskFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <List className="h-4 w-4" /> },
    { id: "today", label: "Today", icon: <CalendarCheck className="h-4 w-4" /> },
    { id: "upcoming", label: "Upcoming", icon: <Calendar className="h-4 w-4" /> },
    { id: "completed", label: "Completed", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "high", label: "High Priority", icon: <Flag className="h-4 w-4 text-gray-800" /> },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          size="sm"
          variant={activeFilter === filter.id ? "default" : "ghost"}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${
            activeFilter === filter.id ? "" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
};


// Added TaskItem component to implement styling requirements
const TaskItem = ({ task }) => {
  const priorityColor =
    task.priority === "high"
      ? "bg-blue-700 text-white"
      : task.priority === "medium"
      ? "bg-blue-500 text-white"
      : "bg-blue-300 text-white";

  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 ${priorityColor} flex items-center justify-between`}
      style={{
        background: `linear-gradient(to right, ${
          task.priority === "low"
            ? "#ADD8E6"
            : task.priority === "medium"
            ? "#64B5F6"
            : "#2196F3"
        }, ${
          task.priority === "low"
            ? "#B0E0E6"
            : task.priority === "medium"
            ? "#90CAF9"
            : "#1976D2"
        })`,
      }}
    >
      <div>
        <p
          style={{
            textDecoration: task.status === "Closed" ? "line-through" : "none",
          }}
          className="text-gray-800 font-medium"
        >
          {task.title}
        </p>
        <p className="text-gray-600 text-sm">{task.description}</p>
      </div>
      <div className="text-gray-600">
        <span className="font-medium">{task.dueDate}</span>
      </div>
    </div>
  );
};

export default TaskItem;