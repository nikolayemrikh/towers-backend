import { Database } from '@/supabase-db.types';
import { SupabaseClient } from '@supabase/supabase-js';

export const createDeckFromDiscaredCards = async (client: SupabaseClient<Database>, params: {
  boardId: number;
  cardVariants: Database['public']['Tables']['card_variant']['Row'][];
}): Promise<void> => {
  const { boardId, cardVariants } = params;
  const { data: cardsInBoardDiscard, error: cardsInBoardDiscardError } = await client
    .from('card_in_board_discard_deck')
    .select('*')
    .eq('board_id', boardId)
    .order('id', { ascending: true });
  if (cardsInBoardDiscardError) throw new Error(cardsInBoardDiscardError.message);

  // shuffle cards in discard pile
  const cardsInBoardDiscardToReduce = [...cardsInBoardDiscard];
  const cardsToBoardDeck: Database['public']['Tables']['card_variant']['Row'][] = [];
  while (cardsInBoardDiscardToReduce.length > 0) {
    const randomIndex = Math.floor(Math.random() * cardsInBoardDiscardToReduce.length);
    const randomCardInBoardDiscard = cardsInBoardDiscardToReduce[randomIndex];
    const cardVariant = cardVariants.find((cardVariant) => cardVariant.number === randomCardInBoardDiscard.card_number);
    if (!cardVariant)
      throw new Error(`Card variant not found for card with number "${randomCardInBoardDiscard.card_number}"`);
    cardsToBoardDeck.push({ number: randomCardInBoardDiscard.card_number, power: cardVariant.power });
    cardsInBoardDiscardToReduce.splice(randomIndex, 1);
  }

  // create cards in border deck
  for (const cardToBoardDeck of cardsToBoardDeck) {
    const { error: cardInBoardDeckInsertError } = await client
      .from('card_in_board_deck')
      .insert({ board_id: boardId, card_number: cardToBoardDeck.number })
      .select();
    if (cardInBoardDeckInsertError) throw new Error(cardInBoardDeckInsertError.message);
  }

  // remove cards in board discard
  for (const cardInBoardDiscard of cardsInBoardDiscard) {
    const { error: cardInBoardDiscardDeleteError } = await client
      .from('card_in_board_discard_deck')
      .delete()
      .eq('id', cardInBoardDiscard.id);
    if (cardInBoardDiscardDeleteError) throw new Error(cardInBoardDiscardDeleteError.message);
  }
};
