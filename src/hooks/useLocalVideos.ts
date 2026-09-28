import { useEffect, useState } from 'react';

import { listLocalVideos, subscribeLocalVideos } from '@/camera/recordings';
import type { LocalVideoRecord } from '@/types/video';

/**
 * Locally recorded videos for the signed-in user, kept in sync with the
 * persistent store (new recordings and crash recoveries show up immediately).
 */
export function useLocalVideos(
  username: string | undefined,
): LocalVideoRecord[] {
  const [videos, setVideos] = useState<LocalVideoRecord[]>([]);

  useEffect(() => {
    if (!username) return;

    let active = true;
    const load = () => {
      listLocalVideos(username)
        .then((result) => {
          if (active) setVideos(result);
        })
        .catch(() => {
          // Ignore read errors; the list simply stays empty.
        });
    };

    load();
    const unsubscribe = subscribeLocalVideos(load);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [username]);

  return videos;
}
