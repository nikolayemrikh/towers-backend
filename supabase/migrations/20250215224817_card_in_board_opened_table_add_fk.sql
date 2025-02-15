alter table "public"."card_in_board_opened" add constraint "card_in_board_opened_card_number_fkey" FOREIGN KEY (card_number) REFERENCES card_variant(number) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."card_in_board_opened" validate constraint "card_in_board_opened_card_number_fkey";