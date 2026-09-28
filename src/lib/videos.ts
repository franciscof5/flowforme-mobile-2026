import { EDITED_SUFFIX } from '@/constants/config';
import type { VideoObject } from '@/types/video';

export function isEdited(video: VideoObject): boolean {
  return video.name.toLowerCase().endsWith(EDITED_SUFFIX);
}

/** `foo-sultano.mp4` -> `foo.mp4` */
export function originalNameFor(editedName: string): string {
  return `${editedName.slice(0, -EDITED_SUFFIX.length)}.mp4`;
}

export function sortByLastModified(videos: VideoObject[]): VideoObject[] {
  return [...videos].sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );
}

export function selectOriginals(videos: VideoObject[]): VideoObject[] {
  return sortByLastModified(videos.filter((video) => !isEdited(video)));
}

export function selectEdited(videos: VideoObject[]): VideoObject[] {
  return sortByLastModified(videos.filter(isEdited));
}

/** Names of every edited file, used to flag originals that already have a pair. */
export function editedNames(videos: VideoObject[]): Set<string> {
  return new Set(videos.filter(isEdited).map((video) => video.name));
}

export function hasEditedPair(
  videos: VideoObject[],
  original: VideoObject,
): boolean {
  return editedNames(videos).has(originalNameFor(original.name));
}
