alter table portfolio_items
  alter column title drop not null;

alter table portfolio_items
  drop constraint if exists portfolio_items_title_check;

alter table portfolio_items
  add constraint portfolio_items_title_trimmed_check
  check (title is null or title = btrim(title));
