import { getPreferenceValues } from "@raycast/api";

const BASE = "https://writethingsdown.com/api/v1";
export const WEB = "https://writethingsdown.com";

export function authHeaders(): Record<string, string> {
  const { apiKey } = getPreferenceValues<Preferences>();
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/** GET/POST/PATCH/DELETE against the Twos public API, throwing the API's error message. */
export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    let message = `Twos API error (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface TwosList {
  id: string;
  title: string;
  emoji: string;
}

export interface TwosThing {
  id: string;
  list_id: string | null;
  text: string;
  type: "todo" | "note" | "dash" | "number" | "bullet" | string;
  url: string;
  tags: string[];
  completed: boolean;
  created?: string;
  updated?: string;
}

export const listWebUrl = (listId?: string | null) => (listId ? `${WEB}/list/${listId}` : `${WEB}/lists`);

// Deep-link URL for the Twos desktop app. The Electron main process
// registers `twos://` as a protocol handler (see apps/desktop/electron/
// main.js handleDeepLink) and routes `twos://list/<id>` — plus the
// optional ?scrollToThing=<id> hint — straight to the main window.
// Opening one of these when the desktop app ISN'T installed shows a
// macOS "no app registered for this URL" dialog, which is why the
// "Open in Twos App" action is gated behind the preferDesktopApp
// preference. Users who don't have it never see it.
export const listDeepLink = (listId?: string | null, thingId?: string | null) => {
  if (!listId) return "twos://";
  const base = `twos://list/${encodeURIComponent(listId)}`;
  return thingId ? `${base}?scrollToThing=${encodeURIComponent(thingId)}` : base;
};
