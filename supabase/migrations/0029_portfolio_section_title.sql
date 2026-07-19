alter table business
  add column if not exists portfolio_section_title text;

alter table business
  drop constraint if exists business_portfolio_section_title_trimmed_check;

alter table business
  add constraint business_portfolio_section_title_trimmed_check
  check (portfolio_section_title is null or portfolio_section_title = btrim(portfolio_section_title));
