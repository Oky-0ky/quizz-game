import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type GameEventData = Record<string, unknown>;

export interface RoomBroadcastPayload {
  roomId: string;
  type: 'TURN_CHANGE' | 'PION_MOVE' | 'ANSWER_SUBMIT' | 'ITEM_USE' | 'EVENT' | 'DUEL';
  payload: GameEventData;
}

/**
 * Subscribes to real-time events for a specific game room.
 */
export function subscribeToGameRoom(
  roomCode: string,
  onPayload: (payload: GameEventData) => void
) {
  const channel = supabase.channel(`room:${roomCode}`)
    .on('broadcast', { event: 'game_event' }, (event) => {
      onPayload(event.payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcasts an event to all participants in a game room.
 */
export async function broadcastGameEvent(
  roomCode: string,
  eventType: string,
  data: GameEventData
) {
  const channel = supabase.channel(`room:${roomCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload: {
      eventType,
      data,
      timestamp: Date.now(),
    },
  });
}
