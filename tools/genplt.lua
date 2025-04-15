local bit = require "bit"

-- Util for generating player level stats tables from PlyLevelTbl.bin

local characters = {
  [0]  = { name = "HUmr", bonus = { atp = 10, ata = 650, hp = 2.00 } },
  [1]  = { name = "HUnl", bonus = { atp = 10, ata = 610, hp = 2.00 } },
  [2]  = { name = "HUct", bonus = { atp = 10, ata = 610, hp = 2.00 } },
  [3]  = { name = "RAmr", bonus = { atp =  5, ata = 760, hp = 1.85 } },
  [4]  = { name = "RAct", bonus = { atp =  5, ata = 710, hp = 1.85 } },
  [5]  = { name = "RAcl", bonus = { atp =  5, ata = 730, hp = 1.85 } },
  [6]  = { name = "FOml", bonus = { atp =  3, ata = 620, hp = 1.45 } },
  [7]  = { name = "FOnm", bonus = { atp =  3, ata = 600, hp = 1.45 } },
  [8]  = { name = "FOnl", bonus = { atp =  3, ata = 600, hp = 1.45 } },
  [9]  = { name = "HUcl", bonus = { atp = 10, ata = 680, hp = 2.00 } },
  [10] = { name = "FOmr", bonus = { atp =  3, ata = 620, hp = 1.45 } },
  [11] = { name = "RAml", bonus = { atp =  5, ata = 680, hp = 1.85 } },
}

local function readU8(str, offset)
  return str:byte(offset + 1)
end

local function readU16(str, offset)
  return bit.bor(
    bit.lshift(str:byte(offset + 2),  8),
               str:byte(offset + 1)
  )
end

local function readU32(str, offset)
  return bit.bor(
    bit.lshift(str:byte(offset + 4), 24),
    bit.lshift(str:byte(offset + 3), 16),
    bit.lshift(str:byte(offset + 2),  8),
               str:byte(offset + 1)
  )
end

local function codepointToUtf8(codepoint)
  if codepoint > 0xFFFF then
    return string.char(
      bit.bor(0xF0,                bit.rshift(codepoint, 18)),
      bit.bor(0x80, bit.band(0x3F, bit.rshift(codepoint, 12))),
      bit.bor(0x80, bit.band(0x3F, bit.rshift(codepoint,  6))),
      bit.bor(0x80, bit.band(0x3F, codepoint))
    )
  elseif codepoint > 0x7FF then
    return string.char(
      bit.bor(0xE0,                bit.rshift(codepoint, 12)),
      bit.bor(0x80, bit.band(0x3F, bit.rshift(codepoint,  6))),
      bit.bor(0x80, bit.band(0x3F, codepoint))
    )
  elseif codepoint > 0x7F then
    return string.char(
      bit.bor(0xC0, bit.rshift(codepoint, 6)),
      bit.bor(0x80, bit.band(0x3F, codepoint))
    )
  else
    return string.char(codepoint)
  end
end

-- Character names are 0-terminated.
-- This doesn't handle surrogates, so bugged for codepoints beyond the BMP.
local function readUtf16Str(str, offset)
  local eof   = string.len(str) - 2
  local chars = {}
  for idx = offset, eof, 2 do
    local codepoint = readU16(str, idx)
    if codepoint == 0 then
      return table.concat(chars)
    end
    table.insert(chars, codepointToUtf8(codepoint))
  end
  error("Unterminated UTF-16 string")
end

local function readArray(str, offset, read, n, sizeof)
  local xs = {}
  for idx = 0, n - 1 do
    xs[idx] = read(str, offset + idx * sizeof, idx)
  end
  return xs
end

local function clone(xs)
  local ys = {}
  for k, v in pairs(xs) do
    ys[k] = v
  end
  return ys
end

local function find(xs, v)
  for idx = 1, #xs do
    if xs[idx] == v then
      return idx
    end
  end
  return nil
end

-- No TP field in base stats, and always 0 in deltas,
-- but TP is just a function of MST and character level.
local function calculateTP(mst, class, level)
  if find({6, 7, 8, 10}, class) then
    return math.floor((mst + level) * 1.5)
  elseif find({0, 1, 3, 11}, class) then
    return mst + level
  else
    return 0
  end
end

-- sizeof = 14
local function readBaseStats(str, offset, class)
  local mst = readU16(str, offset +  2)
  local tp  = calculateTP(mst, class, 0)
  return {
    atp = readU16(str, offset +  0) + characters[class].bonus.atp,
    evp = readU16(str, offset +  4),
    hp  = readU16(str, offset +  6) * characters[class].bonus.hp,
    dfp = readU16(str, offset +  8),
    ata = readU16(str, offset + 10) + characters[class].bonus.ata,
    lck = readU16(str, offset + 12),
    mst = mst,
    tp  = tp
  }
