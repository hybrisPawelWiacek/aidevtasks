import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "../../../shared/schema";
import { PRIORITY_LEVELS, CATEGORY_OPTIONS } from "@/lib/constants";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  contentLink: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface TaskModalProps {
  isOpen: boolean;
  task?: Task;
  onSave: (task: Partial<Task>) => void;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  onSave,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [userCategories, setUserCategories] = useState<Array<{id: number, name: string}>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!task;
  
  // Fetch user categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserCategories();
    }
  }, [isOpen]);
  
  const fetchUserCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserCategories(data);
      }
    } catch (error) {
      console.error('Error fetching user categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      priority: "medium",
      category: "",
      contentLink: "",
    },
  });

  useEffect(() => {
    if (task) {
      // Convert task to form data
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority || "medium",
        category: task.category || "",
        contentLink: task.contentLink || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: undefined,
        priority: "medium",
        category: "",
        contentLink: "",
      });
    }
  }, [task, form, isOpen]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const taskData: Partial<Task> = {
        ...data,
        id: task?.id,
      };
      await onSave(taskData);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Task" : "Create Task"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
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
                      placeholder="Task description"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
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
                  <FormLabel>Content Link (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a link to relevant content for this task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PRIORITY_LEVELS).map(([value, priority]) => (
                        <SelectItem key={value} value={value}>
                          {priority.label}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {!isAddingCategory ? (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Global Categories</SelectLabel>
                          {CATEGORY_OPTIONS.map((category) => (
                            <SelectItem
                              key={category}
                              value={category.toLowerCase().replace(/\s+/g, "-")}
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Your Categories</SelectLabel>
                          {userCategories.length > 0 ? (
                            userCategories.map((category) => (
                              <SelectItem
                                key={`user-${category.id}`}
                                value={`user-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {isLoadingCategories ? "Loading..." : "No custom categories yet"}
                            </div>
                          )}
                        </SelectGroup>
                        <SelectSeparator />
                        <div
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Forcefully close the select dropdown
                            const selectTrigger = document.querySelector('[id^="radix-"][data-state="open"]');
                            if (selectTrigger) {
                              (selectTrigger as HTMLElement).click();
                            }

                            // Wait for dropdown animation to complete before showing the form
                            setTimeout(() => {
                              setIsAddingCategory(true);
                            }, 150);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add new category
                        </div>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            // Add the new category and select it
                            const newValue = newCategoryName
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, "-");

                            // Update form value
                            field.onChange(newValue);

                            // Create the new category via API
                            const createCategory = async () => {
                              try {
                                const response = await fetch('/api/categories', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({ name: newCategoryName.trim() }),
                                });
                                
                                if (response.ok) {
                                  const newCategory = await response.json();
                                  
                                  // Add the new category to our local state
                                  setUserCategories(prev => [...prev, newCategory]);
                                  
                                  // Select the new category
                                  const categoryValue = `user-${newCategory.name.toLowerCase().replace(/\s+/g, "-")}`;
                                  field.onChange(categoryValue);
                                  
                                  toast({
                                    title: "Category Created",
                                    description: `"${newCategory.name}" has been added to your categories.`,
                                  });
                                } else {
                                  const errorData = await response.json();
                                  throw new Error(errorData.message || 'Failed to create category');
                                }
                              } catch (error) {
                                console.error('Error creating category:', error);
                                toast({
                                  title: "Error",
                                  description: error instanceof Error ? error.message : 'Failed to create category',
                                  variant: "destructive",
                                });
                              } finally {
                                setIsAddingCategory(false);
                                setNewCategoryName("");
                              }
                            };
                            
                            createCategory();
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isEditMode ? (
                  "Update Task"
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};