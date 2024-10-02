// thanks-i-hate-it.js
import
  { readGuildCard
  , readAccountType
  , readCharacterInfo
  , readBankSize
  , readItem
  } from "./read.js"

// 1. helpers
const select = (query, element = document) =>
  element.querySelector(query)

const selectAll = (query, element = document) =>
  Array.from(element.querySelectorAll(query))

const text = (query, element = document) =>
  select(query, element).textContent.trim()

const textAll = (query, element = document) =>
  selectAll(query, element).map(element => element.textContent.trim())

const hasClass = (element, className) =>
  element.classList.contains(className)

const addClass = (element, className) =>
  element.classList.add(className)

const removeClass = (element, className) =>
  element.classList.remove(className)

const hasParentClass = (element, className) =>
    element.parentNode === null 
      ? false
  : hasClass(element, className)
      ? true
      : hasParentClass(element.parentNode, className)

const append = (parent, tag, attributes = {}, text = "") => {
  const element = document.createElement(tag)
  Object.entries(attributes)
    .forEach(([name, value]) => {
      element.setAttribute(name, value)
    })
  element.textContent = text
  return parent.appendChild(element)
}

const scrollTo = (query, behavior = "smooth") =>
  select(query).scrollIntoView({ behavior })

// 2. scraping the (original) DOM
const getCharacter = table => {
  const tds = textAll("td", table)

  // Can't rely on `textContent` because names with emojis are rendered with <img>
  const characterText = select("td:first-child font", table)
    .innerHTML
    .replace(/<\/?(?:b|i|strong|em)(?: [^>]+)?>/g, "") // strip styling tags
    .replace(/(?:&nbsp;|<br>|<br\>|\s)+/g, " ") // collapse whitespace
    .trim()

  const character = readCharacterInfo(characterText)

  const k = character.inventorySize
  
  const inventory = tds.slice(1, k + 1).map(readItem)
  const bank      = tds.slice(k + 2).map(readItem)
  const bankSize  = readBankSize(tds[k + 1])
  
  return { ...character, inventory, bank, bankSize }
}

const getSharedBank = table => {
  const tds = textAll("td", table)
  const size = readBankSize(tds[0])
  const bank = tds.slice(1).map(readItem)
  return { size, bank }
}

export const getCharacterViewerData = () => {
  const tables = selectAll("main > table")
  
  const guildCard   = readGuildCard(text("main"))
  const accountType = readAccountType(text("main p"))
  const characters  = tables.slice(0, -2).map(getCharacter)
  const sharedBank  = getSharedBank(tables.slice(-2)[0])
  const classicBank = getSharedBank(tables.slice(-1)[0])
      
  return { accountType, guildCard, characters, sharedBank, classicBank }
}

export const characterDataIsLoaded = () =>
  !!select("table")

// 3. &c.
export const openJumpMenu = () => removeClass(select("#jump-menu-wrapper"), "hide")
export const closeJumpMenu = () => addClass(select("#jump-menu-wrapper"), "hide")
export const jumpMenuIsOpen = () => !hasClass(select("#jump-menu-wrapper"), "hide")

const openSettingsDropdown = () => {
  removeClass(select("#options-dropdown"), "hide")
  addClass(select(".options-icon"), "open")
}

const closeSettingsDropdown = () => {
  addClass(select("#options-dropdown"), "hide")
  removeClass(select(".options-icon"), "open")
}

const settingsDropdownIsOpen = () =>
  !hasClass(select("#options-dropdown"), "hide")

export const closestEntryId = () =>
  selectAll(".cvo:not(.hide) > section")
    .reduce((acc, element) => {
      const curDistance = Math.abs(element.getBoundingClientRect().y)
      const accDistance = Math.abs(acc.getBoundingClientRect().y)
      return curDistance < accDistance
        ? element
        : acc
    }).getAttribute("id")

const scrollPrevEntry = () => {
  selectAll(".cvo:not(.hide) > section")
    .reduce((acc, element) => {
      const y = element.getBoundingClientRect().y
      return y < -1 && y > acc.getBoundingClientRect().y
        ? element
        : acc
    }).scrollIntoView()
}

