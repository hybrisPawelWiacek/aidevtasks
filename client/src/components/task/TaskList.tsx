import React, { useMemo } from "react";
import { Task } from "../../../shared/schema";
import { TaskItem } from "./TaskItem";
import { format, isSameDay, isToday, isPast, addDays, startOfDay } from "date-fns";
import { ChevronDown } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onCompleteTask: (id: number, completed: boolean) => void;
}

export function TaskList({ tasks, onEditTask, onDeleteTask, onCompleteTask }: TaskListProps) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const groupedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const tomorrowTasks: Task[] = [];
    const thisWeekTasks: Task[] = [];
    const laterTasks: Task[] = [];
    const noDateTasks: Task[] = [];

    tasks.forEach((task) => {
      if (!task.dueDate) {
        noDateTasks.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);

      if (isPast(dueDate) && !isToday(dueDate) && !task.completed) {
        overdue.push(task);
      } else if (isToday(dueDate)) {
        todayTasks.push(task);
      } else if (isSameDay(dueDate, tomorrow)) {
        tomorrowTasks.push(task);
      } else if (dueDate < nextWeek) {
        thisWeekTasks.push(task);
      } else {
        laterTasks.push(task);
      }
    });

    return {
      overdue,
      today: todayTasks,
      tomorrow: tomorrowTasks,
      thisWeek: thisWeekTasks,
      later: laterTasks,
      noDate: noDateTasks,
    };
  }, [tasks, today, tomorrow, nextWeek]);

  const sections = [
    { id: "overdue", title: "Overdue", tasks: groupedTasks.overdue },
    { id: "today", title: "Today", tasks: groupedTasks.today },
    { id: "tomorrow", title: "Tomorrow", tasks: groupedTasks.tomorrow },
    { id: "thisWeek", title: "This Week", tasks: groupedTasks.thisWeek },
    { id: "later", title: "Later", tasks: groupedTasks.later },
    { id: "noDate", title: "No Date", tasks: groupedTasks.noDate },
  ];

  return (
    <div className="space-y-6">
      {sections
        .filter((section) => section.tasks.length > 0)
        .map((section) => (
          <div key={section.id}>
            <div className="flex items-center gap-2 pb-2 mb-2 border-b">
              <h2 className="text-lg font-medium">
                {section.title}{" "}
                <span className="text-sm font-normal text-gray-500">
                  {section.tasks.length}
                </span>
              </h2>
              <button className="p-1 rounded-full hover:bg-gray-100 ml-auto">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {section.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onComplete={onCompleteTask}
                />
              ))}
            </div>
          </div>
        ))}

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}