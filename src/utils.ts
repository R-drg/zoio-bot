import { Card, CardType, Color } from "./dtos/uno.dto";

export const parseCommand = (
  message: string
): { command: string; args: string[] } => {
  const args = message.slice(1).split(/ +/);
  const command = args.shift()!.toLowerCase();
  return { command, args };
};

export const unoDeck = (function (): Card[] {
  const deck: Card[] = [];
  for (const color of Object.values(Color)) {
    for (const type of Object.values(CardType)) {
      if (
        type === CardType.WILD ||
        type === CardType.WILD_DRAW_FOUR ||
        color === Color.BLACK
      ) {
        continue;
      }
      deck.push({ color, type });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: Color.BLACK, type: CardType.WILD });
    deck.push({ color: Color.BLACK, type: CardType.WILD_DRAW_FOUR });
  }
  return deck;
})();
