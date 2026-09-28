import type { VideoObject } from '@/types/video';

const SAMPLE_BASE =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

/**
 * Fake data already shaped like the final API response.
 * Each entry represents one object stored in the bucket. Edited files are the
 * ones whose name ends with `EDITED_SUFFIX` (`-sultano.mp4`).
 */
export const MOCK_VIDEOS: VideoObject[] = [
  {
    key: 'sultano-videos/2026-09-25-vlog-praia.mp4',
    name: '2026-09-25-vlog-praia.mp4',
    size: 184_320_512,
    lastModified: '2026-09-25T18:42:10.000Z',
    url: `${SAMPLE_BASE}BigBuckBunny.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-25-vlog-praia-sultano.mp4',
    name: '2026-09-25-vlog-praia-sultano.mp4',
    size: 96_468_992,
    lastModified: '2026-09-26T09:15:44.000Z',
    url: `${SAMPLE_BASE}BigBuckBunny.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-21-receita-francisco.mp4',
    name: '2026-09-21-receita-francisco.mp4',
    size: 212_860_928,
    lastModified: '2026-09-21T14:03:27.000Z',
    url: `${SAMPLE_BASE}ElephantsDream.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-18-entrevista-itape.mp4',
    name: '2026-09-18-entrevista-itape.mp4',
    size: 341_835_776,
    lastModified: '2026-09-18T20:11:02.000Z',
    url: `${SAMPLE_BASE}ForBiggerBlazes.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-18-entrevista-itape-sultano.mp4',
    name: '2026-09-18-entrevista-itape-sultano.mp4',
    size: 128_974_848,
    lastModified: '2026-09-19T08:47:31.000Z',
    url: `${SAMPLE_BASE}ForBiggerBlazes.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-12-podcast-corte.mp4',
    name: '2026-09-12-podcast-corte.mp4',
    size: 498_073_600,
    lastModified: '2026-09-12T22:35:55.000Z',
    url: `${SAMPLE_BASE}ForBiggerEscapes.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-12-podcast-corte-sultano.mp4',
    name: '2026-09-12-podcast-corte-sultano.mp4',
    size: 74_448_896,
    lastModified: '2026-09-13T10:22:18.000Z',
    url: `${SAMPLE_BASE}ForBiggerEscapes.mp4`,
  },
  {
    key: 'sultano-videos/2026-09-05-moto-estrada.mp4',
    name: '2026-09-05-moto-estrada.mp4',
    size: 267_386_880,
    lastModified: '2026-09-05T16:58:40.000Z',
    url: `${SAMPLE_BASE}ForBiggerFun.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-30-bastidores-eventos.mp4',
    name: '2026-08-30-bastidores-eventos.mp4',
    size: 156_237_824,
    lastModified: '2026-08-30T11:19:09.000Z',
    url: `${SAMPLE_BASE}ForBiggerJoyrides.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-30-bastidores-eventos-sultano.mp4',
    name: '2026-08-30-bastidores-eventos-sultano.mp4',
    size: 58_720_256,
    lastModified: '2026-08-31T07:04:52.000Z',
    url: `${SAMPLE_BASE}ForBiggerJoyrides.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-24-curiosidades-italia.mp4',
    name: '2026-08-24-curiosidades-italia.mp4',
    size: 389_021_696,
    lastModified: '2026-08-24T19:33:14.000Z',
    url: `${SAMPLE_BASE}ForBiggerMeltdowns.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-20-vlog-agencia.mp4',
    name: '2026-08-20-vlog-agencia.mp4',
    size: 143_654_912,
    lastModified: '2026-08-20T13:27:36.000Z',
    url: `${SAMPLE_BASE}Sintel.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-20-vlog-agencia-sultano.mp4',
    name: '2026-08-20-vlog-agencia-sultano.mp4',
    size: 62_914_560,
    lastModified: '2026-08-21T09:41:03.000Z',
    url: `${SAMPLE_BASE}Sintel.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-15-standup-chico.mp4',
    name: '2026-08-15-standup-chico.mp4',
    size: 720_371_712,
    lastModified: '2026-08-15T23:52:47.000Z',
    url: `${SAMPLE_BASE}TearsOfSteel.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-15-standup-chico-sultano.mp4',
    name: '2026-08-15-standup-chico-sultano.mp4',
    size: 104_857_600,
    lastModified: '2026-08-16T18:06:29.000Z',
    url: `${SAMPLE_BASE}TearsOfSteel.mp4`,
  },
  {
    key: 'sultano-videos/2026-08-10-teaser-2026-sultano.mp4',
    name: '2026-08-10-teaser-2026-sultano.mp4',
    size: 34_603_008,
    lastModified: '2026-08-10T12:00:00.000Z',
    url: `${SAMPLE_BASE}VolkswagenGTIReview.mp4`,
  },
];
