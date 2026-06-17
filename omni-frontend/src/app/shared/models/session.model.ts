export interface Session {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}
