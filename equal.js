import { keysEqual, arraysEqual } from "./utils.js"

const framesEqual = (a, b) => keysEqual(a, b, "name", "dfp", "evp", "slots")

const barriersEqual = (a, b) => keysEqual(a, b, "name", "dfp", "evp")

const unitsEqual = (a, b) => keysEqual(a, b, "name")

const techDisksEqual = (a, b) => keysEqual(a, b, "name", "level")

const weaponsEqual = (a, b) =>
  keysEqual(
    a,
    b,
    "name",
    "special",
    "grind",
    "native",
    "abeast",
    "machine",
    "dark",
    "hit",
    "untekked",
    "kills"
  )

const esWeaponsEqual = (a, b) =>
  keysEqual(
    a,
    b,
    "name",
    "customName",
    "special",
    "grind"
  )
    

const magsEqual = (a, b) =>
  keysEqual(
    a,
    b,
    "name",
    "level",
    "synchro",
    "iq",
    "def",
    "pow",
    "dex",
    "mind",
    "color"
  ) && arraysEqual(a.pbs, b.pbs)

export const itemsEqual = (a, b) => {
  const cases =
    { "Weapon"   : weaponsEqual
    , "ESWeapon" : esWeaponsEqual
    , "Frame"    : framesEqual
    , "Barrier"  : barriersEqual
    , "Unit"     : unitsEqual
    , "Mag"      : magsEqual
    , "TechDisk" : techDisksEqual
    , "Tool"     : unitsEqual // ¯\_(ツ)_/¯
    }

  return a.category !== b.category
    ? false
    : cases[a.category](a, b)
}