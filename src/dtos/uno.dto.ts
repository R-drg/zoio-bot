export type Player = {
  id: string;
  name: string;
  score: number;
  hand: Card[];
  turn: boolean;
};

export type Game = {
  id: string;
  started: boolean;
  players: Player[];
  deck: Card[];
  discard: Card[];
  turn: number;
  turnCount: number;
  currentPlayer: Player | null;
};

export type Hand = {
  cards: Card[];
};

export type Card = {
  type: CardType;
  color: Color;
};

export enum Color {
  RED = "Red",
  BLUE = "Blue",
  GREEN = "Green",
  YELLOW = "Yellow",
  BLACK = "Black",
}

export enum CardType {
  ZERO = "0",
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  SKIP = "Skip",
  REVERSE = "Reverse",
  DRAW_TWO = "Draw Two",
  WILD = "Wild",
  WILD_DRAW_FOUR = "Wild Draw Four",
}
