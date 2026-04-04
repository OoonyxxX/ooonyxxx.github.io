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




Отличный вопрос — тут как раз важно понять «как это выглядит со стороны клиента», и дальше всё становится очевидным 👍

🧠 Суть

req.query формируется автоматически из URL.
Ты ничего специально на сервере не создаёшь — клиент просто отправляет правильный URL.

🔹 Самый простой вариант (в браузере)
GET /api/markers?userId=5&sort=asc

Express сам превратит это в:

req.query = {
  userId: "5",
  sort: "asc"
};
🔹 Пример с fetch (фронт)
const params = new URLSearchParams({
  userId: 5,
  sort: "asc"
});

fetch(`/api/markers?${params}`);

👉 В итоге запрос будет:

/api/markers?userId=5&sort=asc
🔹 Прямо руками (если без URLSearchParams)
fetch("/api/markers?userId=5&sort=asc");

Работает так же, просто менее удобно.

🔹 Axios вариант
axios.get("/api/markers", {
  params: {
    userId: 5,
    sort: "asc"
  }
});

👉 Axios сам соберёт query строку

🔥 Пример под твой кейс

Ты можешь сделать так:

// клиент
fetch(`/api/markers/all?userId=${userId}`);

А на сервере:

router.get("/all", async (req, res) => {
  const userId = req.query.userId ?? null;
});
⚠️ Важные нюансы
1. Всё приходит строками
req.query.userId // "5", а не 5

👉 лучше сразу:

const userId = Number(req.query.userId) || null;
2. undefined vs null

Если параметра нет:

req.query.userId === undefined
3. Массивы
/api/markers?tags=fox&tags=forest

👉

req.query.tags = ["fox", "forest"];
🧠 Коротко

👉 Клиент формирует URL:

/api/route?key=value

👉 Сервер получает:

req.query.key

Если хочешь — могу помочь тебе сделать аккуратный helper для query (чтобы не писать руками строки и не ловить баги с кодировкой 👀).




metEditor.js:582 Loading Regions.png: TypeError: ctx.getImageData is not a function
    at MetEditor.getRegionIndex (metEditor.js:381:23)
    at HTMLButtonElement.<anonymous> (metEditor.js:578:28)
(anonymous) @ metEditor.js:582
metEditor.js:586 Uncaught TypeError: Cannot read properties of undefined (reading '7')
    at HTMLButtonElement.<anonymous> (metEditor.js:586:65)

this.originalMarkersData
this.existingMarkers



(index):1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
markers.js:259 Uncaught SyntaxError: Failed to execute 'querySelector' on 'Element': '#[object Object]_svg' is not a valid selector.
    at paintMarkers (markers.js:259:21)
    at HTMLSelectElement.<anonymous> (metEditor.js:429:7)
paintMarkers	@	markers.js:259
(anonymous)	@	metEditor.js:429
content.js:1 Uncaught (in promise) The message port closed before a response was received.
request.js:4 
 POST https://api.mapofthenorth.com/api/markers/array 400 (Bad Request)
apiRequest	@	request.js:4
postMarkersArray	@	markers_api.js:48
METRequest	@	markers_api.js:71
btnSaveInit	@	metEditor.js:223
request.js:18 Uncaught (in promise) Error: HTTP 400: {"error":"Invalid marker payload in array"}
    at apiRequest (request.js:18:11)
    at async postMarkersArray (markers_api.js:48:10)
    at async METRequest (markers_api.js:71:25)
apiRequest	@	request.js:18
await in apiRequest		
postMarkersArray	@	markers_api.js:48
METRequest	@	markers_api.js:71
btnSaveInit	@	metEditor.js:223


636,695 px
655 px