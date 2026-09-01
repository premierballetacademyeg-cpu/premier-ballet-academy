export const compactRegistrationPath = "/join";

export function compactParentUpdatePath(token: string) {
  return `/p/${encodeURIComponent(token)}`;
}

export function guardianFirstName(guardianName?: string | null) {
  const ignoredPrefix = new Set([
    "mr",
    "mrs",
    "ms",
    "miss",
    "dr",
    "el",
    "al",
    "the",
  ]);
  const words = (guardianName ?? "")
    .trim()
    .split(/\s+/)
    .map(word => word.replace(/^[.,!?'"()\-]+|[.,!?'"()\-]+$/g, ""))
    .filter(Boolean);
  return (
    words.find(
      word => word.length > 1 && !ignoredPrefix.has(word.toLowerCase())
    ) ?? "Parent"
  );
}

export function parentUpdateTokenFromLocation(
  search: string,
  pathname: string
) {
  const queryToken = new URLSearchParams(search).get("token");
  if (queryToken) return queryToken;
  const pathMatch = /^\/p\/([^/]+)$/.exec(pathname);
  return pathMatch ? decodeURIComponent(pathMatch[1]) : "";
}
