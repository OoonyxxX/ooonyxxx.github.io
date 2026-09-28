export function debounce(fn, wait, { leading = false, trailing = true, maxWait } = {}) {
  let timerId, lastArgs, lastThis, lastCallTime, lastInvokeTime = 0, result;
  const now = () => Date.now();

  const invoke = (time) => {
    lastInvokeTime = time;
    const r = fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = undefined;
    result = r;
    return r;
  };

  const startTimer = (ms) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(timerExpired, ms);
  };

  const remainingWait = (time) => {
    const sinceLastCall   = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    const timeWaiting     = wait - sinceLastCall;
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - sinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time) => {
    if (lastCallTime === undefined) return true;
    const sinceLastCall   = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    return (sinceLastCall >= wait) || (sinceLastCall < 0) ||
           (maxWait !== undefined && sinceLastInvoke >= maxWait);
  };

  const leadingEdge = (time) => {
    lastInvokeTime = time;
    startTimer(wait);
    return leading ? invoke(time) : undefined;
  };

  const trailingEdge = (time) => {
    timerId = undefined;
    if (trailing && lastArgs !== undefined) {
      return invoke(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  };

  const timerExpired = () => {
    const time = now();
    if (shouldInvoke(time)) return trailingEdge(time);
    startTimer(remainingWait(time));
  };

  function debounced(...args) {
    const time = now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (shouldInvoke(time)) {
      if (timerId === undefined) return leadingEdge(time);
      startTimer(remainingWait(time));
    }
	
	if (timerId === undefined) startTimer(wait);
	
    return result;
  }
  

  debounced.cancel = () => {
    if (timerId) clearTimeout(timerId);
    timerId = lastArgs = lastThis = lastCallTime = undefined;
    lastInvokeTime = 0;
  };

  debounced.flush = () => {
    if (timerId === undefined) return result;
    return trailingEdge(now());
  };

  return debounced;
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const iconData = {
  blockType: "icons-grid",
  blocks: [
    {
      blockHeader: "Important",
      blockClass: "important",
      content: [
        {value: 'crypt', svgName: 'T_Icon_Map_Cryptv2'},
        {value: 'obelisk', svgName: 'T_Icon_Map_Obelisk'},
        {value: 'portal', svgName: 'T_Icon_Map_Portal'},
        {value: 'raccoonGrotto', svgName: 'T_Icon_Map_RaccoonGrottoV4'},
        {value: 'playerHome', svgName: 'T_Icon_Map_PlayerHome'},
        {value: 'tree', svgName: 'T_Icon_Map_Tree'},
        {value: 'snakeShrine', svgName: 'T_Icon_Map_SnakeShrine'},
        {value: 'totem', svgName: 'T_Icon_Map_Totem'},
        {value: 'wispCollector', svgName: 'T_Icon_Map_WispCollector'}
      ]
    },
    {
      blockHeader: "Guardians",
      blockClass: "guardians",
      content: [
        {value: 'fox', svgName: 'T_Icon_Map_GuardianTemple_Fox'},
        {value: 'raven', svgName: 'T_Icon_Map_GuardianTemple_Raven'},
        {value: 'stag', svgName: 'T_Icon_Map_GuardianTemple_Stag'},
        {value: 'ram', svgName: 'T_Icon_Map_GuardianTemple_Ram'},
        {value: 'wolf', svgName: 'T_Icon_Map_GuardianTemple_Wolf'},
        {value: 'bear', svgName: 'T_Icon_Map_GuardianTemple_Bear'},
      ]
    },
    {
      blockHeader: "Natural",
      blockClass: "natural",
      content: [
        {value: 'waterfall', svgName: 'T_Icon_Map_Waterfall'},
        {value: 'path', svgName: 'T_Icon_Map_Path'},
        {value: 'naturalRockTower', svgName: 'T_Icon_Map_NaturalRockTower'},
        {value: 'mountainPeak', svgName: 'T_Icon_Map_MountainPeak'},
        {value: 'lake', svgName: 'T_Icon_Map_Lake'},
        {value: 'hill', svgName: 'T_Icon_Map_Hill'},
        {value: 'cave', svgName: 'T_Icon_Map_Cave'},
      ]
    },
    {
      blockHeader: "Structures",
      blockClass: "structures",
      content: [
        {value: 'warTower', svgName: 'T_Icon_Map_WarTower'},
        {value: 'warGate', svgName: 'T_Icon_Map_WarGate'},
        {value: 'shipyard', svgName: 'T_Icon_Map_Shipyard'},
        {value: 'ruins', svgName: 'T_Icon_Map_Ruins'},
        {value: 'encampment', svgName: 'T_Icon_Map_Encampment'},
        {value: 'dwellingsStone', svgName: 'T_Icon_Map_Dwellings_Stone'},
        {value: 'dwellingsRuins', svgName: 'T_Icon_Map_Dwellings_Ruins'},
        {value: 'dwellingWood', svgName: 'T_Icon_Map_Dwelling_Wood'},
        {value: 'singleDwellingStone', svgName: 'T_Icon_Map_Single_Dwelling_Stone'},
        {value: 'bridge', svgName: 'T_Icon_Map_Bridge'},
        {value: 'ancientTowerV2', svgName: 'T_Icon_Map_AncientTower_V2'},
        {value: 'ancientTowerV1', svgName: 'T_Icon_Map_AncientTower'},
        {value: 'bearLighthouse', svgName: 'T_Icon_Map_BearLighthouse'},
      ]
    },
    {
      blockHeader: "Other",
      blockClass: "other",
      content: [
        {value: 'mysteryPOI', svgName: 'T_Icon_Map_MysteryPOI'},
        {value: 'default', svgName: 'T_Icon_Map_Generic'}
      ]
    },
  ]
}

const regionData = {
  blockType: "region-list",
  blocks: [
    {
      blockHeader: "Region",
      content: [
        {value: 'foxIsland', name: 'Fox Island'},
        {value: 'misthaven', name: 'Misthaven'},
        {value: 'mosswood', name: 'Mosswood'},
        {value: 'stormvale', name: 'Stormvale'},
        {value: 'frigidPeaks', name: 'Frigid Peaks'},
        {value: 'ashlands', name: 'Ashlands'},
        {value: 'ocean', name: 'Ocean'}
      ]
    }
  ]
}

const collectibleData = {
  blockType: "icons-grid",
  blocks: [
    {
      blockHeader: "Scrolls",
      blockClass: "collectible-scrolls",
      content: [
        {value: 'foxScrolls', svgName: 'T_Icon_Map_LoreFox'},
        {value: 'ravenScrolls', svgName: 'T_Icon_Map_LoreRaven'},
        {value: 'stagScrolls', svgName: 'T_Icon_Map_LoreStag'},
        {value: 'ramScrolls', svgName: 'T_Icon_Map_LoreRam'},
        {value: 'moonWolfScrolls', svgName: 'T_Icon_Map_LoreWolf'},//На будущее: сделать разделение
        {value: 'sunWolfScrolls', svgName: 'T_Icon_Map_LoreWolf'},//На будущее: сделать разделение
        {value: 'bearScrolls', svgName: 'T_Icon_Map_LoreBear'}
      ]
    },
    {
      blockHeader: "Chests",
      blockClass: "collectible-chests",
      content: [
        {value: 'chestCommon', svgName: 'T_Icon_Map_ChestCommon'},
        {value: 'chestUncommon', svgName: 'T_Icon_Map_ChestUncommon'},
        {value: 'chestRareFox', svgName: 'T_Icon_Map_ChestRareFox'},
        {value: 'chestRareRaven', svgName: 'T_Icon_Map_ChestRareRaven'},
        {value: 'chestRareStag', svgName: 'T_Icon_Map_ChestRareStag'},
        {value: 'chestRareRam', svgName: 'T_Icon_Map_ChestRareRam'},
        {value: 'chestRareSunWolf', svgName: 'T_Icon_Map_ChestRareSunWolf'},
        {value: 'chestRareMoonWolf', svgName: 'T_Icon_Map_ChestRareMoonWolf'},
        {value: 'chestRareBear', svgName: 'T_Icon_Map_ChestRareBear'},
      ]
    },
    {
      blockHeader: "Content",
      blockClass: "collectible-content",
      content: [
        {value: 'rune', svgName: 'T_Icon_Map_Rune'},
        {value: 'cosmetic', svgName: 'T_Icon_Map_Cosmetic'},
        {value: 'skill', svgName: 'T_Icon_Map_Skill'},
        {value: 'melody', svgName: 'T_Icon_Map_Melody'},
      ]
    },
    {
      blockHeader: "Other",
      blockClass: "collectible-other",
      content: [
        {value: 'extraWisp', svgName: 'T_Icon_Map_ExtraWisp'},
      ]
    },
  ]
}
// Создать необходимые иконки.
//
//
//
//


function iconGridGenerator(data){
  const grid = []
  const start = `						<div class="filter-body icons-grid">`
  grid.push(start)

  const body = []
  for (const block of data.blocks) {
    const blockStart = `
                  <div class="${block.blockClass}-icons-external">
                    <h5 class="iconsheader">${block.blockHeader}</h5>
                    <div class="${block.blockClass}-icons">
    `
    const content = []
    for (const item of block.content) {
      content.push(`
                          <label class="icon-item ${item.value}icon">
                            <input type="checkbox" value="${item.value}" class="iconcheckbox">
                            <img class="imgicon" src="/assets/svgiconimg/${item.svgName}.svg" alt="">
                            <img class="imgbackicon" src="/assets/svgiconimg/${item.svgName}.svg" alt="">
                          </label>
      `)
    }
    const blockEnd = `
                    </div>
                  </div>
    `
    body.push(blockStart);
    body.push(content.join("\n"));
    body.push(blockEnd);
  }
  grid.push(body.join("\n"));

  const end = `
                    </div>
  `
  grid.push(end)
  return grid.join("\n")
}

function regionListGenerator(data){
  const list = []
  for (const block of data.blocks) {
    const blockStart = `
                <h4 class="paramheader">${block.blockHeader}</h4>
                <div class="filter-body region-list">
    `
    const content = []
    for (const item of block.content) {
      content.push(`
                      <label id="region-${item.value}" class="region region-${item.value}"><input type="checkbox" value="${item.value}">${item.name}</label>
      `)
    }
    const blockEnd = `
                </div>
    `
    list.push(blockStart)
    list.push(content.join("\n"))
    list.push(blockEnd)
  }
  return list.join("\n")
}


export function htmlGenerator(dataType) {
  switch (dataType){
    case "icon-grid":
      return iconGridGenerator(iconData)
    case "collectible-grid":
      return iconGridGenerator(collectibleData)
    case "region-list":
      return regionListGenerator(regionData)
    default:
      throw new Error(`Unknown html type: ${dataType}`)
  };
}