import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
    // 1. If Supabase is configured by user, connect to Supabase Realtime channel!
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const channel = client
        .channel('vi2_live_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'judge_scores' },
          (payload) => {
            setLastEventTime(Date.now());
            options.onScoreUpdated?.(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'teams' },
          (payload) => {
            setLastEventTime(Date.now());
            if (payload.eventType === 'DELETE') {
              options.onTeamDeleted?.(payload);
            } else {
              options.onRegistrationCreated?.(payload);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_round_state' },
          (payload) => {
            setLastEventTime(Date.now());
            options.onRoundChanged?.(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'event_settings' },
          (payload) => {
            setLastEventTime(Date.now());
            options.onSettingsUpdated?.(payload);
            options.onWinnersPublished?.(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
          } else {
            setConnected(false);
          }
        });

      return () => {
        client.removeChannel(channel);
      };
    }

    // 2. Otherwise use built-in Server-Sent Events (SSE) stream
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
    options.onTeamDeleted,
    options.onDatabaseReset,
  ]);

  return { connected, lastEventTime, isSupabase: isSupabaseConfigured };
}
