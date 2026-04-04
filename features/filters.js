import { debounce } from "./utilities.js"
import { OPTSIDEBAR, FILTERSIDEBAR, startHeaderAnim, stopHeaderAnim} from "../ui/sidebar.js"
import { MAPDATA } from "./markers.js"
import { USERSESSION, USERSETTINGS } from "../core/state.js"
import { getFilteredMarkers } from "../api/markers_api.js"


const FILTERDATA = {};

export function cacheFilterData() {
  FILTERDATA.instantFilter = USERSETTINGS.instantFilter ?? false;
  FILTERDATA.filterTime = FILTERDATA.instantFilter ? 0 : 1500;
  FILTERDATA.runFilter = undefined;
  FILTERDATA.svgMap = {
    exclude: document.getElementById('--exclude'),
    and:   document.getElementById('--and')
  };
  FILTERDATA.states = ['none', 'and', 'exclude'];
  FILTERDATA.filtersAllState = { iconsAll: 0, regionsAll: 0 } //Заготовка на будущее. Можно будет добавить капитальные фильтры, или просто удалить этот параметр
  FILTERDATA.filtersState = { underground: 0, collected: 0 }
  FILTERDATA.filtersValues = { underground: null, collected: null }
  FILTERDATA.filterStateMap = {
    "1": "+",
    "-1": "-"
  }
  FILTERDATA.iconParam = new Map();
  FILTERDATA.regionParam = new Map();
  FILTERDATA.iconAllTokensCache = { and: [], exclude: [] };
  FILTERDATA.regionAllTokensCache = { and: [], exclude: [] };
  FILTERDATA.cache = {
    icons: { 
      "1": FILTERDATA.iconAllTokensCache.and, 
      "-1": FILTERDATA.iconAllTokensCache.exclude
    },
    regions: {
      "1": FILTERDATA.regionAllTokensCache.and, 
      "-1": FILTERDATA.regionAllTokensCache.exclude
    }
  }
  FILTERDATA.bullStateMap = {
    none: null,
    exclude: false,
    and: true
  }
  FILTERDATA.STATE = {
    none: 0,
    exclude: -1,
    and: 1
  };
  FILTERDATA.prevVisibleSet = new Set(MAPDATA.existingMarkers.keys());
  FILTERDATA.filterRequestId = 0;
  FILTERDATA.allVisibleSet = new Set(MAPDATA.existingMarkers.keys());
}

function updateDebounce() {
  FILTERDATA.filterMarkers = debounce(
    () => filterMarkers(),
    FILTERDATA.filterTime,
    { leading: false, trailing: true }
  );
}

function cacheAllIconTokens(value) {
  FILTERDATA.iconAllTokensCache.and.push("+" + value)
  FILTERDATA.iconAllTokensCache.exclude.push("-" + value)
}
function cacheAllRegionTokens(value) {
  FILTERDATA.regionAllTokensCache.and.push("+" + value)
  FILTERDATA.regionAllTokensCache.exclude.push("-" + value)
}

export function initFilters() {
  updateDebounce();
  initUIControl();
  initIconFilter();
  initRegionFilter();
  initUndergroundFilter();
  initCollectedFilter();
}

function initUIControl() {
  OPTSIDEBAR.instantFilterToggle.addEventListener('change', () => {
    FILTERDATA.instantFilter = OPTSIDEBAR.instantFilterToggle.checked
    FILTERDATA.filterTime = FILTERDATA.instantFilter ? 0 : 1500;
    updateDebounce();
    /* Нужно будет добавить сохранение FILTERDATA.instantFilter в USERSETTINGS.instantFilter */
  });
  
  FILTERSIDEBAR.filterClearBtn.addEventListener('click', () => {
    FILTERDATA.iconParam.clear(); 
    FILTERDATA.regionParam.clear();
    FILTERDATA.filtersState.underground = 0;
    FILTERDATA.filtersState.collected = 0;
    FILTERDATA.filtersValues.underground = null;
    FILTERDATA.filtersValues.collected = null;
    document.querySelectorAll('.filter-body label').forEach(label => {
      //collectedstatesIndex = 0;
      const indicatorContainer = label.querySelector('.indicator-container');
      const checkbox = label.querySelector('input[type="checkbox"]');
      indicatorContainer.innerHTML = '';
      label.dataset.state = 'none';
    });

    FILTERDATA.filterMarkers();
  });
}

function initIconFilter() {
  initTriStateFilter({
    rootSelector: '.icons-grid',
    cacheToken: cacheAllIconTokens,
    targetMap: FILTERDATA.iconParam
  });
}

function initRegionFilter() {
  initTriStateFilter({
    rootSelector: '.filter-region',
    cacheToken: cacheAllRegionTokens,
    targetMap: FILTERDATA.regionParam
  });
}

function initCollectedFilter() {
  const filterCollectedEl = FILTERSIDEBAR.collectedSwitch

  const valueId = 'collected';

  filterCollectedEl.dataset.state = 'none';
  const callback = (valueId, nextState) => {
    FILTERDATA.filtersState.collected = FILTERDATA.STATE[nextState];
    FILTERDATA.filtersValues.collected = FILTERDATA.bullStateMap[nextState];
  }

  setUpFilterListener({ 
    filterElement: filterCollectedEl, 
    valueId, 
    callback
  });
}

