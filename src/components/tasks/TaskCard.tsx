import { useState } from 'react';
import { Calendar, User, MoreVertical, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-secondary text-secondary-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-warning/20 text-warning-foreground border-warning' },
  completed: { label: 'Completed', className: 'bg-success/20 text-success border-success' },
};

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  2: { label: 'Medium-Low', className: 'bg-secondary text-secondary-foreground' },
  3: { label: 'Medium', className: 'bg-warning/20 text-warning' },
  4: { label: 'High', className: 'bg-destructive/20 text-destructive' },
  5: { label: 'Critical', className: 'bg-destructive text-destructive-foreground' },
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { getProfileById } = useProfiles();
  const { user, role } = useAuth();
  const assignee = getProfileById(task.assigned_to);
  const creator = getProfileById(task.created_by);
  
  const isManager = role === 'manager';
  const isCreator = task.created_by === user?.id;
  const isAssignee = task.assigned_to === user?.id;
  
  const canEdit = isManager && isCreator;
  const canDelete = isManager && isCreator;
  const canChangeStatus = isAssignee || canEdit;

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md",
      task.status === 'completed' && "opacity-75"
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <h3 className={cn(
            "font-semibold leading-none tracking-tight",
            task.status === 'completed' && "line-through"
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        {(canEdit || canDelete || canChangeStatus) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeStatus && task.status !== 'completed' && (
                <>
                  {task.status === 'todo' && (
                    <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark In Progress
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                </>
              )}
              {canChangeStatus && task.status === 'completed' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reopen Task
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusConfig[task.status].className} variant="outline">
            {statusConfig[task.status].label}
          </Badge>
          <Badge className={priorityConfig[task.priority].className} variant="outline">
            P{task.priority}
          </Badge>
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </div>
          )}
          
          {assignee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <User className="h-3 w-3" />
              {assignee.full_name || assignee.email}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
