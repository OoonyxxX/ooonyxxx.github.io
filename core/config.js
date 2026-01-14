export const MAP_CONFIG = {
    minZoom: 2, //Нижний уровень зумма
    maxZoom: 5, //Верхний уровень зумма
    zoomSnap: 0.025, //Привязка зумма к скроллу
    zoomDelta: 0.5, //Привязка к кнопкам управления
    zoom: 2, //Базовый зумм
    zoomControl: true, //Разрешение на зумм
    // maxBounds: Граници карты. Формула: [[mapTileHB, mapTileWL], [mapTileHT, mapTileWR]]
    maxBoundsViscosity: 0.5, //Плавность зумма
    center: [128, 128], //Центр карты

    mapTile: 256, //Реальный размер карты
    mapTileBorder: 128, //Расстояние от центра к краю
    screen_frame_mult: 1, //Мультипликатор pixelDensity
    pixelDensity: 120,
    mapTileWR: 504, //Значение зависимое от screen_frame_mult и pixelDensity. mapTileWR = mapTile + mapTileBorder + (pixelDensity * screen_frame_mult);
    mapTileHT: 376, //Значение зависимое от screen_frame_mult и pixelDensity. mapTileHT = mapTile + (pixelDensity * screen_frame_mult);
    mapTileWL: -248, //Значение зависимое от screen_frame_mult и pixelDensity. mapTileWL = -mapTileBorder - (pixelDensity * screen_frame_mult);
    mapTileHB: -120, //Значение зависимое от screen_frame_mult и pixelDensity. mapTileHB = - (pixelDensity * screen_frame_mult);
}

export const REGION_COLORS = {
    fox_island:   '#ffb257',
    misthaven:    '#b890f9',
    mosswood:     '#69ec72',
    stormvale:    '#e6f368',
    frigid_peaks: '#89e1f0',
    ashlands:     '#fa7a7a',
    ocean:        '#7497f7',
};

export const REGION_UNDERGROUND_COLORS = {
  fox_island:   '#a16826',
  misthaven:    '#684d93',
  mosswood:     '#4c9b46',
  stormvale:    '#9ca630',
  frigid_peaks: '#27acc4',
  ashlands:     '#993d3d',
  ocean:        '#385299',
};

export const ALLOWED_EDITORS = [
    "OoonyxxX", 
    "333tripleit",
    "MiscFlower"
];

export const REGION_LIST = {
    0: "ocean",
    1: "fox_island",
    2: "misthaven",
    3: "mosswood",
    4: "stormvale",
    5: "frigid_peaks",
    6: "ashlands",
    7: "undefined"
};

export const CHECK_AUTH = "https://sotn2-auth-proxy.onrender.com/auth/me";
export const REQUEST_AUTH = "https://sotn2-auth-proxy.onrender.com/auth/login";
export const DEPLOY_STATUS = "https://sotn2-auth-proxy.onrender.com/api/deploy-status";
export const UPDATE_MARKERS = "https://sotn2-auth-proxy.onrender.com/auth/me";
