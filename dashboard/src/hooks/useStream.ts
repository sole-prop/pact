import { useEffect, useState, useRef } from "react";
import { StreamUpdate } from "@/types/pact";

interface UseStreamOptions {
  onComplete?: () => void;
  onError?: (error: any) => void;
}

export function useStream(options?: UseStreamOptions) {
  const [data, setData] = useState<StreamUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const onCompleteRef = useRef(options?.onComplete);
  const onErrorRef = useRef(options?.onError);

  // Keep refs up-to-date to avoid re-triggering effects
  useEffect(() => {
    onCompleteRef.current = options?.onComplete;
    onErrorRef.current = options?.onError;
  }, [options?.onComplete, options?.onError]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      if (eventSource) return;

      // EventSource uses relative URL pointing to backend stream progress
      eventSource = new EventSource("/api/backend/api/stats/stream-progress");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: StreamUpdate = JSON.parse(event.data);
          setData(parsed);
          setIsRunning(parsed.running);

          if (!parsed.running && parsed.pct >= 100) {
            onCompleteRef.current?.();
            setIsRunning(false);
            // Close EventSource immediately to prevent server disconnect triggering console error
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          }
        } catch (err) {
          onErrorRef.current?.(err);
        }
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setIsRunning(false);

        // Only log/dispatch error if connection was active and not explicitly closed on complete
        if (eventSource) {
          onErrorRef.current?.(err);
          eventSource.close();
          eventSource = null;
        }

        reconnectTimeout = setTimeout(() => {
          connect();
        }, 2000);
      };
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return {
    data,
    isRunning,
    isConnected,
  };
}
