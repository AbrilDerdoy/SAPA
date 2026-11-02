export type NotificationType =
  | 'SYSTEM'
  | 'MESSAGE'
  | 'REMINDER'
  | 'FOLLOW'
  | 'QUESTIONNAIRE';

export interface NotificationResponse {
  notificationId: number;
  title: string;
  msg: string;
  type: NotificationType;
  readed: boolean;
  createdAt: string;
}
