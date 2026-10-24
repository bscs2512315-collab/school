export interface NotificationMetadata {
  classroomId?: string;
  subject?: string;
  classLevel?: string;
  teacherId?: string;
  teacherName?: string;
  visibility?: "school" | "private";
  status?: string;
  action?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  metadata?: NotificationMetadata | null;
  createdAt: string;
}

export interface NotificationsListData {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
