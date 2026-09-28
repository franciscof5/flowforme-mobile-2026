export interface VideoObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
}

export interface SessionUser {
  username: string;
  bucket: string;
}

export interface Session {
  user: SessionUser;
  token?: string;
}

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface PendingUpload {
  key: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}
