// Service-worker route matchers. Workbox serialises these into dist/sw.js, so each must be self-contained.
type Match = { url: URL; sameOrigin: boolean }

/** Recitation audio. Must come before the data route: everyayah URLs also contain /data/ (review B1). */
export const isAudio = ({ url }: Match) => url.hostname === 'everyayah.com'
/** Our own Quran text JSON (public/data/). */
export const isQuranData = ({ url, sameOrigin }: Match) => sameOrigin && url.pathname.includes('/data/')
export const isFont = ({ url }: Match) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
