import { useCallback, useState } from 'react';

import { buildVideoKey, uploadVideo, type UploadFile } from '@/api';
import { useAuth } from '@/context/auth';
import type { PendingUpload } from '@/types/video';

interface UseVideoUploadResult {
  pending: PendingUpload[];
  isUploading: boolean;
  startUpload: (file: UploadFile) => Promise<void>;
  dismiss: (key: string) => void;
}

/**
 * Drives the simulated upload flow from the UI: keeps a pending row per upload
 * with 0-100% progress, marks it sent when finished and exposes retryable
 * errors. The item shows up in the list as soon as the upload is registered.
 */
export function useVideoUpload(): UseVideoUploadResult {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const patch = useCallback(
    (key: string, update: Partial<PendingUpload>) => {
      setPending((current) =>
        current.map((item) =>
          item.key === key ? { ...item, ...update } : item,
        ),
      );
    },
    [],
  );

  const startUpload = useCallback(
    async (file: UploadFile) => {
      if (!user) return;

      const key = buildVideoKey(user.username);
      setPending((current) => [
        ...current,
        {
          key,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading',
        },
      ]);

      try {
        await uploadVideo(
          { bucket: user.bucket, username: user.username },
          file,
          {
            key,
            onProgress: (progress) => patch(key, { progress }),
          },
        );
        patch(key, { progress: 100, status: 'done' });
      } catch (error) {
        patch(key, {
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Falha ao enviar o vídeo.',
        });
      }
    },
    [user, patch],
  );

  const dismiss = useCallback((key: string) => {
    setPending((current) => current.filter((item) => item.key !== key));
  }, []);

  return {
    pending,
    isUploading: pending.some((item) => item.status === 'uploading'),
    startUpload,
    dismiss,
  };
}
