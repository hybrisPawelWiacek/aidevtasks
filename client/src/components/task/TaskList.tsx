import React, { useMemo } from "react";
import { Task } from "../../../shared/schema";
import { TaskItem } from "./TaskItem";
import { format, isSameDay, isToday, isPast, addDays, startOfDay } from "date-fns";
import { ChevronDown } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  showReschedule?: boolean; // Added showReschedule prop
}

export function TaskList({ 
  tasks, 
  onComplete, 
  onEdit, 
  onDelete,
  filters, 
  sortOrder 
}: TaskListProps) {
  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters) {
      if (filters.status === "active") {
        result = result.filter(task => !task.completed);
      } else if (filters.status === "completed") {
        result = result.filter(task => task.completed);
      }

      if (filters.priority && filters.priority.length > 0) {
        result = result.filter(task => filters.priority?.includes(task.priority));
      }

      if (filters.category && filters.category.length > 0) {
        result = result.filter(task => filters.category?.includes(task.category));
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(task => 
          task.title.toLowerCase().includes(searchLower) || 
          task.description?.toLowerCase().includes(searchLower) ||
          task.category?.toLowerCase().includes(searchLower)
        );
      }
    }

    return result;
  }, [tasks, filters]);

  // Apply sorting
  const sortedTasks = useMemo(() => {
    if (!sortOrder) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch(sortOrder.field) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "priority": {
          const priorityMap = { "high": 0, "medium": 1, "low": 2 };
          comparison = (priorityMap[a.priority as keyof typeof priorityMap] || 0) - 
                       (priorityMap[b.priority as keyof typeof priorityMap] || 0);
          break;
        }
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredTasks, sortOrder]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const overdue = sortedTasks.filter(task => !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));
    const todayTasks = sortedTasks.filter(task => isToday(new Date(task.dueDate)));
    const tomorrowTasks = sortedTasks.filter(task => isSameDay(new Date(task.dueDate), tomorrow));
    const futureTasks = sortedTasks.filter(task => 
      !isToday(new Date(task.dueDate)) && 
      !isSameDay(new Date(task.dueDate), tomorrow) && 
      new Date(task.dueDate) > today
    );

    // Group future tasks by date
    const futureGrouped: Record<string, Task[]> = {};
    futureTasks.forEach(task => {
      const dateKey = format(new Date(task.dueDate), "MMM dd - EEEE");
      if (!futureGrouped[dateKey]) {
        futureGrouped[dateKey] = [];
      }
      futureGrouped[dateKey].push(task);
    });

    return { overdue, today: todayTasks, tomorrow: tomorrowTasks, future: futureGrouped };
  }, [sortedTasks]);

  if (sortedTasks.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <p>No tasks found</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Today header */}
      <h1 className="text-3xl font-bold pt-4 pb-6">Today</h1>

      {/* Overdue tasks */}
      {groupedTasks.overdue.length > 0 && (
        <>
          <div className="overdue-header">
            <h2 className="overdue-title">Overdue</h2>
            <button className="text-rose-500 text-sm font-medium flex items-center"> {/* Added Reschedule button */}
              Reschedule <ChevronDown className="ml-1 w-4 h-4" />
            </button>
          </div>
          {groupedTasks.overdue.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={onComplete} 
              onEdit={onEdit} 
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {/* Today's tasks */}
      {groupedTasks.today.length > 0 && (
        <>
          {groupedTasks.overdue.length > 0 && <h2 className="text-base font-semibold pt-4 pb-2">Today</h2>}
          {groupedTasks.today.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={onComplete} 
              onEdit={onEdit} 
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {/* Tomorrow's tasks */}
      {groupedTasks.tomorrow.length > 0 && (
        <>
          <h2 className="date-header">Tomorrow</h2>
          {groupedTasks.tomorrow.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={onComplete} 
              onEdit={onEdit} 
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {/* Future tasks grouped by date */}
      {Object.entries(groupedTasks.future).map(([dateKey, dateTasks]) => (
        <React.Fragment key={dateKey}>
          <h2 className="date-header">{dateKey}</h2>
          {dateTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={onComplete} 
              onEdit={onEdit} 
              onDelete={onDelete}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}