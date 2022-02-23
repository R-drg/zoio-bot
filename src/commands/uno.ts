import { Message, MessageEmbed } from "discord.js";
import { Card, Game } from "../dtos/uno.dto";
import logger from "../logger";
import { unoDeck } from "../utils";

const games: Game[] = [];

function createGame(message: Message) {
  const player = {
    id: message.author.id,
    name: message.author.username,
    score: 0,
    hand: [],
    turn: false,
  };
  const game: Game = {
    id: message.channel.id,
    started: false,
    players: [player],
    deck: [],
    discard: [],
    turn: 0,
    turnCount: 0,
    currentPlayer: null,
  };
  games.push(game);
  logger.info(`Created game`, { game });
  const embed = new MessageEmbed()
    .setTitle("New game created")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("To Join", "`$uno join`");
  return message.channel.send({ embed });
}

function joinGame(message: Message) {
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return message.channel.send({
      embed: {
        title: "No game found",
        description: "No game found, create a game with `$uno create`",
        color: "#ea7373",
      },
    });
  }
  if (game.players.length >= 4) {
    return message.channel.send({
      embed: {
        title: "Game full",
        description: "Game is full, try again later",
        color: "#ea7373",
      },
    });
  }
  if (game.players.find((p) => p.id === message.author.id)) {
    return message.channel.send({
      embed: {
        title: "Already in game",
        description: "You are already in this game",
        color: "#ea7373",
      },
    });
  }
  const player = {
    id: message.author.id,
    name: message.author.username,
    score: 0,
    hand: [],
    turn: false,
  };
  game.players.push(player);
  logger.info(`Player joined game`, { game, player });
  const embed = new MessageEmbed()
    .setTitle("Player joined game")
    .setDescription(`${message.author.username} joined the game`)
    .setColor("#ea7373")
    .addField("To Start", "`$uno start`");
  return message.channel.send({ embed });
}

function showStatus(message: Message) {
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return message.channel.send({
      embed: {
        title: "No game found",
        description: "No game found, create a game with `$uno create`",
        color: "#ea7373",
      },
    });
  }
  if (game.started) {
    const embed = new MessageEmbed()
      .setTitle("Game in progress")
      .setDescription(`Game ID: ${game.id}`)
      .setColor("#ea7373")
      .addField("Current Player", game.currentPlayer?.name ?? "None")
      .addField("Turn", game.turnCount.toString())
      .addField("Discard", game.discard.length.toString())
      .addField("Deck", game.deck.length.toString())
      .addField("Players", game.players.length.toString())
      .addField(
        "Card on top of pile",
        game.discard[game.discard.length - 1]?.type ?? "None"
      );
    return message.channel.send({ embed });
  }
  const embed = new MessageEmbed()
    .setTitle("Game not started")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Players", game.players.length.toString())
    .addField("To Start", "`$uno start`");
  return message.channel.send({ embed });
}

function shuffleCards(cards: Card[]) {
  const shuffledCards = [];
  while (cards.length > 0) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    shuffledCards.push(cards[randomIndex]);
    cards.splice(randomIndex, 1);
  }
  return shuffledCards;
}

function drawCard(game: Game) {
  const card = game.deck.pop();
  if (card) {
    game.discard.push(card);
  }
  return card;
}

function startGame(message: Message) {
  const newDeck = shuffleCards(unoDeck);
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return message.channel.send({
      embed: {
        title: "No game found",
        description: "No game found, create a game with `$uno create`",
        color: "#ea7373",
      },
    });
  }
  if (game.started) {
    return message.channel.send({
      embed: {
        title: "Game already started",
        description: "Game has already started, try again later",
        color: "#ea7373",
      },
    });
  }
  if (game.players.length < 2) {
    return message.channel.send({
      embed: {
        title: "Not enough players",
        description: "Not enough players to start game",
        color: "#ea7373",
      },
    });
  }
  game.started = true;
  game.deck = newDeck;
  game.discard = [];
  game.turn = 1;
  game.turnCount = 1;
  game.currentPlayer = game.players[0];
  //draw 7 cards for each player
  game.players.forEach((player) => {
    for (let i = 0; i < 7; i++) {
      const card = drawCard(game);
      if (card) {
        player.hand.push(card);
      }
    }
  });
  logger.info(`Game started`, { game });
  const embed = new MessageEmbed()
    .setTitle("Game started")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Current Player", game.currentPlayer?.name ?? "None")
    .addField("Turn", game.turnCount.toString())
    .addField("Discard", game.discard.length.toString())
    .addField("Deck", game.deck.length.toString())
    .addField("Players", game.players.length.toString())
    .addField(
      "Card on top of pile",
      game.discard[game.discard.length - 1]?.type ?? "None"
    );
  return message.channel.send({ embed });
}

const argsFunction: any = {
  create: (message: Message) => {
    createGame(message);
  },
  join: (message: Message) => {
    joinGame(message);
  },
  status: (message: Message) => {
    showStatus(message);
  },
};

export default {
  name: "uno",
  description: "Play uno games",
  execute(message: Message, args: string[]) {
    if (args.length === 0) {
      const embed = new MessageEmbed({
        title: "How to play Uno",
        description:
          "Play Uno with your friends!\n\n" +
          "1. Create a game with `$uno create`\n" +
          "2. Join a game with `$uno join`\n" +
          "3. Start the game with `$uno start`\n" +
          "4. Play a card with `$uno play <card>`\n" +
          "5. See the cards in your hand with `$uno hand`\n" +
          "6. See the current card in the pile with `$uno pile`\n" +
          "7. See the current turn with `$uno turn`\n" +
          "8. See the current score with `$uno score`\n" +
          "9. See the current game status with `$uno status`\n" +
          "10. Draw a card with `$uno draw`\n" +
          "11. Display help with `$uno help`\n" +
          "12. Quit the game with `$uno quit`\n" +
          "13. End the game with `$uno end`",
        color: 0xea7373,
      });
      return message.channel.send({ embed });
    }
    return argsFunction[args[0]](message);
  },
};