function initUndergroundFilter() {
  const filterUndergroundEl = FILTERSIDEBAR.undergroundSwitch

  const valueId = 'underground';

  filterUndergroundEl.dataset.state = 'none';
  const callback = (valueId, nextState) => {
    FILTERDATA.filtersState.underground = FILTERDATA.STATE[nextState];
    FILTERDATA.filtersValues.underground = FILTERDATA.bullStateMap[nextState];
  }

  setUpFilterListener({ 
    filterElement: filterUndergroundEl, 
    valueId, 
    callback
  });
}

function initTriStateFilter({ rootSelector, cacheToken, targetMap }) {
  document.querySelectorAll(`${rootSelector} label`).forEach(filterLabelEl => {
    const checkbox = filterLabelEl.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    const valueId = checkbox.value;
    cacheToken(valueId);
    filterLabelEl.dataset.state = 'none';
    const callback = (valueId, nextState) => {
      if (nextState === 'none') {
        targetMap.delete(valueId);
      } else {
        targetMap.set(valueId, FILTERDATA.STATE[nextState]);
      }
    }

    setUpFilterListener({ 
      filterElement: filterLabelEl, 
      valueId, 
      callback
    });
  });
}

function setUpFilterListener({ filterElement, valueId, callback }) {
  const indicatorContainer = document.createElement('span');
  indicatorContainer.className = 'indicator-container';
  filterElement.prepend(indicatorContainer);
  filterElement.addEventListener('click', e => {
    e.preventDefault();

    const nextStateIndex =
      (FILTERDATA.states.indexOf(filterElement.dataset.state) + 1) %
      FILTERDATA.states.length;

    const nextState = FILTERDATA.states[nextStateIndex];

    indicatorContainer.innerHTML = '';

    if (nextState !== 'none') {
      const orig = FILTERDATA.svgMap[nextState];
      if (orig) {
        const clone = orig.cloneNode(true);
        clone.removeAttribute('id');
        indicatorContainer.appendChild(clone);
      }
    }

    callback(valueId, nextState);

    filterElement.dataset.state = nextState;
    FILTERDATA.filterMarkers();
  });
}

function buildToken(state, value) {
  const prefix = FILTERDATA.filterStateMap[state]
  return prefix ? prefix + value : null;
}

function buildTokensObject() {
  const iconTokens = [];
  const allIconState = FILTERDATA.filtersAllState.iconsAll;
  if (allIconState !== 0) {
    const cachedTokens = FILTERDATA.cache.icons[allIconState];
    iconTokens.push(...cachedTokens)
  } else {
    FILTERDATA.iconParam.forEach((state, value) => {
      const token = buildToken(state, value);
      if (token) iconTokens.push(token);
    });
  }

  const regionTokens = [];
  const allRegionState = FILTERDATA.filtersAllState.regionsAll;
  if (allRegionState !== 0) {
    const cachedTokens = FILTERDATA.cache.regions[allRegionState];
    regionTokens.push(...cachedTokens)
  } else {
    FILTERDATA.regionParam.forEach((state, value) => {regionTokens.push(buildToken(state, value))});
  }
  
  const underGround = FILTERDATA.filtersValues.underground;
  
  const userIdToken = buildToken(FILTERDATA.filtersState.collected, USERSESSION.user_id);
  return { iconTokens, regionTokens, underGround, userIdToken }
}

function visibleSetBufferSolver(nextVisibleSet) {
  const becameVisible = [];
  const becameHidden = [];
  const prevVisibleSet = FILTERDATA.prevVisibleSet;
  for (const id of nextVisibleSet) {
    if (!prevVisibleSet.has(id)) becameVisible.push(id);
  };

  for (const id of prevVisibleSet) {
    if (!nextVisibleSet.has(id)) becameHidden.push(id);
  };
  return { becameVisible, becameHidden };
}

async function filterMarkers() {
  const requestId = ++FILTERDATA.filterRequestId;
  const filterParams = buildTokensObject();

  if (!FILTERDATA.instantFilter) startHeaderAnim(FILTERDATA.filterTime);
  if (
    (filterParams.regionTokens.length === 0) && 
    (filterParams.iconTokens.length === 0) && 
    (filterParams.underGround === null) && 
    (filterParams.userIdToken === null)
  ) {
    const nextVisibleSet = new Set(FILTERDATA.allVisibleSet);
    const solvedObj = visibleSetBufferSolver(nextVisibleSet);
    renderFilter(solvedObj);
    FILTERDATA.prevVisibleSet = nextVisibleSet;
  } else {
    const ids = await getFilteredMarkers(filterParams);
    if (requestId !== FILTERDATA.filterRequestId) return;
    const nextVisibleSet = new Set(ids);
    const solvedObj = visibleSetBufferSolver(nextVisibleSet);
    renderFilter(solvedObj);
    FILTERDATA.prevVisibleSet = nextVisibleSet;
  }
}

function renderFilter({ becameVisible, becameHidden }) {
  requestAnimationFrame(() => {
    for (const id of becameVisible) {
      const marker = MAPDATA.existingMarkers.get(id);
      if (!marker) continue;

      if (marker._$visible === true) continue;
      marker._$visible = true;

      const el = marker.getElement?.() || marker._icon;
      if (el) el.classList.remove('is-hidden');
    }

    for (const id of becameHidden) {
      const marker = MAPDATA.existingMarkers.get(id);
      if (!marker) continue;

      if (marker._$visible === false) continue;
      marker._$visible = false;

      const el = marker.getElement?.() || marker._icon;
      if (el) el.classList.add('is-hidden');

      marker.closePopup?.();
      marker.closeTooltip?.();
    }
  });
  stopHeaderAnim();
}
