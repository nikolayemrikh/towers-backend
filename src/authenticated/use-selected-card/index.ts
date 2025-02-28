import { Database } from '@/supabase-db.types';
import { createClient } from '@supabase/supabase-js';
import { TUseSelectedCardRequest } from './types';
import { removeCard } from '../removeCard';
import { passTurnToNextUser } from '../queries/passTurnToNextUser';
import { notifyBoardStateChanged } from '../queries/notifyBoardStateChanged';

export const useSelectedCard = async (token: string, params: TUseSelectedCardRequest) => {
  const boardId = Number(params.boardId);

  const supabaseClient = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: token } },
  });

  const supabaseServiceClient = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabaseClient.auth.getUser();
  const user = data.user;
  if (!user) throw new Error('User not found');

  const { data: boards, error: boardsError } = await supabaseServiceClient.from('board').select('*').eq('id', boardId);
  if (boardsError) throw new Error(boardsError.message);
  const board = boards[0];
  if (!board) throw new Error('Board not found');

  if (board.turn_user_id !== user.id) throw new Error('Turn user is not current user');

  const openedCardNumberToUse = board.opened_card_number_to_use;
  if (!openedCardNumberToUse) throw new Error('No card to use since "opened_card_number_to_use" is not set');

  const { data: cardVariants, error: cardVariantsSelectError } = await supabaseServiceClient
    .from('card_variant')
    .select('*');
  if (cardVariantsSelectError) throw new Error(cardVariantsSelectError.message);

  const cardVariant = cardVariants.find((cardVariant) => cardVariant.number === openedCardNumberToUse);
  if (!cardVariant) throw new Error(`Card variant not found for card with number "${openedCardNumberToUse}"`);

  const power = cardVariant.power;

  const resPower = params.power;
  if (resPower !== power)
    throw new Error(`Can not use card with power "${power}" when power "${resPower}" is requested`);

  const { data: cardTowers, error: cardTowersError } = await supabaseServiceClient
    .from('card_tower')
    .select('*')
    .eq('board_id', boardId);
  if (cardTowersError) throw new Error(cardTowersError.message);
  const cardTower = cardTowers.find((cardTower) => cardTower.user_id === user.id);
  if (!cardTower) throw new Error('Card tower for current user not found');

  const { data: cardsInTower, error: cardsInTowerError } = await supabaseServiceClient
    .from('card_in_tower')
    .select('*')
    .eq('card_tower_id', cardTower.id)
    .order('id', { ascending: true });
  if (cardsInTowerError) throw new Error(cardsInTowerError.message);

  // move used opened card to discard pile
  const { error: cardInBoardDiscardDeckError } = await supabaseServiceClient
    .from('card_in_board_discard_deck')
    .insert({ board_id: boardId, card_number: openedCardNumberToUse });
  if (cardInBoardDiscardDeckError) throw new Error(cardInBoardDiscardDeckError.message);

  switch (resPower) {
    case 'Protect': {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 1)
        throw new Error('Can not protect cards that are not next to each other');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      const [{ error: updateCardInTowerFirstError }, { error: updateCardInTowerSecondError }] = await Promise.all([
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ is_protected: true })
          .eq('card_tower_id', cardTower.id)
          .eq('id', firstCard.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ is_protected: true })
          .eq('card_tower_id', cardTower.id)
          .eq('id', secondCard.id),
      ]);
      if (updateCardInTowerFirstError) throw new Error(updateCardInTowerFirstError.message);
      if (updateCardInTowerSecondError) throw new Error(updateCardInTowerSecondError.message);
      break;
    }
    case 'Swap_neighbours': {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 1)
        throw new Error('Can not swap cards that are not next to each other');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      const [{ error: updateCardInTowerFirstError }, { error: updateCardInTowerSecondError }] = await Promise.all([
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: secondCard.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', firstCard.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: firstCard.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', secondCard.id),
      ]);
      if (updateCardInTowerFirstError) throw new Error(updateCardInTowerFirstError.message);
      if (updateCardInTowerSecondError) throw new Error(updateCardInTowerSecondError.message);
      break;
    }
    case 'Swap_through_one': {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 2)
        throw new Error('Can not swap cards that are not next to each other through one card');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      const [{ error: updateCardInTowerFirstError }, { error: updateCardInTowerSecondError }] = await Promise.all([
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: secondCard.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', firstCard.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: firstCard.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', secondCard.id),
      ]);
      if (updateCardInTowerFirstError) throw new Error(updateCardInTowerFirstError.message);
      if (updateCardInTowerSecondError) throw new Error(updateCardInTowerSecondError.message);
      break;
    }
    case 'Move_down_by_two': {
      const card = cardsInTower[params.cardIndex];
      const nextCard1 = cardsInTower[params.cardIndex - 1];
      const nextCard2 = cardsInTower[params.cardIndex - 2];
      if (!nextCard1 || !nextCard2)
        throw new Error('Can not move down by two cards because there are not enough cards below');
      const [
        { error: updateCardInTowerFirstError },
        { error: updateCardInTowerSecondError },
        { error: updateCardInTowerThirdError },
      ] = await Promise.all([
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: nextCard1.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', card.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: nextCard2.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', nextCard1.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: card.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', nextCard2.id),
      ]);
      if (updateCardInTowerFirstError) throw new Error(updateCardInTowerFirstError.message);
      if (updateCardInTowerSecondError) throw new Error(updateCardInTowerSecondError.message);
      if (updateCardInTowerThirdError) throw new Error(updateCardInTowerThirdError.message);
      break;
    }
    case 'Move_up_by_two': {
      const card = cardsInTower[params.cardIndex];
      const nextCard1 = cardsInTower[params.cardIndex + 1];
      const nextCard2 = cardsInTower[params.cardIndex + 2];
      if (!nextCard1 || !nextCard2)
        throw new Error('Can not move down by two cards because there are not enough cards above');
      const [
        { error: updateCardInTowerFirstError },
        { error: updateCardInTowerSecondError },
        { error: updateCardInTowerThirdError },
      ] = await Promise.all([
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: nextCard1.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', card.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: nextCard2.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', nextCard1.id),
        await supabaseServiceClient
          .from('card_in_tower')
          .update({ card_number: card.card_number })
          .eq('card_tower_id', cardTower.id)
          .eq('id', nextCard2.id),
      ]);
      if (updateCardInTowerFirstError) throw new Error(updateCardInTowerFirstError.message);
      if (updateCardInTowerSecondError) throw new Error(updateCardInTowerSecondError.message);
      if (updateCardInTowerThirdError) throw new Error(updateCardInTowerThirdError.message);
      break;
    }
    case 'Remove_top': {
      await removeCard(supabaseServiceClient, { cardIndex: cardsInTower.length - 1, boardId, cardTowers, cardVariants });
      break;
    }
    case 'Remove_middle': {
      await removeCard(supabaseServiceClient, { cardIndex: (cardsInTower.length - 1) / 2, boardId, cardTowers, cardVariants });
      break;
    }
    case 'Remove_bottom': {
      await removeCard(supabaseServiceClient, { cardIndex: 0, boardId, cardTowers, cardVariants });
      break;
    }
    default: {
      const unhandledPower: never = resPower;
      throw new Error(`Unhandled power "${unhandledPower}"`);
    }
  }

  const { error: boardUpdateError } = await supabaseServiceClient
    .from('board')
    .update({ opened_card_number_to_use: null })
    .eq('id', boardId)
    .eq('turn_user_id', user.id);
  if (boardUpdateError) throw new Error(boardUpdateError.message);

  await passTurnToNextUser(supabaseServiceClient, boardId, user.id, cardTowers);

  await notifyBoardStateChanged(supabaseServiceClient, boardId);
};
