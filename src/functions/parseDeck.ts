import { Card, Deck } from "../types";

// Section headers used by Moxfield/Archidekt/Arena exports, e.g. "SIDEBOARD:"
// or "Commander (1)". These are not cards, so they get skipped.
const SECTION_HEADER_REGEX =
  /^(about|deck|main ?deck|sideboard|commander|companion|maybeboard|considering|tokens?)\s*(\(\d+\))?\s*:?$/i;

// Arena's "About" section holds deck metadata ("Name My Deck"), not cards
const ABOUT_SECTION_REGEX = /^about$/i;

// Arena's deck name line. "Name Dropping" is the only real card whose name
// starts with "Name ", so it is the one thing this must not swallow.
const DECK_NAME_REGEX = /^name\s+(?!dropping\s*$)\S/i;

// Moxfield trailing printing info, e.g. "(TLA) 203" or "(PZNR) 203p" or "(2ED)"
const MOXFIELD_SET_REGEX = /\s\(([A-Za-z0-9]{2,6})\)(?:\s+([^\s]+))?\s*$/;

// Moxfield finish/category suffixes, e.g. "*F*", "*E*", "#Ramp"
const MOXFIELD_SUFFIX_REGEX = /\s(?:\*[A-Za-z]+\*|#[^\s]+)(?=\s|$)/g;

export const parseDeck = (text: string): Deck => {
  const trimmedText = text.trim();
  const lines = trimmedText ? trimmedText.split("\n") : [];
  const cards: Card[] = [];
  let inAboutSection = false;
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const sectionHeader = trimmedLine.match(SECTION_HEADER_REGEX);
    if (sectionHeader) {
      // A header runs until the next one, so this also ends the About section
      inAboutSection = ABOUT_SECTION_REGEX.test(sectionHeader[1]);
      return;
    }
    if (inAboutSection) return;

    // Check if this has a [CUSTOM] marker
    const hasCustomImage = /\[CUSTOM\]/i.test(trimmedLine);

    // Remove [CUSTOM] marker for parsing
    const lineWithoutCustomMarker = trimmedLine
      .replace(/\s*\[CUSTOM\]\s*/i, "")
      .trim();

    // Extract set information in brackets [SET:NUM]
    const setMatch = lineWithoutCustomMarker.match(/\[([^:]+):([^\]]+)\]/);
    let requestedSet = setMatch ? setMatch[1].trim() : undefined;
    let requestedCollectorNumber = setMatch ? setMatch[2].trim() : undefined;

    // Remove set information from the line for name/quantity parsing
    let remainder = lineWithoutCustomMarker
      .replace(/\s*\[[^\]]+\]\s*/g, " ")
      .replace(MOXFIELD_SUFFIX_REGEX, "")
      .trim();

    // Fall back to the Moxfield style "(SET) collectorNumber" suffix
    if (!requestedSet) {
      const moxfieldMatch = remainder.match(MOXFIELD_SET_REGEX);
      if (moxfieldMatch) {
        requestedSet = moxfieldMatch[1];
        requestedCollectorNumber = moxfieldMatch[2];
        remainder = remainder.slice(0, moxfieldMatch.index).trim();
      }
    }

    const match =
      remainder.match(/^(\d+)x?\s+(.+)$/) || remainder.match(/^(.+)$/);

    if (match) {
      const quantity = match[2] ? parseInt(match[1]) : 1;
      const name = match[2] || match[1];
      // A header that an earlier parse turned into a card looks like
      // "1x SIDEBOARD:", so check the name too and not just the whole line
      if (
        SECTION_HEADER_REGEX.test(name.trim()) ||
        DECK_NAME_REGEX.test(name.trim())
      ) {
        return;
      }
      cards.push({
        quantity,
        name: normaliseCardName(name),
        requestedSet,
        requestedCollectorNumber,
        hasCustomImage,
      });
    }
  });
  return {
    cards,
    numCards: countNumCards(cards),
    numUniqueCards: countUniqueCards(cards),
  };
};

// Moxfield separates the faces of a double faced card with "/", Scryfall uses "//"
const normaliseCardName = (name: string): string =>
  name.trim().replace(/\s+\/{1,2}\s+/g, " // ");

const countNumCards = (cards: Card[]): number => {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
};

const countUniqueCards = (cards: Card[]): number => {
  return cards.length;
};
