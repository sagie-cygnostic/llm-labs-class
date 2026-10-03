export function formatTime(at: string): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return at;
  const formatted = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
  return `${formatted} (ישראל)`;
}

/** Same-origin path so the dev server can proxy /lab-app to 127.0.0.1:8787. */
export function absAppUrl(appUrl: string): string {
  if (!appUrl) return "";
  if (/^https?:\/\//i.test(appUrl)) {
    try {
      const url = new URL(appUrl);
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        return `${url.pathname}${url.search}`;
      }
    } catch {
      return appUrl;
    }
    return appUrl;
  }
  return appUrl.startsWith("/") ? appUrl : `/${appUrl}`;
}
