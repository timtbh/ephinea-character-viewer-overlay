import { pmt } from "./pmt.js"
import { unitxt } from "./unitxt.js"

const readGuildCard = str =>
  +str.match(/Outputting information for guildcard # (\d+).../)[1]

const readAccountType = str =>
  str.match(/^Account type: (\w+)$/)[1]

const regexCharacterInfo =
  /^(Classic\s+)?Character Slot (\d+) \((.+?)\) LV(\d+) (\w+) (\w+) \((\d+)\/30\):$/

const readCharacterInfo = str => {
  const match = str.match(regexCharacterInfo)
  return (
    { classic        : !!match[1]
    , slot           : (+match[2] % 4) + 1
    , cbank          : ~~(+match[2] / 4) + 1
    , name           : match[3]
    , level          : +match[4]
    , sectionId      : match[5]
    , characterClass : match[6]
    , inventorySize  : +match[7]
    })
}

const readBankSize = str =>
  +str.match(/Bank Inventory \((\d+)\/200\):$/)[1]

// Skinned items with <foo>* names resolve to the same hex as <foo>
// e.g.
//      lookupHex("Red Ring*, "Weapon") == lookupHex("Red Ring, "Weapon")
const lookupHex = (() => {
  //      { <hex>: { <pmtdata> } }
  //  ->  { <name>: <hex> }
  const makeLookupTable = (start, end) => Object.keys(pmt)
    .filter(hex => hex >= start && hex <= end)
    .reduce((acc, hex) =>
      ({ ... acc, [unitxt.en.items[hex]]: +hex }), {})

  const lookupTables =
    { Weapon   : makeLookupTable(0x000100, 0x00ED00)
    , ESWeapon : makeLookupTable(0x000100, 0x00ED00)
    , Frame    : makeLookupTable(0x010100, 0x010158)
    , Barrier  : makeLookupTable(0x010200, 0x0102B5)
    , Unit     : makeLookupTable(0x010300, 0x010364)
    , Mag      : makeLookupTable(0x020000, 0x030000)
    , Tool     : makeLookupTable(0x030000, 0x031A00)
    }

    return (name, category) =>
      lookupTables[category][name.replace(/\*$/, "")]
})()

const regexFrame = /^(\d+): (\[E\] )?(.+?) \(Slots: (\d)\) \(DFP\+(\d+) EVP\+(\d+)\)$/

const parseFrame = match =>
  ({ slot     : +match[1]
   , equipped : !!match[2]
   , name     : match[3]
   , slots    : +match[4]
   , dfp      : +match[5]
   , evp      : +match[6]
   , quantity : 1
   , category : "Frame"
   , hex      : lookupHex(match[3], "Frame")
   })

const regexBarrier = /^(\d+): (\[E\] )?(.+?) \(DFP\+(\d+) EVP\+(\d+)\)$/

const parseBarrier = match =>
  ({ slot     : +match[1]
   , equipped : !!match[2]
   , name     : match[3]
   , dfp      : +match[4]
   , evp      : +match[5]
   , quantity : 1
   , category : "Barrier"
   , hex      : lookupHex(match[3], "Barrier")
   })

const regexMag = new RegExp(
  [ "^(\\d+):"
  , "(\\[E\\] )?(.+?)"
  , "\\(Level: (\\d+) Synchro: (\\d+)% IQ: (\\d+)\\)"
  , "\\(DEF: x POW: x DEX: x MIND: x\\)".replaceAll("x", "(\\d+(?:\\.\\d+)?)")
  , "\\(Blasts: (.*?)(?:, )?\\)"
  , "\\s*\\(Color: (.+?)\\)$"
  ]
  .join(" ")
)

const parseMag = match =>
  ({ slot     : +match[1]
   , equipped : !!match[2]
   , name     : match[3]
   , level    : +match[4]
   , synchro  : +match[5]
   , iq       : +match[6]
   , def      : Math.floor(+match[7])
   , pow      : Math.floor(+match[8])
   , dex      : Math.floor(+match[9])
   , mind     : Math.floor(+match[10])
   , pbs      : match[11] ? match[11].split(", ") : []
   , color    : match[12]
   , quantity : 1
   , category : "Mag"
   , hex      : lookupHex(match[3], "Mag")
   })

const specialId = str =>
  Math.max(unitxt.en.specials.indexOf(str), 0)

const regexWeapon = new RegExp(
  [ "^(\\d+): "
  , "(\\[E\\] )?"
  , `(${unitxt.en.specials.slice(1).join("|")})? `
  , "?(.+?) "
  , "(\\+\\d+ )?"
  , "\\[x\\/x\\/x\\/x\\|x\\]".replaceAll("x", "(\-?\\d+)")
  , "( \\(UNTEKKED\\))?"
  , "(?: \\(Kills: (\\d+)\\))?$"
  ].join("")
)

const parseWeapon = match => {
  const getPmtSpecial = hex =>
    unitxt.en.specials[pmt[hex].special]

  // Handle rare weapon names that start with the name of a special
  // e.g. "<Heart> of Poumn", "<Dark> Flow", "<Burning> Visit" etc.
  const maybeName = match.slice(3, 5).join(" ")
  const maybeHex = lookupHex(maybeName, "Weapon")

  if (maybeHex)
    return parseWeapon_(match, maybeHex, maybeName, getPmtSpecial(maybeHex))

  const name = match[4]
  const special = match[3]
  const hex = lookupHex(name, "Weapon")

  // common weapon with special
  if (unitxt.en.specials.includes(special))
    return parseWeapon_(match, hex, name, special)

  // rare weapon, or common weapon with no special
  return parseWeapon_(match, hex, name, getPmtSpecial(hex))
}

const parseWeapon_ = (match, hex, name, special) =>
  ({ slot     : +match[1]
   , equipped : !!match[2]
   , special  : specialId(special)
   , name     : name
   , grind    : +match[5] || 0
   , native   : +match[6]
   , abeast   : +match[7]
   , machine  : +match[8]
   , dark     : +match[9]
   , hit      : +match[10]
   , untekked : !!match[11]
   , kills    : +match[12] || 0
   , rare     : pmt[hex].rarity >= 9
   , quantity : 1
   , category : "Weapon"
   , hex      : hex
   })

const regexEsWeapon = /^(\d+): (\[E\] )?([A-Z]+) ([\-\w]+)(?: \((.+?)\))?( \+\d+)?$/

const parseEsWeapon = match =>
  ({ slot       : +match[1]
   , equipped   : !!match[2]
   , customName : match[3]
   , name       : match[4]
   , special    : specialId(match[5])
   , grind      : +match[6] || 0
   , quantity   : 1
   , category   : "ESWeapon"
   , hex        : lookupHex(match[4], "Weapon")
   })

const regexTechDisk = /^(\d+): (\w+) LV(\d+) disk$/

const parseTechDisk = match =>
  ({ slot     : +match[1]
   , name     : match[2]
   , level    : +match[3]
   , quantity : 1
   , category : "TechDisk"
   , hex      : lookupHex(match[2], "Tool")
   })

// catch-all for units and tools
const regexElse = /^(\d+): (\[E\] )?(.+?)(?: \(Kills: (\d+)\))?(?: x(\d+))?$/

const parseElse = match => {
  const name = match[3]
  const maybeHex = lookupHex(name, "Unit")

  if (maybeHex)
    return parseElse_(match, maybeHex, "Unit")

  return parseElse_(match, lookupHex(name, "Tool"), "Tool")
}

const parseElse_ = (match, hex, category) =>
  ({ slot     : +match[1]
   , equipped : !!match[2]
   , name     : match[3]
   , kills    : +match[4] || 0
   , quantity : +match[5] || 1                                    
   , category : category
   , hex      : hex
   })

const parseError = str =>
  ({ name: str, hex: -1 })

const readItem = str => {
  const cases =
    [[ regexFrame    , parseFrame ]
    ,[ regexBarrier  , parseBarrier ]
    ,[ regexWeapon   , parseWeapon ]
    ,[ regexEsWeapon , parseEsWeapon ]
    ,[ regexMag      , parseMag ]
    ,[ regexTechDisk , parseTechDisk ]
    ,[ regexElse     , parseElse ]
    ]

  for (const [regex, f] of cases) {
    const match = str.match(regex)
    if (match) {
      return f(match)
    }
  }
  
  return parseError(str)
}

export
  { readGuildCard
  , readAccountType
  , readCharacterInfo
  , readBankSize
  , readItem
  }