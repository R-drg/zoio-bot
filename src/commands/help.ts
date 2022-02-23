import { Message } from "discord.js";

function displayCommands(message: Message, args: string[]) {
  const commands = message.client.commands.map((command) => {
    return `\`${command.name}\`: ${command.description}`;
  });
  message.channel.send(`Available commands:\n${commands.join("\n")}`);
}

export default {
  name: "help",
  description: "Display all available commands",
  execute(message: Message, args: string[]) {
    displayCommands(message, args);
  },
};