const scrollNextEntry = () => {
  selectAll(".cvo:not(.hide) > section")
    .reduceRight((acc, element) => {
      const y = element.getBoundingClientRect().y
      return y > 1 && y < acc.getBoundingClientRect().y
        ? element
        : acc
    }).scrollIntoView()
}

const toggleLanguage = () => {
  select(".language-option:not(.language-selected)").click()
}

const toggleStackedBank = () => {
  select("#stack-items-checkbox").click()
}

const toggleJumpMenu = () => {
  if (jumpMenuIsOpen())
    closeJumpMenu()
  else
    openJumpMenu()
}

const toggleMainView = () => {
  const view1 = select("#cvo-character-view")
  const view2 = select("#cvo-item-type-view")
  const check = select("#stack-items-checkbox")
  
  if (hasClass(view1, "hide")) {
    removeClass(view1, "hide")
    addClass(view2, "hide")
    check.disabled = false
  } else {
    removeClass(view2, "hide")
    addClass(view1, "hide")
    check.disabled = true
  }
}

export const readSettingsFromDom = () => {
  const showSettings = settingsDropdownIsOpen()
  const showStacked = select("#stack-items-checkbox").checked
  const lang =
    select(".language-option.language-selected").getAttribute("data-lang")

  return { showStacked, lang, showSettings }
}

const hotkeys =
  { "Shift + L"  : toggleLanguage
  , "Shift + S"  : toggleStackedBank
  , "Shift + J"  : toggleJumpMenu
  , "Shift + V"  : toggleMainView
  , "ArrowLeft"  : scrollPrevEntry
  , "ArrowRight" : scrollNextEntry
  } 

const SettingsChanged = changed =>
  new CustomEvent("Settings Changed", { detail: { changed } })

// This is to be called just once, on document ready
export const onLoad = () => {
  document.addEventListener(
    "click",
    event => {
      if (jumpMenuIsOpen() && !hasParentClass(event.target, "jump-menu"))
        closeJumpMenu()

      if (settingsDropdownIsOpen && !hasParentClass(event.target, "options-dropdown"))
        closeSettingsDropdown()
    })

  document.addEventListener(
    "keyup",
    event => {
      const shortcut = event.shiftKey
        ? "Shift + " + event.key
        : event.key

      if (hotkeys[shortcut]) {
        hotkeys[shortcut]()
        event.preventDefault()
        event.stopPropagation()
      }
    })
}

// This should be called every time showOverlay(...) is called and the 
// overlay DOM is re-created
export const onReload = () => {
  selectAll(".character-details")
    .forEach(element => element.addEventListener(
      "click",
      event => {
        if (!jumpMenuIsOpen()) {
          openJumpMenu()
          event.stopPropagation()
        }
      }
    ))

  selectAll(".jump-menu-character")
    .forEach(element => element.addEventListener(
      "click",
      event => {
        scrollTo(element.dataset.shortcut)
        closeJumpMenu()
      }
    ))

  select(".language-en").addEventListener(
    "click",
    event => {
      if (!hasClass(event.target, "language-selected")) {
        addClass(event.target, "language-selected")
        removeClass(select(".language-jp"), "language-selected")
        document.dispatchEvent(SettingsChanged("language"))
      }
    }
  )

  select(".language-jp").addEventListener(
    "click",
    event => {
      if (!hasClass(event.target, "language-selected")) {
        addClass(event.target, "language-selected")
        removeClass(select(".language-en"), "language-selected")
        document.dispatchEvent(SettingsChanged("language"))
      }
    }
  )

  select(".options-icon").addEventListener(
    "click",
    event => {
      if (!settingsDropdownIsOpen()) {
        openSettingsDropdown()
        event.stopPropagation()
      }
    })

  select("#stack-items-checkbox").addEventListener(
    "change",
    event => {
      const showStacked = event.target.checked
      document.dispatchEvent(SettingsChanged("stack settings"))
    }
  )
}

export
  { select
  , selectAll
  , text
  , textAll
  , hasClass
  , addClass
  , removeClass
  , hasParentClass
  , append
  , scrollTo
  }