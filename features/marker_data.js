import { escapeHtml } from "./utilities.js"


export const COLLECTIBLELIST = [
  'extraWisp', 
  'loreGeneric', 
  'loreFox', 
  'loreRaven', 
  'loreStag', 
  'loreRam', 
  'loreWolf',
  'loreBear', 
  'chestCommon', 
  'chestUncommon', 
  'chestRareFox', 
  'chestRareRaven', 
  'chestRareStag',
  'chestRareRam', 
  'chestRareMoonWolf', 
  'chestRareSunWolf', 
  'chestRareBear'
]

const wealthMap = {
  "common": {"G":10,"B":5,"P":0},
  "uncommon": {"G":5,"B":10,"P":1},
  "rare": {"G":2,"B":5,"P":4},
  "turtle": {"G":0,"B":5,"P":2},
}

const wealthCost = {
  "G":1,
  "B":5,
  "P":20
}

export const RUNE_NAMES = {
  AbilityLoreDetection: "Lore Rune",
  AbilityGlide_1: "Glide Rune",
  AbilityIceWalker: "Ice Walker Rune",
  AbilitySuffering: "Rune of Suffering",
  AbilityMoonTail: "Moon Rune",
  AbilitySpiritSprint_1: "Spirit Sprint Rune",
  AbilityIronBoots: "Rune of the Drowned",
  AbilityEona: "Rune of Eona",
  AbilitySpiritForm_1: "Spirit Rune",
  AbilityDarkHeart: "Bright Heart Rune",
  AbilityGlide_2: "Lift Glide Rune",
  AbilityThornWalker: "Thorn Walker Rune",
  AbilityDash_1: "Fox Dash Rune",
  AbilityFlameCloak: "Flame Cloak Rune",
  AbilityWaterRune: "Water Rune",
  AbilityWispDetection: "Wisp Seeker Rune",
  AbilityRejuvinate: "Rune of Aetleyna",
};

export const COSMETIC_NAMES = {
  // Fur
  Skin_Midnight: "Midnight",
  Skin_Frostbite: "Frostbite",
  Skin_RedMarble: "Red Marble",
  Skin_Raven250: "Raven",
  Skin_Champaign: "Champaign",
  "Skin_RedFox-Classic": "Red Fox Classic",
  Skin_Freckles: "Freckles",
  Skin_GreyFox: "Grey Fox",
  "Skin_ArcticFox-Winter": "Winter Arctic Fox",
  Skin_Brown: "Brown",
  Skin_Fennec: "Desert",
  "Skin_Brown-Tuft": "Tuft Brown",
  Skin_Black: "Black",
  Skin_Vixen: "Vixen",

  // Eyes
  "Eyes_Blue-Brown": "Earth and Water",
  "Eyes_Blue-Dark": "Dark Blue",
  "Eyes_Pink-BigBaby": "Baby Pink",
  Eyes_DarkEvolution_Red: "Dark Evolution - Red",
  Eyes_Hazel: "Hazel",
  Eyes_DarkEvolution_Blue: "Dark Evolution - Blue",
  Eyes_DarkEvolution_Cyan: "Dark Evolution - Turquoise",
  Eyes_Piebald: "Piebald",
  Eyes_Purple: "Dark Lavender",
  Eyes_Teal: "Teal",
  Eyes_White: "White Eyes",
  Eyes_Evil: "Dichotomeye",
  "Eyes_Blue-BigBaby": "Baby Blue",
  "Eyes_Brown-Dark": "Dark Brown",
  "Eyes_Heterochromia-Green": "Earth and Forest",
  Eyes_Green: "Green",
  "Eyes_Grey-Stone": "Icy Grey",
  Eyes_Maroon: "Dark Maroon",
  Eyes_DarkEvolution_Orange: "Dark Evolution - Orange",
  Eyes_DarkEvolution_Green: "Dark Evolution - Green",
  "Eyes_Black-Void": "Void",
  "Eyes_White-Cataract": "Ancient White",
  "Eyes_Brown-Chocolate": "Chocolate Brown",
  Eyes_DarkEvolution_Purple: "Dark Evolution - Purple",
  Eyes_Snake: "Garganobi",
  Eyes_Heterochromia: "Fire and Ice",
  Eyes_Blue: "Blue",

  // Light essence / geode
  Geode_Purple: "Purple",
};

