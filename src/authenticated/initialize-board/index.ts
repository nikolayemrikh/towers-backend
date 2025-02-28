import { Database } from '@/supabase-db.types';
import { createClient } from '@supabase/supabase-js';

export const initializeBoard = async (token: string): Promise<void> => {
    const supabaseClient = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: token } },
    });

    const supabaseServiceClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    


  const { data: userData } = await supabaseClient.auth.getUser();
  if (!userData.user) throw new Error('User not found');

  const { data: usersInLobby, error: usersInLobbySelectError } = await supabaseServiceClient
    .from('user_in_lobby')
    .select('user_id');

  if (usersInLobbySelectError) throw new Error(usersInLobbySelectError.message);

  if (!usersInLobby.length) throw new Error('No users in lobby');

  // create a new board
  const randomUserInLobby = usersInLobby[Math.floor(Math.random() * usersInLobby.length)];
  const { data: boardData, error: boardInsertError } = await supabaseServiceClient
    .from('board')
    .insert({ turn_user_id: randomUserInLobby.user_id })
    .select();
  if (boardInsertError) throw new Error(boardInsertError.message);
  const newBoard = boardData[0];

  // create cards in board deck
  const { data: cardVariants, error: cardVariantsSelectError } = await supabaseServiceClient
    .from('card_variant')
    .select('*');
  if (cardVariantsSelectError) throw new Error(cardVariantsSelectError.message);

  // shuffle card variants
  const cardVariantsToReduce = [...cardVariants];
  const cardsInBoardDeck: Database['public']['Tables']['card_variant']['Row'][] = [];
  while (cardVariantsToReduce.length > 0) {
    const randomIndex = Math.floor(Math.random() * cardVariantsToReduce.length);
    const randomCardVariant = cardVariantsToReduce[randomIndex];
    cardsInBoardDeck.push(randomCardVariant);
    cardVariantsToReduce.splice(randomIndex, 1);
  }

  // create card towers
  const cardTowers: Database['public']['Tables']['card_tower']['Row'][] = [];
  for (const userInLobby of usersInLobby) {
    const { data: cardTowerData, error: cardTowerInsertError } = await supabaseServiceClient
      .from('card_tower')
      .insert({ board_id: newBoard.id, user_id: userInLobby.user_id })
      .select();
    if (cardTowerInsertError) throw new Error(cardTowerInsertError.message);
    const newCardTower = cardTowerData[0];
    cardTowers.push(newCardTower);

    // move cards from board deck to card tower
    // move first 7 cards from board deck to card tower
    const cardsToMoveFromBoardDeck = cardsInBoardDeck.splice(0, 7).sort((a, b) => a.number - b.number);
    for (const cardToMoveFromBoardDeck of cardsToMoveFromBoardDeck) {
      const { error: cardInCardTowerInsertError } = await supabaseServiceClient
        .from('card_in_tower')
        .insert({ card_tower_id: newCardTower.id, card_number: cardToMoveFromBoardDeck.number })
        .select();
      if (cardInCardTowerInsertError) throw new Error(cardInCardTowerInsertError.message);
    }
  }

  // create cards in border deck
  for (const cardInBoardDeck of cardsInBoardDeck) {
    const { error: cardInBoardDeckInsertError } = await supabaseServiceClient
      .from('card_in_board_deck')
      .insert({ board_id: newBoard.id, card_number: cardInBoardDeck.number })
      .select();
    if (cardInBoardDeckInsertError) throw new Error(cardInBoardDeckInsertError.message);
  }

  const { error: usersInLobbyDeleteError } = await supabaseServiceClient
    .from('user_in_lobby')
    .delete()
    // @TODO fix this hack
    .neq('id', 321321);
  if (usersInLobbyDeleteError) throw new Error(usersInLobbyDeleteError.message);
}