end

-- sizeof = 12
local function readLevelDelta(str, offset)
  return {
    atp = readU8(str, offset + 0),
    mst = readU8(str, offset + 1),
    evp = readU8(str, offset + 2),
    hp  = readU8(str, offset + 3),
    dfp = readU8(str, offset + 4),
    ata = readU8(str, offset + 5),
    lck = readU8(str, offset + 6),
    -- +1 byte for tp (always 0) +4 bytes for xp
  }
end

-- sizeof = 200 * 12
local function readDeltas(str, offset)
  return readArray(str, offset, readLevelDelta, 200, 12)
end

local function generateTables(baseStats, deltas, class)
  -- Intentionally skipping the level 1 "delta" to avoid the phantom +1 hp
  local stats = clone(baseStats[class])
  local table = { [0] = clone(stats) }
  for idx = 1, 199 do
    local delta = deltas[class][idx]
    stats.hp  = stats.hp  + (delta.hp + 1) * characters[class].bonus.hp
    stats.mst = stats.mst + delta.mst
    stats.atp = stats.atp + delta.atp
    stats.dfp = stats.dfp + delta.dfp
    stats.ata = stats.ata + delta.ata
    stats.evp = stats.evp + delta.evp
    stats.lck = stats.lck + delta.lck
    stats.tp  = calculateTP(stats.mst, class, idx)
    table[idx] = clone(stats)
  end
  return table
end

local function readPLT(str)
  local mainOffset = readU32(str, #str - 16)

  -- Since the base stats/delta tables are contiguous we just follow the first pointer.
  local baseStatsOffset = readU32(str, readU32(str, mainOffset))
  local deltasOffset    = readU32(str, readU32(str, mainOffset + 4))

  local baseStats = readArray(str, baseStatsOffset, readBaseStats, 12, 14)
  local deltas    = readArray(str, deltasOffset, readDeltas, 12, 12 * 200)

  local tables = {}
  for class = 0, 11 do
    tables[class] = generateTables(baseStats, deltas, class)
  end
  return tables
end

local function loadFile(filename)
  local file = assert(io.open(filename, "rb"))
  local str  = file:read("*all")
  file:close()
  return str
end

local function writeFile(filename, str)
  local file = assert(io.open(filename, "w"))
  file:write(str)
  file:close()
end

local function showStats(stats, tokens, exclude)
  local ordered = {"hp", "tp", "atp", "mst", "ata", "dfp", "evp", "lck"}
  local exclude = exclude or {}
  local strings = {}
  for _, stat in ipairs(ordered) do
    if not find(exclude, stat) then
      table.insert(strings, stat .. tokens.tableAssign .. math.floor(stats[stat]))
    end
  end
  return tokens.tableOpen .. table.concat(strings, ",") .. tokens.tableClose
end

local function showStatsMultiple(stats, start, n, tokens, exclude)
  local strings = {}
  for level = start, start + n - 1 do
    table.insert(strings, showStats(stats[level], tokens, exclude))
  end
  return table.concat(strings, ", ")
end

local function serialize(plt, tokens, perRow, exclude)
  local perRow = perRow or 1

  local function indent(tabs)
    return string.rep(tokens.tab, tabs)
  end
  -- for table.join(..., <delimiter>)
  local arrayDelim = 
    "\n" .. indent(1) .. tokens.arrayClose .. ",\n" .. indent(1) .. tokens.arrayOpen .. "\n"

  local lines = {}
  for class = 0, 11 do
    local rows = {}
    for level = 0, 200 - perRow, perRow do
      local stats = plt[class]
      table.insert(
        rows,
        indent(2) .. showStatsMultiple(stats, level, perRow, tokens, exclude)
      )
    end
    table.insert(lines, table.concat(rows, ",\n"))
  end
  
  return table.concat({
    tokens.exportvar .. tokens.arrayOpen,
    indent(1) .. tokens.arrayOpen,
    table.concat(lines, arrayDelim),
    indent(1) .. tokens.arrayClose,
    tokens.arrayClose,
  }, "\n")
end

local js = {
  arrayOpen   = "[",
  arrayClose  = "]",
  tableOpen   = "{",
  tableClose  = "}",
  tableAssign = ":",
  tab         = "  ",
  exportvar   = "export const plt = "
}

local lua = {
  arrayOpen   = "{",
  arrayClose  = "}",
  tableOpen   = "{",
  tableClose  = "}",
  tableAssign = "=",
  tab         = "  ",
  exportvar   = "return "
}

local function main()
  local plt = readPLT(loadFile("PlyLevelTbl.bin"))
  local exclude = {"hp", "tp", "ata", "lck"}
  writeFile("src/plt.js", "// Generated from PlyLevelTbl.bin\n" .. serialize(plt, js, 5, exclude))
end

main()