import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Check, AlertTriangle, Target, TrendingUp, Trash2, CreditCard, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { NotificationService } from "./NotificationService";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Notification.filter(
        { created_by: user.email },
        '-created_date',
        50
      );
    },
    refetchInterval: false, // Disable auto refetch - only manual refresh
    staleTime: Infinity, // Never mark as stale automatically
    initialData: [],
  });

  useEffect(() => {
    NotificationService.checkUpcomingRenewal();
  }, []);

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.update(id, { is_read: true });
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => 
        old?.map(n => n.id === id ? { ...n, is_read: true } : n) || []
      );
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
    onSuccess: () => {
      // Don't refetch - keep optimistic update
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const currentNotifications = queryClient.getQueryData(['notifications']) || [];
      const unread = currentNotifications.filter(n => !n.is_read);
      if (unread.length === 0) return;
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => 
        old?.map(n => ({ ...n, is_read: true })) || []
      );
      return { previousNotifications };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
    onSuccess: () => {
      // Don't refetch - keep optimistic update
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => 
        old?.filter(n => n.id !== id) || []
      );
      return { previousNotifications, deletedId: id };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
    onSuccess: (_, __, context) => {
      // Don't refetch - keep optimistic update
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const currentNotifications = queryClient.getQueryData(['notifications']) || [];
      if (currentNotifications.length === 0) return [];
      const ids = currentNotifications.map(n => n.id);
      await Promise.all(ids.map(id => base44.entities.Notification.delete(id)));
      return ids;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], []);
      return { previousNotifications };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
    onSuccess: () => {
      // Don't refetch - keep optimistic update (empty array)
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'goal': return Target;
      case 'success': return Check;
      case 'info': return TrendingUp;
      case 'insight': return Sparkles; // AI insights
      case 'subscription': return Sparkles;
      case 'payment': return CreditCard;
      default: return Bell;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'goal': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'success': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'info': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'insight': return 'text-violet-600 bg-violet-50 dark:bg-violet-900/20'; // AI insights
      case 'subscription': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
      case 'payment': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };
  
  // Group notifications by category
  const groupedNotifications = React.useMemo(() => {
    const groups = {
      insight: { label: 'תובנות AI', items: [] },
      alert: { label: 'התראות', items: [] },
      other: { label: 'עדכונים', items: [] }
    };
    
    notifications.forEach(n => {
      if (n.type === 'insight' || n.type === 'info') {
        groups.insight.items.push(n);
      } else if (n.type === 'warning' || n.priority === 'high') {
        groups.alert.items.push(n);
      } else {
        groups.other.items.push(n);
      }
    });
    
    return groups;
  }, [notifications]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="התראות"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-h-[70vh] sm:max-h-[600px] shadow-2xl mx-auto sm:mx-0 max-w-md rounded-2xl dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="border-b dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold dark:text-white">התראות</CardTitle>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="text-xs h-8 px-2"
                      >
                        סמן הכל
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => clearAllMutation.mutate()}
                        disabled={clearAllMutation.isPending}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[55vh] sm:max-h-[500px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">אין התראות חדשות</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => {
                      const Icon = getIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColor(notification.type)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">דחוף</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {format(new Date(notification.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  className="h-8 w-8"
                                  disabled={markAsReadMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                className="h-8 w-8"
                                disabled={deleteNotificationMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}