export const MELODY_NAMES = {
  'Melody_001': "Spirit of The North 2 Main Theme",
  'Melody_002': "Northern Lights Calling",
  'Melody_003': "Relic's Beaconing",
  'Melody_004': "Tender Beginnings",
  'Melody_005': "Arrival at the Haven",
  'Melody_006': "Serene Sanctuary",
  'Melody_007': "Witness to the Outcast",
  'Melody_008': "Vaults of the Forgotten",
  'Melody_009': "Prisoner of Darkness",
  'Melody_010': "The Palace of Peace",
  'Melody_011': "The Quiet Within",
  'Melody_012': "Red Death",
  'Melody_013': "The Great Expanse",
  'Melody_014': "The Forsaken Rises",
  'Melody_015': "Chased by Fire",
  'Melody_016': "Homes Desolation",
  'Melody_017': "The Tragic Escape",
  'Melody_018': "Where the Fjords Weep",
  'Melody_019': "Drifting in Silence",
  'Melody_020': "The Rune’s Light",
  'Melody_021': "Will of the Wisps",
  'Melody_022': "Mystery of the Ruins",
  'Melody_023': "The Song of Misthaven",
  'Melody_024': "Through the Mist",
  'Melody_025': "Temple of the Guardians",
  'Melody_026': "Song of Memory",
  'Melody_027': "Child of Sorrow",
  'Melody_028': "Rebirth of the Ancient Tree",
  'Melody_029': "Voice of the Fallen",
  'Melody_030': "The Rascal Raccoon",
  'Melody_031': "Through Sacred Halls",
  'Melody_032': "Prayer of the Ancients",
  'Melody_033': "Hymn of the Archives",
  'Melody_034': "The Weeping Raven",
  'Melody_035': "Fury of the Past",
  'Melody_036': "Into the Void",
  'Melody_037': "Through Tears We Mend",
  'Melody_038': "The Obelisk",
  'Melody_039': "The Calling",
  'Melody_040': "Eternal Harmony",
  'Melody_041': "Where Nature Dreams",
  'Melody_042': "The Scars of Corruption",
  'Melody_043': "Silent Compassion",
  'Melody_044': "Echoes of the Stag Tribe",
  'Melody_045': "Mystic Corridors",
  'Melody_046': "Oasis in the Dark",
  'Melody_047': "The Grand View",
  'Melody_048': "The Fallen Stag",
  'Melody_049': "Wrath of the Mosswood Guardian",
  'Melody_050': "Wandering the Highlands",
  'Melody_051': "Children of the Storm",
  'Melody_052': "The Lonely Hills",
  'Melody_053': "Tears for Another",
  'Melody_054': "The Path Through Stormvale",
  'Melody_055': "For Those Who Passed",
  'Melody_056': "The Gathering Storms",
  'Melody_057': "Weeping Winds",
  'Melody_058': "Beam of Light",
  'Melody_059': "Legacy of Stormvale",
  'Melody_060': "The Guardian of Stormvale",
  'Melody_061': "Stormbreaker",
  'Melody_062': "Dreaming of Home",
  'Melody_063': "The Tribe of Frigid Peaks",
  'Melody_064': "Across the Icy Heights",
  'Melody_065': "Lament of the Corrupted",
  'Melody_066': "Steps Across the Frost",
  'Melody_067': "Glacier Dreams",
  'Melody_068': "Marching Through Snow",
  'Melody_069': "Crimson Snow",
  'Melody_070': "Joy",
  'Melody_071': "Monastery of Guardian Wolves",
  'Melody_072': "Eclipse of Doom",
  'Melody_073': "Woven in Ash",
  'Melody_074': "Drums of Grimhold",
  'Melody_075': "Through the Silent Wasteland",
  'Melody_076': "Ashes of the Fallen",
  'Melody_077': "Desolate Plains",
  'Melody_078': "The Burnt Horizon",
  'Melody_079': "The Slumbering Furnace",
  'Melody_080': "Claws and Fire",
  'Melody_081': "Return of the Seven",
  'Melody_082': "The Healing of the Lost",
  'Melody_083': "Hope Remains",
  'Melody_084': "Where the Sky Glows",
  'Melody_085': "Where All Troubles Fade",
  'Melody_086': "Frozen Light Dance",
  'Melody_087': "A Quiet Farewell",
  'Melody_088': "Lonely Travels",
  'Melody_089': "Forest Has a Soul",
  'Melody_090': "Crystal Dreams",
  'Melody_091': "The Journey Unfolds",
  'Melody_092': "Path of Destiny",
  'Melody_093': "When Fate Calls"
}


export function markerMap(m) {
  const baseData = {
      id: m.id ?? 'temp', 
      name: m.name ?? 'Name_PlaceHolder', 
      description: m.description ?? 'Description_PlaceHolder', 
      icon_id: m.icon_id ?? 'default', 
      coords: {
        lat: m.lat ?? m.coords?.lat ?? 0,
        lng: m.lng ?? m.coords?.lng ?? 0
      }, 
      is_collectible: m.is_collectible ?? COLLECTIBLELIST.includes(m.icon_id),
      is_collected: m.is_collected ?? false
    }
  const fullData = {
    ...baseData,
    reg_id: m.reg_id ?? 'auto',
    under_ground: m.under_ground ?? false,
    height: m.height ?? 0,
    uaid: m.uaid ?? null,
    content: m.content ?? {},
    raw_rgbcolor: {
      r: m.color_r ?? m.raw_rgbcolor?.r ?? 255,
      g: m.color_g ?? m.raw_rgbcolor?.g ?? 255,
      b: m.color_b ?? m.raw_rgbcolor?.b ?? 255
    },
    edit_info: {
      created_at: m.created_at ?? null,
      updated_at: m.updated_at ?? null
    }
  }
  return {
    baseData: baseData,
    fullData: fullData
  }
}

