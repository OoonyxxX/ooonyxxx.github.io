import { debounce } from "./utilities.js"
import { OPTSIDEBAR, FILTERSIDEBAR, startHeaderAnim, stopHeaderAnim} from "../ui/sidebar.js"
import { MAPDATA } from "./markers.js"



const iconParam = new Map();
const regionParam = new Map();

let filterTime = 10;
let instantFilterEnabled = true;


export function initFilters() {
  const svgMap = {
    or:    document.getElementById('--or'),
    exclude: document.getElementById('--exclude'),
    and:   document.getElementById('--and')
  };
  
  const states = ['none', 'or', 'exclude', 'and'];
  
  const orDelta  = [ 0,  1, -1,  0]; // 1:+1, 2:-1
  const andDelta = [-1,  0,  0,  1]; // 0:-1, 3:+1
  
  
  let allIconsOR = 0;
  let allIconsAND = 0;
  
  let allRegionOR = 0;
  let allRegionAND = 0;
  
  let runFilter = debounce(() => {setFilterFast(MAPDATA.existingMarkers, iconParam, regionParam, allIconsOR, allIconsAND, allRegionOR, allRegionAND);}, filterTime, {leading: false, trailing: true});

  OPTSIDEBAR.instantFilterToggle.addEventListener('change', () => {
    instantFilterEnabled = !instantFilterEnabled;
    filterTime = instantFilterEnabled ? 0 : 1500;
    runFilter = debounce(() => {setFilterFast(MAPDATA.existingMarkers, iconParam, regionParam, allIconsOR, allIconsAND, allRegionOR, allRegionAND);}, filterTime, {leading: false, trailing: true});
  });


  document.querySelectorAll('.icons-grid label').forEach(iconsgrid => {
	let iconstatesIndex = 0;
    const checkbox = iconsgrid.querySelector('input[type="checkbox"]');
    const indicatorContainer = document.createElement('span');
    indicatorContainer.className = 'indicator-container';
    iconsgrid.prepend(indicatorContainer);
	

    iconsgrid.dataset.state = 'none';
	checkbox.checked = false;
	
	const iconId = checkbox.value;

    iconsgrid.addEventListener('click', e => {
      e.preventDefault();
	  const nextIndex = (states.indexOf(iconsgrid.dataset.state) + 1) % states.length;
	  
	  allIconsOR += orDelta[nextIndex];
	  allIconsAND += andDelta[nextIndex];
	  
	  iconstatesIndex = nextIndex;
	  
	  const nextState = states[nextIndex];
      indicatorContainer.innerHTML = '';

      
      if (nextState !== 'none') {
        const orig = svgMap[nextState];
        if (orig) {
          const clone = orig.cloneNode(true);
          clone.removeAttribute('id');
          indicatorContainer.appendChild(clone);
        }
        checkbox.checked = true;
		iconParam.set(iconId, iconstatesIndex);
      } else {
        checkbox.checked = false;
		iconParam.delete(iconId);
      }

      iconsgrid.dataset.state = nextState;
	  
	  if (!instantFilterEnabled) startHeaderAnim(filterTime);
	  runFilter();
    });
  });

  
  document.querySelectorAll('.filter-region label').forEach(filterregion => {
	let regionstatesIndex = 0;
    const checkbox = filterregion.querySelector('input[type="checkbox"]');
    const indicatorContainer = document.createElement('span');
    indicatorContainer.className = 'indicator-container';
    filterregion.prepend(indicatorContainer);


    filterregion.dataset.state = 'none';
	checkbox.checked = false;
	
	const regionId = checkbox.value;

    filterregion.addEventListener('click', e => {
      e.preventDefault();
	  const nextIndex = (states.indexOf(filterregion.dataset.state) + 1) % states.length;
	  
	  allRegionOR += orDelta[nextIndex];
	  allRegionAND += andDelta[nextIndex];

	  regionstatesIndex = nextIndex;
	  
	  const nextState = states[nextIndex];
      indicatorContainer.innerHTML = '';

      
      if (nextState !== 'none') {
        const orig = svgMap[nextState];
        if (orig) {
          const clone = orig.cloneNode(true);
          clone.removeAttribute('id');
          indicatorContainer.appendChild(clone);
        }
        checkbox.checked = true;
		regionParam.set(regionId, regionstatesIndex);
      } else {
        checkbox.checked = false;
		regionParam.delete(regionId);
      }

      filterregion.dataset.state = nextState;
	  
	  if (!instantFilterEnabled) startHeaderAnim(filterTime);
	  runFilter();
    });
  });
  
  
  
  let collectedstatesIndex = 0;
  const collectedswitch = document.querySelector('.collected-switch label');
  const checkboxcollectedswitch = collectedswitch.querySelector('input[type="checkbox"]');
  const indicatorContainercollectedswitch = document.createElement('span');
  indicatorContainercollectedswitch.className = 'indicator-container';
  collectedswitch.prepend(indicatorContainercollectedswitch);
  
  const collectedId = checkboxcollectedswitch.value;
  
  collectedswitch.dataset.state = 'none';
  checkboxcollectedswitch.checked = false;

  collectedswitch.addEventListener('click', e => {
    e.preventDefault();
    const nextIndex = (states.indexOf(collectedswitch.dataset.state) + 1) % states.length;
    collectedstatesIndex = nextIndex;
	  
	const nextState = states[nextIndex];

    indicatorContainercollectedswitch.innerHTML = '';

    if (nextState !== 'none') {
      const orig = svgMap[nextState];
      if (orig) {
        const clone = orig.cloneNode(true);
        clone.removeAttribute('id');
        indicatorContainercollectedswitch.appendChild(clone);
      }
      checkboxcollectedswitch.checked = true;
    } else {
      checkboxcollectedswitch.checked = false;
    }

    collectedswitch.dataset.state = nextState;
	  
	if (!instantFilterEnabled) startHeaderAnim(filterTime);
	runFilter();
  });
  
  
  
  FILTERSIDEBAR.filterClearBtn.addEventListener('click', () => {
	allIconsOR = 0;
	allIconsAND = 0;
	allRegionOR = 0;
	allRegionAND = 0;
	
	iconParam.clear(); 
	regionParam.clear();
	document.querySelectorAll('.filter-body label').forEach(label => {
	  iconstatesIndex = 0;
	  regionstatesIndex = 0;
	  collectedstatesIndex = 0;
	  const indicatorContainer = label.querySelector('.indicator-container');
	  const checkbox = label.querySelector('input[type="checkbox"]');
	  indicatorContainer.innerHTML = '';
	  checkbox.checked = false;
	  label.dataset.state = 'none';
	});
	
	if (!instantFilterEnabled) startHeaderAnim(filterTime);
	runFilter();
  });
};

