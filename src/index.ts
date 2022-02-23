import { initializeClient } from "./client";
import { parseCommand, unoDeck } from "./utils";

const client = initializeClient();

client.on("message", (message) => {
  if (!message.content.startsWith("$") || message.author.bot) return;
  const { command, args } = parseCommand(message.content);
  client.commands.get(command)?.execute(message, args);
});
