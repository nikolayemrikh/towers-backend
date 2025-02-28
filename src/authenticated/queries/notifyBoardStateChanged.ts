import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/supabase-db.types';

// @TODO uncomment when the "send" method will stop return 'error'
// export const notifyBoardStateChanged = async (boardId: number): Promise<void> => {
//   const channel = supabaseServiceClient.channel(`board:${boardId}`);
//   await channel.send({ type: 'broadcast', event: 'stateChanged' });
//   await supabaseServiceClient.removeChannel(channel);
// };

export const notifyBoardStateChanged = async (client: SupabaseClient<Database>, boardId: number): Promise<void> => {
  const channel = client.channel(`board:${boardId}`);
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
    });
  });
  const res = await channel.send({ type: 'broadcast', event: 'stateChanged', payload: { message: 'asd' } });
  if (res !== 'ok') throw new Error('Can not notify that board state changed');
  await client.removeChannel(channel);
};
