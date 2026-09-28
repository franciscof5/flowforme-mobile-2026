import { useEffect } from 'react';

import { recoverPendingRecording } from '@/camera/recordings';

/**
 * Runs once per signed-in user to finalize a take that was interrupted by a
 * crash or a kill, so the captured file still shows up in Originais.
 */
export function useRecordingRecovery(username: string | undefined): void {
  useEffect(() => {
    if (!username) return;
    recoverPendingRecording(username).catch(() => {
      // Recovery is best-effort; ignore failures.
    });
  }, [username]);
}
