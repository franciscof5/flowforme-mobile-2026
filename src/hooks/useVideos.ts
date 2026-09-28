import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getFlowApi } from '@/api';
import type { VideoObject } from '@/types/video';

interface UseVideosResult {
  videos: VideoObject[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

function toMessage(err: unknown): string {
  return err instanceof Error
    ? err.message
    : 'Não foi possível carregar os vídeos.';
}

export function useVideos(bucket: string | undefined): UseVideosResult {
  const api = useMemo(() => (bucket ? getFlowApi(bucket) : null), [bucket]);

  const [videos, setVideos] = useState<VideoObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchVideos = useCallback(async () => {
    if (!api) return;
    const id = ++requestId.current;

    try {
      const result = await api.listVideos();
      if (requestId.current !== id) return;
      setVideos(result);
      setError(null);
    } catch (err) {
      if (requestId.current !== id) return;
      setError(toMessage(err));
    } finally {
      if (requestId.current === id) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [api]);

  useEffect(() => {
    if (!api) return;

    let active = true;
    const id = ++requestId.current;

    api
      .listVideos()
      .then((result) => {
        if (!active || requestId.current !== id) return;
        setVideos(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active || requestId.current !== id) return;
        setError(toMessage(err));
      })
      .finally(() => {
        if (!active || requestId.current !== id) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    // The cache notifies when URLs expire or new edits arrive.
    const unsubscribe = api.subscribe(() => {
      void fetchVideos();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [api, fetchVideos]);

  const refresh = useCallback(async () => {
    if (!api) return;
    setIsRefreshing(true);
    api.invalidate();
    await fetchVideos();
  }, [api, fetchVideos]);

  const reload = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    api.invalidate();
    await fetchVideos();
  }, [api, fetchVideos]);

  return { videos, isLoading, isRefreshing, error, refresh, reload };
}
