import { range, chunksOf, cssIdentifierFrom } from "../utils.js"
import { showItem, defaults } from "./item.js"
import { showJumpMenu } from "./jump-menu.js"

const showItemColumn = (items, unitxt, settings) =>
  items.map(item => `<div>${showItem(item, unitxt, settings)}</div>`).join("")

const showItems = (items, unitxt, itemsPerColumn, settings = defaults) => {
  const columns = range(0, Math.floor((items.length - 1) / itemsPerColumn))
    .map(idx => {
      const k = idx * itemsPerColumn
      return `
        <div style="flex-grow: 2">
          ${showItemColumn(items.slice(k, k + itemsPerColumn), unitxt, settings)}
        </div>`
    })

  return columns.join("")
}

const link = character =>
  `cvo-character-${character.cbank}-${character.slot}`

const showTraps = (characterClass, level) => {
  const casts = 
    { "HUcast"   : [11, 7, 7]
    , "HUcaseal" : [9, 10, 10]
    , "RAcast"   : [7, 9, 11]
    , "RAcaseal" : [7, 11, 9]
    }

  // TODO: replace this with unitxt lookup
  const traps = ["Damage trap", "Freeze trap", "Confuse trap"]

  if (!Object.keys(casts).includes(characterClass))
    return ""

  return traps.map((trap, idx) => {
    const numTraps = Math.min(20, 2 + Math.floor(level / casts[characterClass][idx]))
    return `
      <div class="traps slot-prefix">
        ${"&nbsp;".repeat(4)}
        ${trap} x${numTraps}
      </div>`
  }).join("")
}

const showMeseta = (meseta) => {
  const formatted = meseta.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `
    <div class="inventory-meseta">
      ${"&nbsp;".repeat(4)}
      <span class="meseta">◆ ${formatted}</span>
    </div>`
}

const showCharacter = (character, unitxt) =>
  `<section class="entry" id="${link(character)}">
    <div class="left-column">
      <div>
        <div class="column-label">CHARACTER 0${character.cbank}:0${character.slot}</div>
          <div class="character-details flex-row flex-center">
            <div class="img secid ${character.sectionId}"></div>
            <div class="img avatar ${character.characterClass} class-avatar"></div>
            <div class="character-name">${character.name}&nbsp;</div>
            <div class="lolight">Lv${character.level}</div>
            <div class="link-arrow">&#x293B;</div>
          </div>
      </div>
      <div class="column-label">INVENTORY (${character.inventorySize}/30)</div>
      <div class="inventory">
        ${showItems(character.inventory, unitxt, 50)}
        ${showMeseta(character.meseta)}
      </div>
    </div>
    <div class="right-column">
      <div class="column-label">BANK (${character.bankSize}/200)</div>
      <div class="flex-row flex-top">
        ${showItems(character.bank, unitxt, 50)}
      </div>
    </div>
  </section>`

const showCharacters = (characters, unitxt) =>
    characters.map(character => showCharacter(character, unitxt)).join("")

const showSingleColumnEntry = (items, itemsPerColumn, label, id, unitxt, settings) =>
  `<section class="entry" id="${id}">
    <div class="cvo-column single-column">
      <div class="column-label">
        ${label}
        <span class="link-arrow">&#x293B;</span>
      </div>
      <div class="flex-row flex-top">
        ${showItems(items, unitxt, itemsPerColumn, settings)}
      </div>
    </div>
  </section>`

const showSharedBank = (bank, unitxt) =>
  showSingleColumnEntry(
    bank.bank, 50, `SHARED BANK (${bank.size}/200)`, "cvo-shared-bank", unitxt
  )

const showClassicBank = (bank, unitxt) =>
  bank.size > 0
    ? showSingleColumnEntry(
        bank.bank, 50, `CLASSIC BANK (${bank.size}/200)`, "cvo-classic-bank", unitxt
      )
      
    : ""

const showItemTypeView = (viewer, unitxt) =>
  viewer.itemGroups
    .map(([label, items]) => {
      const itemsPerColumn = Math.ceil(items.length / 4)
      const id = cssIdentifierFrom(label)
      return showSingleColumnEntry(
        items, itemsPerColumn, label, id, unitxt, { showEquipped: false }
      )
    })
    .join("")

const showLanguageSelect = lang =>
  lang == "en"
    ? `<span class="language-option language-en language-selected" data-lang="en">EN</span> /
       <span class="language-option language-jp" data-lang="jp">日本語</span>`

    : `<span class="language-option language-en" data-lang="en">EN</span> /
       <span class="language-option language-jp language-selected" data-lang="jp">日本語</span>`

const showHeader =  ({ lang, showStacked, showSettings }) =>
  `<header id="cvo-header" class="cvo cvo-header">
    <div class="options-top flex-row flex-center">
      <div>
        ${showLanguageSelect(lang)}
      </div>
      <div class="options-menu">
        <div class="options-icon ${showSettings ? "open" : ""}"></div>
        <div id="options-dropdown" class="options-dropdown lolight ${showSettings ? "" : " hide"}">
          <label class="flex-row flex-center">
            <div>
              <input type="checkbox" id="stack-items-checkbox"${showStacked ? " checked" : ""}/>
              <span class="checkmark"></span>
            </div>
            <div>Sort/stack bank items</div>
          </label>
        </div>
      </div>
      <div class="save-icon"></div>
    </div>
  </header>`

export const showMain = (viewer, unitxt, settings) =>
  `${showHeader(settings)}
  <!-- sorted by character -->
  <main id="cvo-character-view" class="cvo">
    ${showJumpMenu(viewer, unitxt)}
    ${showCharacters(viewer.characters, unitxt)}
    ${showSharedBank(viewer.sharedBank, unitxt)}
    ${showClassicBank(viewer.classicBank, unitxt)}
  </main>
  
  <!-- sorted by item type -->
  <main id="cvo-item-type-view" class="cvo hide">
    ${showItemTypeView(viewer, unitxt)}
  </main>`