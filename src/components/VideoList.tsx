import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PendingUploadItem } from '@/components/PendingUploadItem';
import { StatusView } from '@/components/StatusView';
import { VideoListItem } from '@/components/VideoListItem';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useLocalVideos } from '@/hooks/useLocalVideos';
import { useVideos } from '@/hooks/useVideos';
import {
  editedNames,
  originalNameFor,
  selectEdited,
  selectOriginals,
} from '@/lib/videos';
import type { PendingUpload, VideoObject } from '@/types/video';

interface VideoListProps {
  mode: 'originals' | 'edited';
  pendingUploads?: PendingUpload[];
  onDismissUpload?: (key: string) => void;
}

type ListRow =
  | { type: 'video'; video: VideoObject }
  | { type: 'pending'; upload: PendingUpload };

export function VideoList({
  mode,
  pendingUploads,
  onDismissUpload,
}: VideoListProps) {
  const { user } = useAuth();
  const { videos, isLoading, isRefreshing, error, refresh, reload } = useVideos(
    user?.bucket,
  );
  const localVideos = useLocalVideos(user?.username);

  // Locally recorded videos live alongside the bucket listing in Originais.
  const allVideos = useMemo(
    () => [...localVideos, ...videos],
    [localVideos, videos],
  );

  const data = useMemo(
    () =>
      mode === 'originals'
        ? selectOriginals(allVideos)
        : selectEdited(allVideos),
    [mode, allVideos],
  );

  const edited = useMemo(() => editedNames(allVideos), [allVideos]);

  // Drop a pending row once the uploaded object shows up in the API list.
  const visiblePending = useMemo(() => {
    if (mode !== 'originals' || !pendingUploads?.length) return [];
    return pendingUploads.filter(
      (upload) => !data.some((video) => video.key === upload.key),
    );
  }, [mode, pendingUploads, data]);

  const rows = useMemo<ListRow[]>(() => {
    const pendingRows: ListRow[] = visiblePending.map((upload) => ({
      type: 'pending',
      upload,
    }));
    const videoRows: ListRow[] = data.map((video) => ({ type: 'video', video }));
    return [...pendingRows, ...videoRows];
  }, [visiblePending, data]);

  const openPlayer = useCallback((video: VideoObject) => {
    router.push({
      pathname: '/player',
      params: { url: video.url, title: video.name },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.type === 'pending') {
        return (
          <PendingUploadItem
            upload={item.upload}
            onDismiss={onDismissUpload ?? (() => {})}
          />
        );
      }
      return (
        <VideoListItem
          video={item.video}
          showEditedBadge={
            mode === 'originals' && edited.has(originalNameFor(item.video.name))
          }
          onPress={openPlayer}
        />
      );
    },
    [mode, edited, openPlayer, onDismissUpload],
  );

  if (isLoading && allVideos.length === 0) {
    return <StatusView kind="loading" />;
  }

  if (error && allVideos.length === 0) {
    return <StatusView kind="error" message={error} onRetry={reload} />;
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) =>
        item.type === 'pending' ? item.upload.key : item.video.key
      }
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={
        rows.length === 0 ? styles.emptyContent : styles.content
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        data.length > 0 ? (
          <Text style={styles.counter}>
            {data.length} {data.length === 1 ? 'vídeo' : 'vídeos'} ·{' '}
            {mode === 'originals' ? 'Originais' : 'Editados'}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <StatusView
          kind="empty"
          title={
            mode === 'originals'
              ? 'Nenhum original encontrado'
              : 'Nenhum editado encontrado'
          }
          message={
            mode === 'originals'
              ? 'Os vídeos enviados para o seu bucket aparecerão aqui.'
              : 'Assim que o Sultano gerar os cortes, eles aparecerão aqui.'
          }
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.textMuted}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 124,
    backgroundColor: colors.border,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
