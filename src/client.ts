import { Client, Collection, Message } from "discord.js";
import logger from "./logger";
import * as fs from "fs";

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, Command>;
  }

  export interface Command {
    name: string;
    description: string;
    execute: (message: Message, args: string[]) => any; // Can be `Promise<SomeType>` if using async
  }
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;

export const initializeClient = () => {
  const client = new Client();

  client.commands = new Collection();

  const commandFiles = fs
    .readdirSync("src/commands")
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`).default;
    client.commands.set(command.name, command);
  }

  client.once("ready", () => {
    logger.info(`🚀 Zoio bot is online!`);
  });

  client.login(TOKEN);

  return client;
};
