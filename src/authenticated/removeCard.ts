import { Database } from '@/supabase-db.types';
import { getCardsFromBoardDeck } from './queries/getCardsFromBoardDeck';
import { SupabaseClient } from '@supabase/supabase-js';
import { createDeckFromDiscaredCards } from './queries/createDeckFromDiscaredCards';

export const removeCard = async (client: SupabaseClient<Database>, params: {
  cardIndex: number;
  boardId: number;
  cardTowers: Database['public']['Tables']['card_tower']['Row'][];
  cardVariants: Database['public']['Tables']['card_variant']['Row'][];
}): Promise<void> => {
  const { cardIndex, boardId, cardTowers, cardVariants } = params;
  for (const cardTower of cardTowers) {
    let cardsInBoardDeck = await getCardsFromBoardDeck(client, { boardId });
    if (!cardsInBoardDeck.length) {
      await createDeckFromDiscaredCards(client, { boardId, cardVariants });
      cardsInBoardDeck = await getCardsFromBoardDeck(client, { boardId });
    }
    const cardInBoardDeck = cardsInBoardDeck[cardsInBoardDeck.length - 1] as (typeof cardsInBoardDeck)[0] | undefined;

    if (!cardInBoardDeck) throw new Error('Deck should not be empty');

    const { data: cardsInTower, error: cardsInTowerError } = await client
      .from('card_in_tower')
      .select('*')
      .eq('card_tower_id', cardTower.id)
      .order('id', { ascending: true });
    if (cardsInTowerError) throw new Error(cardsInTowerError.message);

    const cardInTowerToUpdate = cardsInTower[cardIndex];

    // update card in card tower
    const { error: cardInTowerUpdateError } = await client
      .from('card_in_tower')
      .update({ card_number: cardInBoardDeck.card_number, is_protected: false })
      .eq('id', cardInTowerToUpdate.id);
    if (cardInTowerUpdateError) throw new Error(cardInTowerUpdateError.message);

    // move card from card tower to opened pile
    const { error: cardInBoardOpenedError } = await client
      .from('card_in_board_opened')
      .insert({ board_id: boardId, card_number: cardInTowerToUpdate.card_number });
    if (cardInBoardOpenedError) throw new Error(cardInBoardOpenedError.message);

    console.log(cardInBoardDeck.card_number);

    // remove card from board deck
    const { error: cardInBoardDeckError } = await client
      .from('card_in_board_deck')
      .delete()
      .eq('id', cardInBoardDeck.id);
    if (cardInBoardDeckError) throw new Error(cardInBoardDeckError.message);
  }
};
