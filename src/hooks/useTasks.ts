import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching tasks',
        description: error.message,
      });
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating task',
        description: error.message,
      });
      return { error };
    }

    await supabase.from('activity_logs').insert([{
      task_id: data.id,
      user_id: user.id,
      action: 'created',
      new_value: data as any,
    }]);

    toast({
      title: 'Task created',
      description: 'Your task has been created successfully.',
    });

    return { data, error: null };
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const oldTask = tasks.find(t => t.id === id);
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: error.message,
      });
      return { error };
    }

    await supabase.from('activity_logs').insert([{
      task_id: id,
      user_id: user.id,
      action: 'updated',
      old_value: oldTask as any,
      new_value: data as any,
    }]);

    toast({
      title: 'Task updated',
      description: 'Your task has been updated successfully.',
    });

    return { data, error: null };
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    return updateTask(id, { status });
  };

  const deleteTask = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting task',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Task deleted',
      description: 'Your task has been deleted successfully.',
    });

    return { error: null };
  };

  const assignedTasks = tasks.filter(t => t.assigned_to === user?.id);
  const createdTasks = tasks.filter(t => t.created_by === user?.id);

  return {
    tasks,
    assignedTasks,
    createdTasks,
    loading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refetch: fetchTasks,
  };
}
