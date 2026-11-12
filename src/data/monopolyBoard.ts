export type MonopolyTileType =
  | 'go'
  | 'property'
  | 'rail'
  | 'air'
  | 'cruise'
  | 'space'
  | 'utility'
  | 'chance'
  | 'community'
  | 'tax'
  | 'freeParking'
  | 'jail'
  | 'goToJail'
  | 'quiz'
  | 'reward'
  | 'portal'
  | 'rest';

export interface MonopolyTile {
  id: number;
  type: MonopolyTileType;
  name: string;
  icon: string;
  country?: string;
  groupId?: string;
  groupColor?: string;
  price?: number;
  rent?: number;
  rentSchedule?: number[];
  developmentCost?: number;
  portalTarget?: number;
}

export const MONOPOLY_BOARD: MonopolyTile[] = [
  { id: 0, type: 'go', name: 'GO', icon: '🚩' },
  { id: 1, type: 'property', name: 'Jakarta', country: 'Indonesia', groupId: 'brown', groupColor: '#8b5a2b', price: 60, rent: 2, rentSchedule: [2, 10, 30, 90, 160, 250], developmentCost: 50, icon: '🏙️' },
  { id: 2, type: 'community', name: 'Community Chest', icon: '📦' },
  { id: 3, type: 'property', name: 'Bali', country: 'Indonesia', groupId: 'brown', groupColor: '#8b5a2b', price: 80, rent: 4, rentSchedule: [4, 20, 60, 180, 320, 450], developmentCost: 50, icon: '🏝️' },
  { id: 4, type: 'tax', name: 'Income Tax', icon: '🪙', price: 200 },
  { id: 5, type: 'rail', name: 'World Rail', icon: '🚆', price: 200, rentSchedule: [25, 50, 100, 200] },
  { id: 6, type: 'property', name: 'Bangkok', country: 'Thailand', groupId: 'light-blue', groupColor: '#8ed6f5', price: 100, rent: 6, rentSchedule: [6, 30, 90, 270, 400, 550], developmentCost: 50, icon: '🏙️' },
  { id: 7, type: 'chance', name: 'Chance', icon: '❔' },
  { id: 8, type: 'property', name: 'Singapore', country: 'Singapore', groupId: 'light-blue', groupColor: '#8ed6f5', price: 100, rent: 6, rentSchedule: [6, 30, 90, 270, 400, 550], developmentCost: 50, icon: '🌆' },
  { id: 9, type: 'property', name: 'Kuala Lumpur', country: 'Malaysia', groupId: 'light-blue', groupColor: '#8ed6f5', price: 120, rent: 8, rentSchedule: [8, 40, 100, 300, 450, 600], developmentCost: 50, icon: '🌇' },
  { id: 10, type: 'jail', name: 'Jail / Just Visiting', icon: '🔒' },
  { id: 11, type: 'property', name: 'Tokyo', country: 'Japan', groupId: 'pink', groupColor: '#e889b5', price: 140, rent: 10, rentSchedule: [10, 50, 150, 450, 625, 750], developmentCost: 100, icon: '🗼' },
  { id: 12, type: 'utility', name: 'Solar Energy', icon: '☀️', price: 150 },
  { id: 13, type: 'property', name: 'Kyoto', country: 'Japan', groupId: 'pink', groupColor: '#e889b5', price: 140, rent: 10, rentSchedule: [10, 50, 150, 450, 625, 750], developmentCost: 100, icon: '⛩️' },
  { id: 14, type: 'property', name: 'Osaka', country: 'Japan', groupId: 'pink', groupColor: '#e889b5', price: 160, rent: 12, rentSchedule: [12, 60, 180, 500, 700, 900], developmentCost: 100, icon: '🏙️' },
  { id: 15, type: 'air', name: 'World Air', icon: '✈️', price: 200, rentSchedule: [25, 50, 100, 200] },
  { id: 16, type: 'property', name: 'Mumbai', country: 'India', groupId: 'orange', groupColor: '#ed9b45', price: 180, rent: 14, rentSchedule: [14, 70, 200, 550, 750, 950], developmentCost: 100, icon: '🌇' },
  { id: 17, type: 'community', name: 'Community Chest', icon: '📦' },
  { id: 18, type: 'property', name: 'Dubai', country: 'United Arab Emirates', groupId: 'orange', groupColor: '#ed9b45', price: 180, rent: 14, rentSchedule: [14, 70, 200, 550, 750, 950], developmentCost: 100, icon: '🏙️' },
  { id: 19, type: 'property', name: 'Istanbul', country: 'Türkiye', groupId: 'orange', groupColor: '#ed9b45', price: 200, rent: 16, rentSchedule: [16, 80, 220, 600, 800, 1000], developmentCost: 100, icon: '🕌' },
  { id: 20, type: 'freeParking', name: 'Free Parking', icon: '🅿️' },
  { id: 21, type: 'property', name: 'Paris', country: 'France', groupId: 'red', groupColor: '#df5555', price: 220, rent: 18, rentSchedule: [18, 90, 250, 700, 875, 1050], developmentCost: 150, icon: '🗼' },
  { id: 22, type: 'chance', name: 'Chance', icon: '❔' },
  { id: 23, type: 'property', name: 'Rome', country: 'Italy', groupId: 'red', groupColor: '#df5555', price: 220, rent: 18, rentSchedule: [18, 90, 250, 700, 875, 1050], developmentCost: 150, icon: '🏛️' },
  { id: 24, type: 'property', name: 'London', country: 'United Kingdom', groupId: 'red', groupColor: '#df5555', price: 240, rent: 20, rentSchedule: [20, 100, 300, 750, 925, 1100], developmentCost: 150, icon: '🎡' },
  { id: 25, type: 'cruise', name: 'World Cruise', icon: '🚢', price: 200, rentSchedule: [25, 50, 100, 200] },
  { id: 26, type: 'property', name: 'New York', country: 'United States', groupId: 'yellow', groupColor: '#f3d54e', price: 260, rent: 22, rentSchedule: [22, 110, 330, 800, 975, 1150], developmentCost: 150, icon: '🗽' },
  { id: 27, type: 'property', name: 'Toronto', country: 'Canada', groupId: 'yellow', groupColor: '#f3d54e', price: 260, rent: 22, rentSchedule: [22, 110, 330, 800, 975, 1150], developmentCost: 150, icon: '🏙️' },
  { id: 28, type: 'utility', name: 'Wind Energy', icon: '🌬️', price: 150 },
  { id: 29, type: 'property', name: 'Los Angeles', country: 'United States', groupId: 'yellow', groupColor: '#f3d54e', price: 280, rent: 24, rentSchedule: [24, 120, 360, 850, 1025, 1200], developmentCost: 150, icon: '🌴' },
  { id: 30, type: 'goToJail', name: 'Go To Jail', icon: '🚔' },
  { id: 31, type: 'property', name: 'Rio de Janeiro', country: 'Brazil', groupId: 'green', groupColor: '#54a66b', price: 300, rent: 26, rentSchedule: [26, 130, 390, 900, 1100, 1275], developmentCost: 200, icon: '🏖️' },
  { id: 32, type: 'property', name: 'Cape Town', country: 'South Africa', groupId: 'green', groupColor: '#54a66b', price: 300, rent: 26, rentSchedule: [26, 130, 390, 900, 1100, 1275], developmentCost: 200, icon: '🌍' },
  { id: 33, type: 'community', name: 'Community Chest', icon: '📦' },
  { id: 34, type: 'property', name: 'Nairobi', country: 'Kenya', groupId: 'green', groupColor: '#54a66b', price: 320, rent: 28, rentSchedule: [28, 150, 450, 1000, 1200, 1400], developmentCost: 200, icon: '🦒' },
  { id: 35, type: 'space', name: 'World Space', icon: '🚀', price: 200, rentSchedule: [25, 50, 100, 200] },
  { id: 36, type: 'chance', name: 'Chance', icon: '❔' },
  { id: 37, type: 'property', name: 'Sydney', country: 'Australia', groupId: 'blue', groupColor: '#4668c8', price: 350, rent: 35, rentSchedule: [35, 175, 500, 1100, 1300, 1500], developmentCost: 200, icon: '🌉' },
  { id: 38, type: 'tax', name: 'Super Tax', icon: '💸', price: 100 },
  { id: 39, type: 'property', name: 'Reykjavík', country: 'Iceland', groupId: 'blue', groupColor: '#4668c8', price: 400, rent: 50, rentSchedule: [50, 200, 600, 1400, 1700, 2000], developmentCost: 200, icon: '🌌' },
];

export function getMonopolyGridPosition(index: number): { row: number; column: number } {
  if (index >= 0 && index <= 10) return { row: 11, column: 11 - index };
  if (index >= 11 && index <= 20) return { row: 21 - index, column: 1 };
  if (index >= 21 && index <= 30) return { row: 1, column: index - 19 };
  return { row: index - 29, column: 11 };
}
