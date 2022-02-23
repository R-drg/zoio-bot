import { discordClient } from "./client";
import { parseCommand } from "./utils";

discordClient.on("message", (message) => {
  if (!message.content.startsWith("$") || message.author.bot) return;
  const { command, args } = parseCommand(message.content);
  discordClient.commands.get(command)?.execute(message, args);
});
