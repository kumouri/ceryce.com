// Post dates are authored as bare `YYYY-MM-DD`, which YAML parses as UTC midnight. Format
// them in UTC too — otherwise a build (or a reader) west of UTC renders the day before.

const postDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Human-readable post date, e.g. "August 9, 2026". */
export const formatPostDate = (date: Date): string => postDate.format(date);

/** Machine-readable `YYYY-MM-DD` for a `<time datetime>` attribute. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
