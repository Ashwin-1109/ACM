import { useEffect, useState } from 'react';

interface RealtimeHookOptions {
  onScoreUpdated?: (data: unknown) => void;
  onRoundChanged?: (data: unknown) => void;
  onWinnersPublished?: (data: unknown) => void;
  onRegistrationCreated?: (data: unknown) => void;
  onSettingsUpdated?: (data: unknown) => void;
  onTeamDeleted?: (data: unknown) => void;
  onDatabaseReset?: (data: unknown) => void;
}

export function useRealtime(options: RealtimeHookOptions = {}) {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastEventTime, setLastEventTime] = useState<number>(Date.now());

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/events/stream');

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.addEventListener('connected', () => {
          setConnected(true);
        });

        eventSource.addEventListener('SCORE_UPDATED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onScoreUpdated?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('ROUND_CHANGED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onRoundChanged?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('WINNERS_PUBLISHED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onWinnersPublished?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('REGISTRATION_CREATED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onRegistrationCreated?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('TEAM_DELETED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onTeamDeleted?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('DATABASE_RESET', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onDatabaseReset?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('SETTINGS_UPDATED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEventTime(Date.now());
            options.onSettingsUpdated?.(data);
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.onerror = () => {
          setConnected(false);
          eventSource?.close();
          eventSource = null;
          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error('Failed to create EventSource:', err);
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
    };
  }, [
    options.onScoreUpdated,
    options.onRoundChanged,
    options.onWinnersPublished,
    options.onRegistrationCreated,
    options.onSettingsUpdated,
  ]);

  return { connected, lastEventTime };
}
