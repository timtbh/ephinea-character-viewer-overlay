local unitxt = require("solylib.unitxt")

local pmtPointer      = 0x00A8DC94

local pmtWeaponOffset = 0x00
local pmtArmorOffset  = 0x04
local pmtUnitOffset   = 0x08
local pmtToolOffset   = 0x0C
local pmtMagOffset    = 0x10
local pmtStarsOffset  = 0x2C

local nWeaponGroups = 238
local nToolGroups   = 27
local nSpecials     = 40

local function pmtIsLoaded()
  return pso.read_u32(pmtPointer) ~= 0
end

local function getUnitxtName(id)
  return unitxt.Read(1, id)
end

local function getUnitxtDesc(id)
  return unitxt.Read(3, id)
end

-- The stars table is just a byte array indexed by the same `id` field that
-- indexes unitxt. But the lowest ids are tools and they have no star values.
-- The lowest ids with star values are weapons.
local function readStars(id)
  local pmt   = pso.read_u32(pmtPointer)
  local stars = pso.read_u32(pmt + pmtStarsOffset)
  -- Weapons Group 0, Item 0 ("Saber")
  local saber = pso.read_u32(pso.read_u32(pmt) + 4)
  local minId = pso.read_u32(saber)

  return pso.read_u8(stars + id - minId)
end

local function hex(kind, group, index)
  return string.format("%02X%02X%02X", kind, group, index)
end

-- sizeof = 44
local function readWeapon(addr, group, index)
  local id = pso.read_u32(addr)
  return {
    id      = id,
    special = pso.read_u8(addr + 28),
    name    = getUnitxtName(id),
    desc    = getUnitxtDesc(id),
    stars   = readStars(id),
    hex     = hex(0, group, index)
  }
end

-- sizeof = 32
local function readArmor(addr, group, index)
  local id = pso.read_u32(addr)
  return {
    id       = id,
    dfprange = pso.read_u8(addr + 26),
    evprange = pso.read_u8(addr + 27),
    name     = getUnitxtName(id),
    desc     = getUnitxtDesc(id),
    stars    = readStars(id),
    hex      = hex(1, group + 1, index)
  }
end

-- sizeof = 20
local function readUnit(addr, group, index)
  local id = pso.read_u32(addr)
  return {
    id    = id,
    name  = getUnitxtName(id),
    desc  = getUnitxtDesc(id),
    stars = readStars(id),
    hex   = hex(1, 3, index)
  }
end

-- sizeof = 28
local function readMag(addr, group, index)
  local id = pso.read_u32(addr)
  return {
    id   = id,
    name = getUnitxtName(id),
    hex  = hex(2, index, 0)
  }
end

-- sizeof = 24
local function readTool(addr, group, index)
  local id = pso.read_u32(addr)
  return {
    id   = id,
    name = getUnitxtName(id),
    desc = getUnitxtDesc(id),
    hex  = hex(3, group, index)
  }
end

local function readGroup(ptr, memcpy, sizeof, group)
  local items     = {}
  local groupAddr = pso.read_u32(ptr) + group * 8
  local size      = pso.read_u32(groupAddr + 0)
  local addr      = pso.read_u32(groupAddr + 4)

  for index = 0, size - 1 do
    table.insert(items, memcpy(addr + sizeof * index, group, index))
  end
  return items
end

local function readGroups(ptr, memcpy, sizeof, size)
  local tables = {}
  for group = 0, size - 1 do
    table.insert(tables, readGroup(ptr, memcpy, sizeof, group))
  end
  return tables
end

local function readPmt()
  local pmt = pso.read_u32(pmtPointer)
  return {
    weapons  = readGroups(pmt + pmtWeaponOffset, readWeapon, 44, nWeaponGroups),
    tools    = readGroups(pmt + pmtToolOffset, readTool, 24, nToolGroups),
    frames   = readGroup(pmt + pmtArmorOffset, readArmor, 32, 0),
    barriers = readGroup(pmt + pmtArmorOffset, readArmor, 32, 1),
    units    = readGroup(pmt + pmtUnitOffset, readUnit, 20, 0),
    mags     = readGroup(pmt + pmtMagOffset, readMag, 28, 0)
  }
end

-- The indices of technique names in unitxt table 1 seem to fit between the
-- highest weapon `id` and the (weapons) "????" id. If there is a more reliable
-- way to get these ids, it's not by reading the pmt special structs:
-- they are only 4 bytes = "family" (2 bytes) + "level" (2 bytes)
local function readSpecialNames()
  local pmt = pso.read_u32(pmtPointer)
  -- "????" is the first/only row in the last weapons group.
  local lastGroup = readGroup(pmt + pmtWeaponOffset, readWeapon, 44, nWeaponGroups - 1)
  local startId = lastGroup[1].id - nSpecials

  local names = {}
  for id = startId, startId + nSpecials - 1 do
    table.insert(names, getUnitxtName(id))
  end
  return names
end

return {
  pmtIsLoaded      = pmtIsLoaded,
  readPmt          = readPmt,
  readSpecialNames = readSpecialNames
}