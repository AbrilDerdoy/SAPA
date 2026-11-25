
import { Attachment } from './attachment.model';

export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM';

export interface Message {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  type: MessageType;
  attachments: Attachment[];
  sentAt: string;
  medicalRecordMovementId?: number | null;
  medicalRecordMovementTitle?: string | null;
}

export interface SendMessageRequest {
  content: string;
  type: MessageType;
  medicalRecordMovementId?: number | null;
}
