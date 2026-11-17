
export interface Conversation {
  conversationId: number;
  otherParticipantName: string;
  otherParticipantProfileImageUrl: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
}
