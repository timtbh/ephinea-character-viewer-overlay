// TODO: find a CDN with the Hack typeface and stop bundling it
import hack from './css/hack.css?inline'
import style from './css/style.css?inline'
import colors from './css/colors.css?inline'
import img from './css/img.css?inline'

import { unitxt } from "./unitxt.js"
import { itemsEqual } from "./equal.js"
import { compareItems } from "./compare.js"
import { groupBy, range, keysEqual } from "./utils.js" 
import { showMain } from "./components/main-view.js"

import * as dom from "./dom.js"

const settingsDefaults = 
  { lang         : "en"
  , showStacked  : true
  , showSettings : false
  }

const sortAndStack = items => {
  if (!items.length) return []
  
  const flatten = (group, idx) => {
    const ungrouped = group.reduce((acc, item) => 
      ({ ...acc, quantity: acc.quantity + item.quantity })
    )
    return { ...ungrouped, slot: idx + 1 }
  }

  return (groupBy (itemsEqual) (items.toSorted(compareItems))).map(flatten)
}

const withStackedBank = viewer => {
  const characters = viewer.characters
    .map(character => ({ ...character, bank: sortAndStack(character.bank) }))

  const sharedBank =
    { size: viewer.sharedBank.size
    , bank: sortAndStack(viewer.sharedBank.bank)
    }

  return { ...viewer, characters, sharedBank }
}

const addItemGroups = viewer => {
  // We're not just grouping by item.category because we want ES weapons grouped
  // with other rare weapons.
  const typeOf = item =>
      item.category == "Weapon" && !item.rare
        ? "Common"
    : item.category == "Weapon" || item.category == "ESWeapon"
        ? "Rare"
        : item.category

  const sameType = (a, b) => typeOf(a) == typeOf(b)

  const everything =
    [ ...viewer.characters.flatMap(character => character.inventory)
    , ...viewer.characters.flatMap(character => character.bank)
    , ...viewer.sharedBank.bank
    ]
    .toSorted(compareItems)

  const grouped = (groupBy (sameType) (everything)).map(sortAndStack)

  const labels =
    { Common   : "Common Weapons"
    , Rare     : "Rare Weapons"
    , Frame    : "Frames"
    , Barrier  : "Barriers"
    , Unit     : "Units"
    , Mag      : "Mags"
    , TechDisk : "Techniques"
    , Tool     : "Tools"
    }

  const itemGroups = grouped.map(group => [labels[typeOf(group[0])], group])
  
  return { ...viewer, itemGroups }
}

const showOverlay = (viewer, settings) => {
  // do something with localStorage here?
  const settings_ = { ...settingsDefaults, ...settings }
  dom.select('#cvo-root').innerHTML =
    showMain(
      settings_.showStacked ? withStackedBank(viewer) : viewer ,
      unitxt[settings_.lang],
      settings_
    )
  dom.onReload()
}

const main = () => {
  // Login page
  if (!dom.characterDataIsLoaded())
    return

  dom.onLoad()

  const css = hack + style + colors + img
  dom.addClass(document.body, "cvo-hidden")
  dom.append(document.body, "style", { type: "text/css" }, css)
  dom.append(document.body, "div", { id: "cvo-root" })
  
  const viewer = addItemGroups(dom.getCharacterViewerData())

  // TODO: add new settings to localStorage
  document.addEventListener(
    "Settings Changed",
    event => {
      if (event.detail.changed == "stack settings") {
        const closest = dom.closestEntryId()
        showOverlay(viewer, dom.readSettingsFromDom())
        document.getElementById(closest).scrollIntoView()
      } else {
        showOverlay(viewer, dom.readSettingsFromDom())
      }
    }
  )

  showOverlay(viewer)
}

main()