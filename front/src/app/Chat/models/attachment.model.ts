export type AttachmentType = 'IMAGE' | 'PDF';

export interface Attachment {
  attachmentId: number;
  fileName: string;
  fileUrl: string;
  type: AttachmentType;
  uploadedAt: string;
}