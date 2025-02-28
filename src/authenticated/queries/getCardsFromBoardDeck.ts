import { Database } from '@/supabase-db.types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getCardsFromBoardDeck = async (client: SupabaseClient<Database>, params: {
  boardId: number;
}): Promise<Database['public']['Tables']['card_in_board_deck']['Row'][]> => {  
  const { boardId } = params;
  const { data, error } = await client
    .from('card_in_board_deck')
    .select('*')
    .eq('board_id', boardId)
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};
