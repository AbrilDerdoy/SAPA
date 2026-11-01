export interface Conversation {
  conversationId: number;
  otherParticipantName: string;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
}