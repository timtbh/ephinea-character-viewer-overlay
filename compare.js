import { pmt } from "./pmt.js"

const compareByPriority = (a, b, keys) =>
  keys.reduce((acc, [key, sort]) => acc || (
    sort == "asc"
      ? a[key] - b[key]
      : b[key] - a[key]
    ), 0)

const compareWeapons = (a, b) =>
  compareByPriority(
    a,
    b,
    [[ "rare"    , "asc"  ]
    ,[ "hex"     , "asc"  ]
    ,[ "special" , "desc" ]
    ,[ "hit"     , "desc" ]
    ,[ "grind"   , "desc" ]
    ]
  )

const compareEsWeapons = (a, b) =>
  compareByPriority(a, b, [["hex", "asc"], ["special", "desc"]])

const compareFrames = (a, b) =>
  compareByPriority(
    a, 
    b, 
    [[ "hex"   , "asc"  ]
    ,[ "dfp"   , "desc" ]
    ,[ "evp"   , "desc" ]
    ,[ "slots" , "desc" ]
    ]
  )

const compareBarriers = (a, b) =>
  compareByPriority(a, b, [["hex", "asc"], ["dfp", "desc"], ["evp", "desc"]])

const compareUnits = (a, b) => a.hex - b.hex

const compareMags = (a, b) => {
  // We don't really care how mags with different stats sort generally,
  // just that they sort equal when they're ALL the same* **
  //   * We don't care about synchro
  //   ** Though this sorts by general type anyways, pow-ish mags first
  const compared = compareByPriority(
    a,
    b,
    [[ "hex"  , "asc"  ]
    ,[ "def"  , "desc" ]
    ,[ "pow"  , "desc" ]
    ,[ "dex"  , "desc" ]
    ,[ "mind" , "desc" ]
    ,[ "iq"   , "desc" ]
    ]
  )

  return compared || a.color.localeCompare(b.color)
}

const compareTechDisks = (a, b) =>
  compareByPriority(a, b, [["hex", "asc"], ["level", "desc"]])

export const compareItems = (a, b) => {
  const cases =
    { "Weapon"   : compareWeapons
    , "ESWeapon" : compareEsWeapons
    , "Frame"    : compareFrames
    , "Barrier"  : compareBarriers
    , "Unit"     : compareUnits
    , "Mag"      : compareMags
    , "TechDisk" : compareTechDisks
    , "Tool"     : compareUnits // ¯\_(ツ)_/¯ ¯\_(ツ)_/¯ ¯\_(ツ)_/¯
    }

  const categories = Object.keys(cases)
  
  return a.category == b.category
    ? cases[a.category](a, b)
    : categories.indexOf(a.category) - categories.indexOf(b.category)
}