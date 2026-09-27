/**
 * Structured server-side logger for Next.js API proxy routes,
 * authentication events, and backend network calls.
 */

const formatTime = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

export const proxyLog = {
  request: (method: string, url: string) => {
    console.log(`\x1b[36m[${formatTime()}] [Proxy ->]\x1b[0m ${method.toUpperCase()} ${url}`);
  },

  response: (method: string, url: string, status: number, durationMs: number) => {
    const color = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(
      `${color}[${formatTime()}] [Proxy <-]\x1b[0m ${method.toUpperCase()} ${url} -> ${color}${status}\x1b[0m (${durationMs}ms)`
    );
  },

  refresh: (state: "start" | "success" | "fail", details?: string) => {
    if (state === "start") {
      console.log(
        `\x1b[35m[${formatTime()}] [Auth Refresh]\x1b[0m Access token missing/expired. Triggering refresh via refreshToken...`
      );
    } else if (state === "success") {
      console.log(
        `\x1b[32m[${formatTime()}] [Auth Refresh]\x1b[0m Successfully acquired fresh access token. Cookies updated.`
      );
    } else {
      console.warn(
        `\x1b[31m[${formatTime()}] [Auth Refresh]\x1b[0m Refresh failed${details ? `: ${details}` : ""}. Session invalid.`
      );
    }
  },

  error: (method: string, url: string, error: any) => {
    console.error(
      `\x1b[31m[${formatTime()}] [Proxy Error]\x1b[0m ${method.toUpperCase()} ${url} ->`,
      error?.message || error
    );
  },
};
