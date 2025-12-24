local menu       = require("core_mainmenu")
local unitxt     = require("solylib.unitxt")
local pmt        = require("cvotools.pmt")
local duplicates = require("cvotools.duplicates")

local nTechniques = 19

local function escape(str)
  return (str:gsub("\"", "\\\""))
end

local function trim(str)
  return (str:gsub("^%s*(.-)%s*$", "%1"))
end

local function map(f, xs)
  local ys = {}
  for _, x in ipairs(xs) do
    table.insert(ys, f(x))
  end
  return ys
end

local function filter(p, xs)
  local ys = {}
  for _, x in ipairs(xs) do
    if p(x) then
      table.insert(ys, x)
    end
  end
  return ys
end

local function flatten(xss)
  local ys = {}
  for _, xs in ipairs(xss) do
    for _, x in ipairs(xs) do
      table.insert(ys, x)
    end
  end
  return ys
end

local function merge(...)
  local ys = {}
  for _, xs in ipairs({ ... }) do
    for _, x in ipairs(xs) do
      table.insert(ys, x)
    end
  end
  return ys
end

local function findBy(p, z, xs)
  for _, x in ipairs(xs) do
    if p(z, x) then
      return true
    end
  end
  return false
end

local function uniqueBy(p, xs)
  local ys = {}
  for _, x in ipairs(xs) do
    if not findBy(p, x, ys) then
      table.insert(ys, x)
    end
  end
  return ys
end

local function getTechniqueNames()
  local names = {}
  for idx = 0, nTechniques - 1 do
    table.insert(names, trim(unitxt.Read(5, idx)))
  end
  return names
end

local function getSpecialNames()
  local techs = getTechniqueNames()
  local units = pmt.readPmt().units
  local names = pmt.readSpecialNames()

  -- No special
  table.insert(names, 1, "")

  -- ES weapon specials
  -- For HP/TP regen, the effect is (per the wiki) the same (?) as */Revival
  -- Hack: for en, we use the soly addon naming conventions.
  local function hack(name)
    return (name:gsub("/Revival", " Regeneration"))
  end

  local hpRevival = units[0x36].name -- hex 010335
  local tpRevival = units[0x39].name -- hex 010338

  table.insert(names, techs[12]) -- Jellen
  table.insert(names, techs[13]) -- Zalure
  table.insert(names, hack(hpRevival))
  table.insert(names, hack(tpRevival))
  return names
end

-- The unitxt for all the technique disk tools are just " disk" with the actual
-- technique names pulled from their own table.
local function fixTechDiskNames(tools)
  local names = getTechniqueNames()
  for idx = 1, nTechniques do
    tools[3][idx].name = names[idx]
  end
  return tools
end

local function getItems()
  local itemPmt = pmt.readPmt()
  return {
    weapons = flatten(itemPmt.weapons),
    frames = itemPmt.frames,
    barriers = itemPmt.barriers,
    units = itemPmt.units,
    mags = itemPmt.mags,
    tools = flatten(fixTechDiskNames(itemPmt.tools))
  }
end

local function cwd()
  return (debug.getinfo(1).source:gsub("^@(.+/)[^/]+$", "%1"))
end

local function writeFile(str, filename)
  local file = assert(io.open(filename, "w"))
  file:write(str)
  file:close()
end

local function writeUnitxtJs()
  local function formatItem(item)
    return string.format("0x%s: \"%s\"", item.hex, escape(item.name))
  end

  local function formatSpecial(special)
    return string.format("\"%s\"", special)
  end

  local items = getItems()
  local specials = getSpecialNames()
  local allItems = merge(
    items.weapons,
    items.frames,
    items.barriers,
    items.units,
    items.mags,
    items.tools
  )

  local str = string.format(
    "export const unitxt =\n" ..
    "  { items:\n" ..
    "    { %s\n" ..
    "    }\n" ..
    "  , specials:\n" ..
    "    [ %s\n" ..
    "    ]\n" ..
    "  }",
    -- items
    table.concat(map(formatItem, allItems), "\n    , "),
    -- specials
    table.concat(map(formatSpecial, specials), "\n    , ")
  )
  writeFile(str, cwd() .. "unitxt.js")
end

-- Coerce specific items (duplicates.lua) to have the hex we want, then remove
-- other duplicates (mostly all the weapon and RR skins).
local function handleDuplicates(items)
  local function notBadDuplicate(item)
    return (not duplicates[item.name]) or
      (duplicates[item.name] == tonumber(item.hex, 16))
  end

  local function sameName(a, b)
    return a.name == b.name
  end

  return uniqueBy(sameName, filter(notBadDuplicate, items))
end

local function writePmtJs()
  -- Trailing pad for armor dfpRange/evpRange because they're decimal.
  local function pad(n)
    return string.rep(" ", 3 - string.len(tostring(n)))
  end

  local function formatWeapon(item)
    return string.format(
      "0x%s: { special: 0x%02X, stars: 0x%02X } // %s",
      item.hex,
      item.special,
      item.stars,
      item.name
    )
  end

  local function formatArmor(item)
    return string.format(
      "0x%s: { dfpRange: %d%s, evpRange: %d%s, stars: 0x%02X } // %s",
      item.hex,
      item.dfprange,
      pad(item.dfprange),
      item.evprange,
      pad(item.evprange),
      item.stars,
      item.name
    )
  end

  local function formatUnit(item)
    return string.format(
      "0x%s: { stars: 0x%02X } // %s",
      item.hex,
      item.stars,
      item.name
    )
  end

  local function formatElse(item)
    return string.format("0x%s: {} // %s", item.hex, item.name)
  end

  local items = getItems()
  local delimiter = "\n  , "

  local str = string.format(
    "export const pmt =\n" ..
    "  // Weapons\n" ..
    "  { %s\n" ..
    "  // Frames\n" ..
    "  , %s\n" ..
    "  // Barriers\n" ..
    "  , %s\n" ..
    "  // Units\n" ..
    "  , %s\n" ..
    "  // Mags\n" ..
    "  , %s\n" ..
    "  // Tools\n" ..
    "  , %s\n" ..
    "  }",
    table.concat(map(formatWeapon, handleDuplicates(items.weapons)), delimiter),
    table.concat(map(formatArmor, handleDuplicates(items.frames)), delimiter),
    table.concat(map(formatArmor, handleDuplicates(items.barriers)), delimiter),
    table.concat(map(formatUnit, handleDuplicates(items.units)), delimiter),
    table.concat(map(formatElse, handleDuplicates(items.mags)), delimiter),
    table.concat(map(formatElse, handleDuplicates(items.tools)), delimiter)
  )
  writeFile(str, cwd() .. "pmt.js")
end

-- ui --
local show = false

local function saveButtons()
  if imgui.Button("Save unitxt.js") then
    writeUnitxtJs()
  end
  if imgui.Button("Save pmt.js") then
    writePmtJs()
  end
end

local function present()
  if not show then
    return
  end

  local success
  success, show = imgui.Begin("cvo tools", show)

  if pmt.pmtIsLoaded() then
    saveButtons()
  else
    imgui.Text("Waiting for login")
  end

  imgui.End()
end

local function init()
  menu.add_button("cvo tools", function ()
    show = not show
  end)

  return { present = present }
end

return {
  __addon = { init = init }
}