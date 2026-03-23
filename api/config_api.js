export const API_BASE = "https://api.mapofthenorth.com/api";

export const API = {
  auth: {
    me: `${API_BASE}/auth/me`,
    googleLogin: `${API_BASE}/auth/google/login`,
  },

  markers: {
    all: `${API_BASE}/markers/all`,
    filter: `${API_BASE}/markers/filter`,
    single: `${API_BASE}/markers/single`,
    array: `${API_BASE}/markers/array`,

    collected: {
      all: `${API_BASE}/markers/collected`,
      single: `${API_BASE}/markers/collected/single`,
      array: `${API_BASE}/markers/collected/array`,
    },
  },
};

export const API_RAW = {
  auth: {
    me: `/auth/me`,
    googleLogin: `/auth/google/login`,
  },

  markers: {
    all: `/markers/all`,
    filter: `/markers/filter`,
    single: `/markers/single`,
    array: `/markers/array`,

    collected: {
      all: `/markers/collected`,
      single: `/markers/collected/single`,
      array: `/markers/collected/array`,
    },
  },
};