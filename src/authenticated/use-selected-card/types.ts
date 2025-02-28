import { Database } from '@/supabase-db.types';

export type TCardPower = Database['public']['Enums']['Power'];

export type TUseSelectedCardRequest =
  | IUseSelectedProtectCardRequest
  | IUseSelectedRemoveTopCardRequest
  | IUseSelectedRemoveMiddleCardRequest
  | IUseSelectedRemoveBottomCardRequest
  | IUseSelectedSwapNeighboursCardRequest
  | IUseSelectedSwapThroughOneCardRequest
  | IUseSelectedMoveDownByTwoCardRequest
  | IUseSelectedMoveUpByTwoCardRequest;

interface IBaseUseSelectedCardRequest {
  power: TCardPower;
  boardId: string;
}

export interface IUseSelectedProtectCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Protect';
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedRemoveTopCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Remove_top';
}

export interface IUseSelectedRemoveMiddleCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Remove_middle';
}

export interface IUseSelectedRemoveBottomCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Remove_bottom';
}

export interface IUseSelectedRemoveBottomCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Remove_bottom';
}

export interface IUseSelectedSwapNeighboursCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Swap_neighbours';
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedSwapThroughOneCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Swap_through_one';
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedMoveDownByTwoCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Move_down_by_two';
  cardIndex: number;
}

export interface IUseSelectedMoveUpByTwoCardRequest extends IBaseUseSelectedCardRequest {
  power: 'Move_up_by_two';
  cardIndex: number;
}