const cache = new Map(); // key 0..15 -> матрица 4×4

function flagsKey(IA, IO, RA, RO) { // 4 бита
  return (IA<<3) | (IO<<2) | (RA<<1) | RO;
}

function buildTableDirect(IA, IO, RA, RO) {
  const HAS_AND = IA || RA;
  const HAS_OR  = IO || RO;
  const t = Array.from({ length: 4 }, () => new Uint8Array(4));

  for (let si = 0; si < 4; si++) for (let sr = 0; sr < 4; sr++) {
    let show = false;
    if (si !== 2 && sr !== 2) { // exclude-гейт
      if (!HAS_AND && !HAS_OR) {
        show = true;
      } else if (HAS_AND && !HAS_OR) {
        show = IA && RA ? (si===3 && sr===3) : IA ? (si===3) : (sr===3);
      } else if (!HAS_AND && HAS_OR) {
        show = (si===1 || sr===1);
      } else { // HAS_AND && HAS_OR
        if (!IA && !IO && RA && RO) show = (sr===3);
        else if (IA && IO && !RA && !RO) show = (si===3);
        else if (!IA && RA && IO) show = (sr===3 && si===1);
        else if (IA && !RA && RO) show = (si===3 && sr===1);
        else if (IA && RA) show = (si===3 && sr===3);
      }
    }
    t[si][sr] = show ? 1 : 0;
  }
  return t;
}

function getShowTable(IA, IO, RA, RO) {
  const key = flagsKey(IA, IO, RA, RO);
  let t = cache.get(key);
  if (!t) { t = buildTableDirect(IA, IO, RA, RO); cache.set(key, t); }
  return t;
}

function setFilterFast(existingMarkers, iconParam, regionParam, allIconsOR, allIconsAND, allRegionOR, allRegionAND) {
  const IA = allIconsAND  > 0, IO = allIconsOR  > 0;
  const RA = allRegionAND > 0, RO = allRegionOR > 0;

  const showTable = getShowTable(IA, IO, RA, RO);

  requestAnimationFrame(() => {
    for (const marker of existingMarkers.values()) {
      const si = iconParam.get(marker.options.icon_id) ?? 0;
      const sr = regionParam.get(marker.options.region) ?? 0;
      const next = !!showTable[si][sr];

      if (marker._$visible === next) continue;
      marker._$visible = next;

      const el = marker.getElement?.() || marker._icon;
      if (el) el.classList.toggle('is-hidden', !next);
      if (!next) { marker.closePopup?.(); marker.closeTooltip?.(); }
    }
  });
  stopHeaderAnim();
}
