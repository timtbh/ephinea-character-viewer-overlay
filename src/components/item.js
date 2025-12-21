import { pmt } from '../pmt.js'
import { cssIdentifierFrom } from '../utils.js'

export const defaults =
  { showSlot: true
  , showEquipped: true
  , showRareSpecials: true
  , showQuantity: true
  }

export const showSlot = (item, settings) =>
  settings.showSlot
    ? `<span class="slot-prefix">${showPadding(item)}${item.slot}:</span>`
    : ""

const showEquipped = (item, settings) =>
  settings.showEquipped && item.equipped
    ? '[<span class="equipped">E</span>]'
    : ""

const showUntekked = item =>
  item.untekked ? '[<span class="untekked">U</span>]' : ""

const showGrind = item =>
  item.grind
    ? `<span class="weapon-grind">+${item.grind}</span>`
    : ""

const showSpecial = (item, unitxt, settings) =>
  item.special && (!item.rare || settings.showRareSpecials)
    ? `<span class="weapon-special">
        [<span class="special-${item.special}">${unitxt.specials[item.special]}</span>]
      </span>`
    : ""

const showKills = item =>
  [0x003300, 0x00AB00, 0x01034D, 0x01034F].includes(item.hex)
    ? `[<span class="killcount">${item.kills}K</span>]`
    : ""

const showQuantity = item =>
  item.quantity > 1
    ? `<span class="amount"> x${item.quantity}</span>`
    : ""

const showPadding = item =>
  "".padEnd((3 - item.slot.toString().length)*6, "&nbsp;")

const showAttributes = item =>
  Object.keys(item)
    .map(key => `data-${key}="${item[key]}"`)
    .join(" ")

// Weapons/Frames/Barriers/Units
const showName = (item, unitxt) => {
  // TODO: This is a hack to avoid double "**" for skinned mag names until
  // either the hex lookup handling or some other part of read.js is improved.
  // skinned weapon or barrier?
  const suffix =
    ["Weapon", "Barrier"].includes(item.category) && item.name.match(/\*$/)
      ? "*"
      : ""
  return (
    pmt[item.hex].stars < 9
      ? `<span class="common-name ${cssIdentifierFrom(item.name)}">
           ${unitxt.items[item.hex]}
         </span>`
      : `<span class="rare-name ${cssIdentifierFrom(item.name)}">
           ${unitxt.items[item.hex]}${suffix}
         </span>`
  )
}

const showWeapon = (item, unitxt, settings) => {
  const { native, abeast, machine, dark } = item

  const areas = [native, abeast, machine, dark]
    .map(stat =>`<span class="weapon-stat-${stat}">${stat}</span>`)
    .join("/")

  return `
    <div ${showAttributes(item)}>
      ${showSlot(item, settings)}
      ${showEquipped(item, settings)}
      ${showUntekked(item)}
      ${showName(item, unitxt)}
      ${showGrind(item)}
      ${showSpecial(item, unitxt, settings)}
      <span class="weapon-stats">
        [${areas}|<span class="hit-${item.hit}">${item.hit}</span>]
      </span>
      ${showKills(item)}
      ${showQuantity(item, settings)}
	  </div>`
}

const showEsWeapon = (item, unitxt, settings) =>
  `<div ${showAttributes(item)}>
     ${showSlot(item, settings)}
     ${showEquipped(item, settings)}
     ${showUntekked(item)}
     <span class="srank-name">S-RANK</span>
     <span class="mag-color">${unitxt.items[item.hex]}</span>
     <span class="es-custom-name">${item.customName}</span>
     ${showGrind(item)}
     ${showSpecial(item, unitxt, settings)}
     ${showQuantity(item, settings)}
   </div>`

const showFrame = (item, unitxt, settings) => {
  const { slot, name, dfp, evp, slots } = item
  const dfpRange = pmt[item.hex].dfpRange
  const evpRange = pmt[item.hex].evpRange

  const showStat = stat =>
    stat > 0
      ? `<span class="frame-stat">${stat}</span>`
      : `<span class="frame-stat-0">${stat}</span>`

  return `
    <div ${showAttributes(item)}>
      ${showSlot(item, settings)}
      ${showEquipped(item, settings)}
      ${showName(item, unitxt)}
		  <span class="frame-stats ${cssIdentifierFrom(item.name)}">
        [${showStat(dfp)}/${showStat(dfpRange)} |
         ${showStat(evp)}/${showStat(evpRange)}]
      </span>
		  <span class="frame-slots">[<span class="slots">${slots}S</span>]</span>
		  ${showQuantity(item, settings)}
    </div>`
}

const showBarrier = (item, unitxt, settings) => {
  const { slot, name, dfp, evp } = item
  const dfpRange = pmt[item.hex].dfpRange
  const evpRange = pmt[item.hex].evpRange

  const showStat = stat =>
    stat > 0
      ? `<span class="barrier-stat">${stat}</span>`
      : `<span class="barrier-stat-0">${stat}</span>`

  return `
    <div ${showAttributes(item)}>
		  ${showSlot(item, settings)}
      ${showEquipped(item, settings)}
		  ${showName(item, unitxt)}
		  <span class="barrier-stats">
        [${showStat(dfp)}/${showStat(dfpRange)} |
         ${showStat(evp)}/${showStat(evpRange)}]
      </span>
		  ${showQuantity(item, settings)}
		</div>`
}

const showUnit = (item, unitxt, settings) =>
  `<div ${showAttributes(item)}>
     ${showSlot(item, settings)}
     ${showEquipped(item, settings)}
     ${showName(item, unitxt)}
     ${showKills(item)}
     ${showQuantity(item, settings)}
   </div>`

const showMag = (item, unitxt, settings) => {
  const { def, pow, dex, mind } = item

  const stats = [def, pow, dex, mind]
    .map(stat => `<span class="mag-stat">${stat}</span>`)
    .join("/")

  const pbs = item.pbs
    .map(pb => `<span class="mag-pb">${pb[0]}</span>`)
    .join("|")

  // skinned?
  const suffix = item.name.match(/\*$/) ? "*" : ""
  return `
    <div ${showAttributes(item)}>
      ${showSlot(item, settings)}
		  ${showEquipped(item, settings)}
	    <span class="name mag-name ${cssIdentifierFrom(item.name)}">
        ${unitxt.items[item.hex]}${suffix}
      </span>
	    <span>[${stats}]</span>
	    <span>[${pbs}]</span>
	    <span>[<span class="mag-color">${item.color}</span>]</span>
	    ${showQuantity(item, settings)}
    </div>`
}

const showTechDisk = (item, unitxt, settings) => {
  const name = `${item.name} Lv${item.level}`
  return `
    <div ${showAttributes(item)}>
      ${showSlot(item, settings)}
      <span class="name tech-name ${cssIdentifierFrom(name)}">
        ${unitxt.items[item.hex]} Lv${item.level}
      </span>
      ${showQuantity(item)}
    </div>`
}

const showTool = (item, unitxt, settings) =>
  `<div ${showAttributes(item)}>
     ${showSlot(item, settings)}
     <span class="name tool-name ${cssIdentifierFrom(item.name)}">
       ${unitxt.items[item.hex]}
     </span>
     ${showQuantity(item, settings)}
   </div>`

export const showItem = (item, unitxt, settings) => {
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

  return cases[item.category](item, unitxt, { ...defaults, ...settings })
}