// src/renderer/services/notificationService.ts

import React from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  progress?: number; // Para descargas
  showProgress?: boolean;
  createdAt: Date;
  onDismiss?: () => void;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(notifications: Notification[]) {
    for (const listener of this.listeners) {
      listener(notifications);
    }
  }

  show(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      onDismiss: () => {
        this.dismiss(id);
      }
    };

    this.notifications = [newNotification, ...this.notifications];
    this.notify(this.notifications);
    
    // Auto-dismiss after 5 seconds for non-progress notifications
    if (!notification.showProgress && notification.type !== 'error') {
      setTimeout(() => {
        this.dismiss(id);
      }, 5000);
    }

    return id;
  }

  updateProgress(id: string, progress: number, message?: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        progress,
        message: message || this.notifications[index].message
      };
      this.notify(this.notifications);
    }
  }

  // Método para actualizar el tipo de notificación (por ejemplo de info a error o success)
  updateType(id: string, type: 'info' | 'success' | 'warning' | 'error') {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        type
      };
      this.notify(this.notifications);
    }
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify(this.notifications);
  }

  clearAll() {
    this.notifications = [];
    this.notify(this.notifications);
  }

  getAll() {
    return this.notifications;
  }

  // Métodos helper para facilitar el uso
  success(message: string, title: string = 'Éxito') {
    return this.show({
      title,
      message,
      type: 'success'
    });
  }

  error(message: string, title: string = 'Error') {
    return this.show({
      title,
      message,
      type: 'error'
    });
  }

  info(message: string, title: string = 'Información') {
    return this.show({
      title,
      message,
      type: 'info'
    });
  }

  warning(message: string, title: string = 'Advertencia') {
    return this.show({
      title,
      message,
      type: 'warning'
    });
  }
}

export const notificationService = new NotificationService();