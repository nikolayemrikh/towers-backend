create policy "Enable read access for all users"
on "public"."card_in_board_opened"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."card_in_tower"
as permissive
for select
to authenticated
using (true);




