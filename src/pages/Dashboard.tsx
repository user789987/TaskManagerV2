import { useState } from 'react';
import { Plus, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus } from '@/types/task';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const { role } = useAuth();
  const { tasks, assignedTasks, createdTasks, loading, createTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const isManager = role === 'manager';

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTaskId(id);
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTaskStatus(id, status);
  };

  const handleFormSubmit = async (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    setEditingTask(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {isManager ? 'Manage and assign tasks to your team' : 'View and update your assigned tasks'}
            </p>
          </div>
          
          {isManager && (
            <Button onClick={() => setFormOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Task
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tasks"
            value={tasks.length}
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <StatsCard
            title="To Do"
            value={todoCount}
            icon={<AlertCircle className="h-6 w-6" />}
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatsCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        </div>

        {/* Tasks */}
        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assigned">
              Assigned to Me ({assignedTasks.length})
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="created">
                Created by Me ({createdTasks.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="all">
              All Tasks ({tasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned">
            <TaskList
              tasks={assignedTasks}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              emptyMessage="No tasks assigned to you yet"
            />
          </TabsContent>
          
          {isManager && (
            <TabsContent value="created">
              <TaskList
                tasks={createdTasks}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                emptyMessage="You haven't created any tasks yet"
              />
            </TabsContent>
          )}
          
          <TabsContent value="all">
            <TaskList
              tasks={tasks}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              emptyMessage="No tasks found"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        open={formOpen}
        onOpenChange={handleFormClose}
        task={editingTask}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
