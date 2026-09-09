alter table profiles add column if not exists ui_language text not null default 'en' check (ui_language in ('en', 'tr', 'fr'));
