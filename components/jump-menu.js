import { range } from '/utils.js'

const characterAt = (characters, cbank, slot) =>
  characters.find (
    character => character.cbank == cbank && character.slot == slot
  )

const shortcut = (cbank, slot) =>
  `data-shortcut="#cvo-character-${cbank}-${slot}"`

const showCharacter = (character, cbank, slot) =>
  character
    ? `<div class="td jump-menu-character" ${shortcut(cbank, slot)}>
        <div class="flex-row flex-center">
          <div class="img secid ${character.sectionId}"></div>
          <div class="img avatar ${character.characterClass} class-avatar"></div>
          <div class="character-name">${character.name}&nbsp;</div>
          <div class="lowerlight">Lv${character.level}</div>
        </div>
      </div>`
       
    : `<div class="td jump-menu-character character-slot-empty">
        <span class="lowerlight">---</span>
      </div>`

const showCbank = (characters, cbank) =>
  range(1, 4)
    .map(slot => showCharacter(characterAt(characters, cbank, slot), cbank, slot))
    .join("")

const showCharacters = characters =>
  range(1, 8)
    .map(cbank =>
      `<div class="tr">
        ${showCbank(characters, cbank)}
      </div>`)
    .join("")

export const showJumpMenu = (viewer, unitxt) => {
  const classicBankLink =
    viewer.classicBank.size > 0
      ? `<div class="jump-menu-character jump-menu-shared" data-shortcut="#cvo-classic-bank">
            CLASSIC BANK
          </div>`

      : ""

  return `
    <div id="jump-menu-wrapper" class="hide">
      <div class="jump-menu">
        <div class="table">
          ${showCharacters(viewer.characters)}
        </div>
        <div class="flex-row flex-center">
          <div class="jump-menu-character jump-menu-shared" data-shortcut="#cvo-shared-bank">
            SHARED BANK
          </div>
          ${classicBankLink}
        </div>
      </div>
    </div>`
}