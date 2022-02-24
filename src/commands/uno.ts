import { Message, MessageEmbed, User } from "discord.js";
import { Card, Color, Game } from "../dtos/uno.dto";
import logger from "../logger";
import { unoDeck } from "../utils";
import { discordClient } from "../client";

const games: Game[] = [];

const noGameFound = (message: Message) => {
  return message.channel.send({
    embed: {
      title: "No game found",
      description: "No game found, create a game with `$uno create`",
      color: "#ea7373",
    },
  });
};

const noPlayerFound = (message: Message) => {
  return message.channel.send({
    embed: {
      title: "Not in game",
      description: "You are not in this game",
      color: "#ea7373",
    },
  });
};

const gameNotStarted = (game: Game, message: Message) => {
  const embed = new MessageEmbed()
    .setTitle("Game not started")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Players", game.players.length.toString())
    .addField("To Start", "`$uno start`");
  return message.channel.send({ embed });
};

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
    return noGameFound(message);
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
    return noGameFound(message);
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
        game.discard.length != 0
          ? `${game.discard[game.discard.length - 1]?.type} - ${
              game.discard[game.discard.length - 1]?.color
            }`
          : "None"
      );
    return message.channel.send({ embed });
  }
  return gameNotStarted(game, message);
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

function drawCard(game: Game, initDraw: boolean) {
  const card = game.deck.pop();
  if (card && !initDraw) {
    game.discard.push(card);
  }
  return card;
}

function startGame(message: Message) {
  const newDeck = shuffleCards(unoDeck);
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return noGameFound(message);
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
  game.players.forEach((player) => {
    for (let i = 0; i < 7; i++) {
      const card = drawCard(game, true);
      if (card) {
        player.hand.push(card);
      }
    }
  });
  logger.info(`Game started`, game.id);
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
      game.discard.length != 0
        ? `${game.discard[game.discard.length - 1]?.type} - ${
            game.discard[game.discard.length - 1]?.color
          }`
        : "None"
    );
  game.players.forEach((player) => {
    const playerHand = new MessageEmbed()
      .setTitle("Your hand")
      .setDescription(`Game ID: ${game.id}`)
      .setColor("#ea7373")
      .addField("Cards", player.hand.length.toString());
    player.hand.forEach((card: Card) => {
      playerHand.addField(card.type, card.color);
    });
    discordClient.users.fetch(player.id).then((user) => {
      user.send({ embed: playerHand });
    });
  });

  return message.channel.send({ embed });
}

const showHand = (message: Message) => {
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return noGameFound(message);
  }
  if (!game.started) {
    return gameNotStarted(game, message);
  }
  const player = game.players.find((p) => p.id === message.author.id);
  if (!player) {
    return noPlayerFound(message);
  }
  const embed = new MessageEmbed()
    .setTitle("Your hand")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Cards", player.hand.length.toString());
  player.hand.forEach((card) => {
    embed.addField(card.type, card.color);
  });
  return message.author.send({ embed });
};

