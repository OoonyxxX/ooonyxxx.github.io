1. Перенос системы авторизации с GitHub на Google Auth.
2. Перенос локальной json базы данных в облачную PostgresSQL базу.
2.1 Создание базы данных
2.2 Конвертация из json в sql. Python или node скрипт 
2.3 Реализация защиты данных через транзакции с привязкой к авторизованному пользователю.
2.4 Реализация простого API для работы с базой через страницу карты на стороне клиента.
3. Конвертация иконок из svg в растровое изображение

Schema:

create table users (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table user_identities (
  user_id bigint not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  email text,
  unique (provider, provider_user_id),
  unique (user_id, provider)
);

create table user_profiles (
  user_id bigint primary key references users(id) ON DELETE CASCADE,
  display_name text,
  role text check (role in ('user','editor','moderator','admin')) default 'user',
)

create table user_markers_properties (
  user_id bigint references users(id) ON DELETE CASCADE,
  markers_id text references markers(id) ON DELETE CASCADE
  collected_at timestamptz not null default now(),
  primary key (user_id, marker_id)
)

create index idx_user_markers on user_markers_properties(user_id);

create table markers (
  id text primary key,
  name text not null,
  description text,
  icon_id text not null,
  lat double precision not null,
  lng double precision not null,
  reg_id text not null,
  under_groud bull not null default false,
  height double precision not null default 0,
  color_r integer not null default 255,
  color_g integer not null default 255,
  color_b integer not null default 255,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_markers_icon on markers(icon_id);
create index idx_markers_region on markers(reg_id);
create index idx_markers_under_groud on markers(under_groud);







На будущее:
1. Оптимизировать скейлинг на мобильных устройствах 