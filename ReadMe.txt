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

create table markers (
  id text primary key,
  name text not null,
  description text,
  icon_id text not null,
  lat double precision not null,
  lng double precision not null,
  reg_id text not null,
  under_ground boolean not null default false,
  height double precision not null default 0,
  color_r integer not null default 255,
  color_g integer not null default 255,
  color_b integer not null default 255,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_identities (
  user_id bigint not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  email text,
  unique (provider, provider_user_id),
  primary key (provider, provider_user_id),
  unique (user_id, provider)
);

create table user_profiles (
  user_id bigint primary key references users(id) on delete cascade,
  user_name text,
  display_name text,
  role text check (role in ('user','editor','moderator','admin')) default 'user'
);

create table user_collected_markers (
  user_id bigint references users(id) on delete cascade,
  marker_id text references markers(id) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, marker_id)
);

CREATE INDEX idx_markers_icon ON markers(icon_id);
CREATE INDEX idx_markers_region ON markers(reg_id);
CREATE INDEX idx_markers_under_ground ON markers(under_ground);



На будущее:
1. Оптимизировать скейлинг на мобильных устройствах 


!!! Нужно пофиксить баг:
filters.js:189 Uncaught ReferenceError: iconstatesIndex is not defined
    at filters.js:189:20
    at NodeList.forEach (<anonymous>)
    at HTMLButtonElement.<anonymous> (filters.js:188:50)




if (['user','editor','moderator','admin'].includes(req.session.role)){
  return res.status(400).json({ error: "JSON object is required" });
}





-- user token -> (user_in, user_out)
user_token AS (
  SELECT
    left($1,1) AS tok,
    substring($1 from 2)::bigint AS uid
  WHERE $1 ~ '^[+-][0-9]+$'
),
user_markers AS (
  SELECT ump.marker_id AS id
  FROM user_collected_markers ump
  JOIN user_token u ON ump.user_id = u.uid
),