const playCard = (message: Message) => {
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return noGameFound(message);
  }
  if (!game.started) {
    return gameNotStarted(game, message);
  }
  const player = game.players.find((p) => p.id === message.author.id);
  if (!player) {
    return message.channel.send({
      embed: {
        title: "Not in game",
        description: "You are not in this game",
        color: "#ea7373",
      },
    });
  }
  if (player.id !== game.currentPlayer?.id) {
    return message.channel.send({
      embed: {
        title: "Not your turn",
        description: "It is not your turn",
        color: "#ea7373",
      },
    });
  }
  const args = message.content.split(" ");
  if (args.length < 4) {
    return message.channel.send({
      embed: {
        title: "Not enough arguments",
        description: "You need to specify a card to play",
        color: "#ea7373",
      },
    });
  }
  player.hand.forEach((c) => {
    console.log(c.type == args[2]);
    console.log(c.type, args[2]);
    console.log(c.color == args[3]);
    console.log(c.color, args[3]);
  });
  const card = player.hand.filter((c) => {
    if (
      c.type.toLowerCase() == args[2].toLowerCase() &&
      c.color.toLowerCase() == args[3].toLowerCase()
    ) {
      return true;
    }
    return false;
  })[0];
  console.log(card);
  if (!card) {
    return message.channel.send({
      embed: {
        title: "Card not found",
        description: "Card not found in your hand",
        color: "#ea7373",
      },
    });
  }
  //assert that playing card matches color or type of top card in discard except if playing wild
  if (
    card.type != "Wild" &&
    card.type != "Wild Draw Four" &&
    game.discard[game.discard.length - 1]?.color != card.color &&
    game.discard[game.discard.length - 1]?.type != card.type &&
    game.discard.length != 0
  ) {
    return message.channel.send({
      embed: {
        title: "Invalid card",
        description: "Card does not match top card in discard",
        color: "#ea7373",
      },
    });
  }
  if (card.type === "Wild" || card.type === "Wild Draw Four") {
    if (args.length < 5) {
      return message.channel.send({
        embed: {
          title: "Not enough arguments",
          description: "You need to specify the new color",
          color: "#ea7373",
        },
      });
    }
    const newColor = args[4];
    if (
      newColor.toLowerCase() !== "Red".toLowerCase() &&
      newColor.toLowerCase() !== "Blue".toLowerCase() &&
      newColor.toLowerCase() !== "Green".toLowerCase() &&
      newColor.toLowerCase() !== "Yellow".toLowerCase()
    ) {
      return message.channel.send({
        embed: {
          title: "Invalid color",
          description: "Color must be one of Red, Blue, Green or Yellow",
          color: "#ea7373",
        },
      });
    }
    card.color = newColor as Color;
  }
  player.hand = player.hand.filter(
    (c) => c.type !== card.type || c.color !== card.color
  );
  delete player.hand[player.hand.indexOf(card)];
  game.discard.push(card);
  if (card.type === "Draw Two") {
    for (let i = 0; i < 2; i++) {
      const card = drawCard(game, false);
      if (card) {
        game.players[
          (game.players.indexOf(player) + 1) % game.players.length
        ].hand.push(card);
      }
    }
  } else if (card.type === "Wild Draw Four") {
    for (let i = 0; i < 4; i++) {
      const card = drawCard(game, false);
      if (card) {
        game.players[
          (game.players.indexOf(player) + 1) % game.players.length
        ].hand.push(card);
      }
    }
  } else if (card.type === "Skip") {
    game.currentPlayer =
      game.players[(game.players.indexOf(player) + 1) % game.players.length];
  } else if (card.type === "Reverse") {
    game.players.reverse();
  }
  //check if game is over
  if (player.hand.length === 0) {
    const winner = player;
    delete games[games.indexOf(game)];
    return message.channel.send({
      embed: {
        title: "Game over",
        description: `${winner.name} won the game`,
        color: "#ea7373",
      },
    });
  }
  game.turnCount++;
  // skip to next player
  if (game.currentPlayer) {
    game.currentPlayer =
      game.players[
        (game.players.indexOf(game.currentPlayer) + 1) % game.players.length
      ];
  }
  logger.info(`Card played`, { game, player, card });
  const embed = new MessageEmbed()
    .setTitle("Card played")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Current Player", game.currentPlayer?.name ?? "None")
    .addField("Turn", game.turnCount.toString())
    .addField("Discard", game.discard.length.toString())
    .addField("Deck", game.deck.length.toString())
    .addField("Players", game.players.length.toString())
    .addField(
      "Card on top of pile",
      game.discard.length != 0
        ? `${game.discard[game.discard.length - 1]?.type} - ${
            game.discard[game.discard.length - 1]?.color
          }`
        : "None"
    );

  return message.channel.send({ embed });
};

function playerDrawCard(message: Message) {
  const game = games.find((g) => g.id === message.channel.id);
  if (!game) {
    return noGameFound(message);
  }
  const player = game.players.find((p) => p.id === message.author.id);
  if (!player) {
    return noPlayerFound(message);
  }
  if (game.currentPlayer?.id !== message.author.id) {
    return message.channel.send({
      embed: {
        title: "Not your turn",
        description: "It is not your turn",
        color: "#ea7373",
      },
    });
  }
  const card = drawCard(game, false);
  if (!card) {
    return message.channel.send({
      embed: {
        title: "No cards left",
        description: "No cards left in deck",
        color: "#ea7373",
      },
    });
  }
  player.hand.push(card);
  logger.info(`Card drawn`, { game, player, card });
  const embed = new MessageEmbed()
    .setTitle("Card drawn")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Current Player", game.currentPlayer?.name ?? "None")
    .addField("Turn", game.turnCount.toString())
    .addField("Discard", game.discard.length.toString())
    .addField("Deck", game.deck.length.toString())
    .addField("Players", game.players.length.toString())
    .addField(
      "Card on top of pile",
      game.discard.length != 0
        ? `${game.discard[game.discard.length - 1]?.type} - ${
            game.discard[game.discard.length - 1]?.color
          }`
        : "None"
    );

  const embedCard = new MessageEmbed()
    .setTitle("Draw Card")
    .setDescription(`Game ID: ${game.id}`)
    .setColor("#ea7373")
    .addField("Card", `${card.type} - ${card.color}`);

  return message.channel.send({ embed }).then(() => {
    discordClient.users.fetch(player.id).then((user) => {
      user.send(embedCard);
    });
  });
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
  start: (message: Message) => {
    startGame(message);
  },
  hand: (message: Message) => {
    showHand(message);
  },
  play: (message: Message) => {
    playCard(message);
  },
  draw: (message: Message) => {
    playerDrawCard(message);
  },
};

export default {
  name: "uno",
  description: "Play uno games",
  execute(message: Message, args: string[]) {
    if (args.length === 0 || !argsFunction[args[0]]) {
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
