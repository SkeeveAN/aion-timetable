export interface Comment {
  id: number;
  scheduleEventId: number | null;
  killRecordId: number | null;
  authorMemberId: number;
  authorDisplayName: string;
  body: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  scheduleEventId?: number;
  killRecordId?: number;
  body: string;
}
