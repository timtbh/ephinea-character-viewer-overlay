// plaintext; export format and debug output
// TODO: update functions hardcoded to en unitxt
import { pmt } from '/pmt.js'
import { unitxt } from '/unitxt.js'

export const defaults =
  { showSlot: false
  , showEquipped: true
  , showRareSpecials: true
  , showQuantity: true
  }

const showSlot = (item, settings) =>
  settings.showSlot ? `${item.slot}: ` : ""

const showEquipped = (item, settings) =>
  settings.showEquipped && item.equipped
    ? "[E] "
    : ""

const showUntekked = item =>
  item.untekked ? "[U] " : ""

const showGrind = item =>
  item.grind ? `+${item.grind} ` : ""

const showSpecial = (item, settings) =>
  item.special && (!item.rare || settings.showRareSpecials)
    ? `[${unitxt.en.specials[item.special]}] `
    : ""

const showKills = item =>
  [0x003300, 0x00AB00, 0x01034D, 0x01034F].includes(item.hex)
    ? ` [${item.kills}K]` 
    : ""

const showQuantity = (item, settings) =>
  settings.showQuantity && item.quantity > 1
    ? ` x${item.quantity}` 
    : ""

const showWeapon = (item, settings) => {
  const { slot, name } = item
  const untekked = showUntekked(item)
  const special = showSpecial(item, settings)
  const grind = showGrind(item)
  const kills = showKills(item)
  const stats =
    `[${item.native}/${item.abeast}/${item.machine}/${item.dark}|${item.hit}]`
  
  return `${showSlot(item, settings)}${untekked}${showEquipped(item, settings)}` +
         `${name} ${grind}${special}${stats}${kills}`
}

const showEsWeapon = (item, settings) =>
  `${showSlot(item, settings)}S-RANK ${item.name} ` +
  `${item.customName} ${showGrind(item)}${showSpecial(item, settings)}`

const showFrame = (item, settings) => {
  const { slot, name, dfp, evp, slots } = item
  const dfpRange = pmt[item.hex].dfpRange
  const evpRange = pmt[item.hex].evpRange
  const equipped = showEquipped(item, settings)
  return `${showSlot(item, settings)}${equipped}${name} ` +
         `[${dfp}/${dfpRange} | ${evp}/${evpRange}] [${slots}S]`
}

const showBarrier = (item, settings) => {
  const { slot, name, dfp, evp } = item
  const dfpRange = pmt[item.hex].dfpRange
  const evpRange = pmt[item.hex].evpRange
  const equipped = showEquipped(item, settings)
  return `${showSlot(item, settings)}${equipped}${name} ` +
         `[${dfp}/${dfpRange} | ${evp}/${evpRange}]`
}

const showMag = (item, settings) => {
  const { slot, name, level, iq, synchro, color } = item
  const pbs = item.pbs.map(pb => pb[0]).join("|")
  const stats =
    `[${item.def}/${item.pow}/${item.dex}/${item.mind}]`

  return `${showSlot(item, settings)}${showEquipped(item, settings)}` +
         `${name} ${stats} [${pbs}] [${color}]`
}

const showTechDisk = (item, settings) =>
  `${showSlot(item, settings)}${item.name} Lv${item.level}`

const showUnit = (item, settings) =>
  `${showSlot(item, settings)}${showEquipped(item, settings)}` +
  `${item.name}${showKills(item)}`

const showTool = (item, settings) =>
  `${showSlot(item, settings)}${item.name}${showQuantity(item, settings)}`

export const showItemTxt = (item, settings) => {
  const cases =
    { "Weapon"   : showWeapon
    , "ESWeapon" : showEsWeapon
    , "Frame"    : showFrame
    , "Barrier"  : showBarrier
    , "Unit"     : showUnit
    , "Mag"      : showMag
    , "TechDisk" : showTechDisk
    , "Tool"     : showTool
    }

  return cases[item.category](item, { ...defaults, ...settings })
}