import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InsertTask, Task, taskValidationSchema } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  task?: Task;
  onSave: (task: InsertTask) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { label: "ML Fundamentals", value: "ML Fundamentals" },
  { label: "Programming", value: "Programming" },
  { label: "NLP", value: "NLP" },
  { label: "Computer Vision", value: "Computer Vision" },
  { label: "Infrastructure", value: "Infrastructure" },
  { label: "Projects", value: "Projects" },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  onSave,
  onClose,
}) => {
  const isEditing = !!task;
  
  const form = useForm<InsertTask>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      contentLink: task?.contentLink || "",
      contentType: task?.contentType || "",
      dueDate: task?.dueDate || new Date().toISOString().split("T")[0],
      priority: task?.priority as "low" | "medium" | "high" || "medium",
      category: task?.category || "none",
      completed: task?.completed || false,
      userId: task?.userId || 0,
    },
  });

  // Update form when editing a different task
  useEffect(() => {
    if (isOpen && task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        contentLink: task.contentLink || "",
        contentType: task.contentType || "",
        dueDate: task.dueDate,
        priority: task.priority as "low" | "medium" | "high",
        category: task.category || "none",
        completed: task.completed,
        userId: task.userId,
      });
    } else if (isOpen && !task) {
      form.reset({
        title: "",
        description: "",
        contentLink: "",
        contentType: "",
        dueDate: new Date().toISOString().split("T")[0],
        priority: "medium",
        category: "none",
        completed: false,
        userId: 0, // Will be set on the server
      });
    }
  }, [form, isOpen, task]);

  const onSubmit = (data: InsertTask) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="What do you need to do?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details about this task..." 
                      {...field} 
                      value={field.value || ''}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Link</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Add a link to a YouTube video or web article..." 
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        
                        // Auto-detect content type
                        const url = e.target.value;
                        let contentType = "";
                        if (url) {
                          if (url.includes("youtube.com") || url.includes("youtu.be")) {
                            contentType = "youtube";
                          } else if (url.startsWith("http")) {
                            contentType = "article";
                          }
                          form.setValue("contentType", contentType);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value ? field.value : 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" className="text-success border-success" />
                        <Label htmlFor="low" className="text-sm text-gray-700">Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" className="text-warning border-warning" />
                        <Label htmlFor="medium" className="text-sm text-gray-700">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" className="text-destructive border-destructive" />
                        <Label htmlFor="high" className="text-sm text-gray-700">High</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
