/**
 * MTG Card Service - Fetches cards from the Scryfall API
 * 
 * Scryfall is the premier Magic: The Gathering card database API.
 * Documentation: https://scryfall.com/docs/api
 */

const BASE_URL = 'https://api.scryfall.com/cards';

// Get a random card
export async function getRandomCard() {
  const response = await fetch(`${BASE_URL}/random`);
  if (!response.ok) {
    throw new Error('Failed to fetch random card');
  }
  return response.json();
}

// Get a card by name
export async function getCardByName(name) {
  const response = await fetch(`${BASE_URL}/named?fuzzy=${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch card: ${name}`);
  }
  return response.json();
}

// Get a card by ID
export async function getCardById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch card with ID: ${id}`);
  }
  return response.json();
}

// Search for cards by query
export async function searchCards(query) {
  const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Failed to search cards with query: ${query}`);
  }
  return response.json();
}

// Get card image URL (oracle image)
export function getCardImageUrl(card) {
  if (!card) return null;
  
  // Prefer the large art card image if available
  if (card.image_uris) {
    return card.image_uris.large;
  }
  
  // Fallback to normal size
  if (card.card_faces) {
    // Double-faced cards
    return card.card_faces[0].image_uris?.large || card.card_faces[0].image_uris?.normal;
  }
  
  return null;
}

// Get card oracle text
export function getCardOracleText(card) {
  if (!card) return null;
  
  if (card.card_faces) {
    // Double-faced cards - return first face's text
    return card.card_faces[0].oracle_text;
  }
  
  return card.oracle_text;
}

// Get card mana cost
export function getCardManaCost(card) {
  if (!card) return null;
  
  if (card.card_faces) {
    return card.card_faces[0].mana_cost;
  }
  
  return card.mana_cost;
}

// Get card type line
export function getCardTypeLine(card) {
  if (!card) return null;
  
  if (card.card_faces) {
    return card.card_faces[0].type_line;
  }
  
  return card.type_line;
}

// Get card name
export function getCardName(card) {
  if (!card) return null;
  
  if (card.card_faces) {
    return card.card_faces[0].name;
  }
  
  return card.name;
}

// Check if card is a double-faced card
export function isDoubleFacedCard(card) {
  return !!(card && card.card_faces && card.card_faces.length > 1);
}

// Check if card is a modal double-faced card
export function isModalDoubleFacedCard(card) {
  return !!(card && card.card_faces && card.card_faces.length === 2);
}