export function invertMarkerMap(m) {
  const baseData = {
      id: m.id, 
      name: m.name, 
      description: m.description, 
      icon_id: m.icon_id, 
      lat: m.coords?.lat,
      lng: m.coords?.lng,
      is_collectible: m.is_collectible,
    }
  const fullData = {
    ...baseData,
    reg_id: m.reg_id,
    under_ground: m.under_ground ?? false,
    height: m.height,
    uaid: m.uaid,
    content: m.content,
    color_r: m.raw_rgbcolor?.r,
    color_g: m.raw_rgbcolor?.g,
    color_b: m.raw_rgbcolor?.b,
  }
  return fullData
}

export function getWealthPreset(wealthId){
  const preset = wealthMap[wealthId]
  if (!preset) return
  const cost = {}
  let max_cost = 0
  for (const [type, count] of Object.entries(preset)){
    const c = count * wealthCost[type]
    cost[type] = c
    max_cost += c
  }
  return {preset, cost, max_cost}
}

export function standartPopup(id, name, description, collectible) { 
  return `
    <b>${escapeHtml(name)}</b><br>
    ${escapeHtml(description)}<br>
    <label>
      <input 
        type="checkbox" 
        class="marker-collected" 
        data-id="${id}"
      >
      ${collectible ? 'Collected' : 'Visited'}
    </label>
    
  `
}

export function popupWithContent(id, name, description, content, collectible) { 
  const contentBlock = []
  if (content.wealthId) {
    const {preset, max_cost} = getWealthPreset(content.wealthId)
    const wealth = `
			<details class="popap-section collapsible">
				<summary class="collapsible__summary">
					<span>Max Wealth: ${max_cost}</span> <img class="collapsible__icon" src="/assets/othersvg/view_white.svg" alt="">
				</summary>

				<div class="collapsible__content">
					<label class="field">
						<span class="field__label">Green: ${preset.G}</span>
            <span class="field__label">Blue: ${preset.B}</span>
            <span class="field__label">Purple: ${preset.P}</span>
					</label>
				</div>
			</details>
    `
    contentBlock.push(wealth)
  }
  if (content.runes) {
    const runesBlock = []
    for (const rune of content.runes){
      const runeItem = `<span class="field__label">${RUNE_NAMES[rune]}</span>`
      runesBlock.push(runeItem)
    }

    const runes = `
			<details class="popap-section collapsible">
				<summary class="collapsible__summary">
					<span>Runes</span> <img class="collapsible__icon" src="/assets/othersvg/view_white.svg" alt="">
				</summary>

				<div class="collapsible__content">
          <label class="field">
            <span class="field__label">Drop ${content.runesDropAll ? "All" : "One"}</span>
          </label>
          
					<label class="field">
						${runesBlock.join("\n")}
					</label>
				</div>
			</details>
    `
    contentBlock.push(runes)
  }

  if (content.cosmetics) {
    const cosmeticsBlock = []
    for (const cosmetic of content.cosmetics){
      const cosmeticItem = `<span class="field__label">${COSMETIC_NAMES[cosmetic]}</span>`
      cosmeticsBlock.push(cosmeticItem)
    }

    const cosmetics = `
			<details class="popap-section collapsible">
				<summary class="collapsible__summary">
					<span>Cosmetics</span> <img class="collapsible__icon" src="/assets/othersvg/view_white.svg" alt="">
				</summary>

				<div class="collapsible__content">
          <label class="field">
            <span class="field__label">Drop ${content.cosmeticsDropAll ? "All" : "One"}</span>
            <span class="field__label">Drop Probability ${content.cosmeticsDropProbability * 100}%</span>
          </label>
          
					<label class="field">
						${cosmeticsBlock.join("\n")}
					</label>
				</div>
			</details>
    `
    contentBlock.push(cosmetics)
  }

  if (content.melody) {
    const m = ((content.melody !== "none") && (content.melody !== "any")) ? MELODY_NAMES[content.melody] : content.melody
    const melody = `
      <div class="__content">
        <label class="field">
          <span class="field__label">Melody: ${m}</span>
        </label>
      </div>
    `
    contentBlock.push(melody)
  }

  return `
    <b>${escapeHtml(name)}</b><br>
    ${escapeHtml(description)}<br>
    <label>
      <input 
        type="checkbox" 
        class="marker-collected" 
        data-id="${id}"
      >
      ${collectible ? 'Collected' : 'Visited'}
    </label>
    ${contentBlock.join("\n")}
  `
}
