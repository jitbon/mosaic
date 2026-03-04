import { fetchEventSource } from "@microsoft/fetch-event-source";

export interface SSEOptions<T> {
  url: string;
  body: unknown;
  onEvent: (event: T) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  signal?: AbortSignal;
}

export async function streamSSE<T>({
  url,
  body,
  onEvent,
  onError,
  onClose,
  signal,
}: SSEOptions<T>): Promise<void> {
  try {
    await fetchEventSource(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
      onmessage(ev) {
        if (!ev.data) return;
        try {
          const parsed = JSON.parse(ev.data) as T;
          onEvent(parsed);
        } catch {
          // ignore malformed events
        }
      },
      onerror(err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
        throw err; // stop retrying
      },
      onclose() {
        onClose?.();
      },
    });
  } catch (err) {
    if (signal?.aborted) return;
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
