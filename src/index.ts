import { Markup, Telegraf } from "telegraf";
import { isSolanaPublicKey } from "./utils";
import { bot_token } from "./env";

const bot = new Telegraf(bot_token);

const commands = [{ command: "token", description: "Get token info" }];
bot.telegram.setMyCommands(commands);

bot.use((ctx, next) => {
  console.log(ctx.message);
  next();
});

bot.start((ctx) => {
  return ctx.replyWithPhoto({
    source:
      "/Users/thris/Developer/common/npm/FQgtfugBdpFN7PZ6NdPrZpVLDBrPGxXesi4gVu3vErhY.png",
  });
});

bot.command("token", (ctx) => {
  ctx.reply("Enter contract address: ");
});

const userMessages = new Map();
bot.on("text", async (ctx) => {
  const message = ctx.message.text.trim();
  const userId = ctx.from.id;

  userMessages.set(userId, { contractAddress: message });

  if (isSolanaPublicKey(message)) {
    return ctx.reply("solana pubkey");
  } else {
    ctx.reply(
      "Select a network:",
      Markup.inlineKeyboard([
        Markup.button.callback("ETH", "network_ETH"),
        Markup.button.callback("BSC", "network_BSC"),
        Markup.button.callback("POL", "network_POL"),
      ]),
    );
  }
});

// Handle button clicks
bot.action("network_ETH", async (ctx) => {
  const userId = ctx.from.id;

  if (!userMessages.has(userId)) {
    return ctx.reply("No contract address stored. Please enter one first.");
  }

  const token = userMessages.get(userId).contractAddress;
  await ctx.answerCbQuery();
  return ctx.reply(token);
});

bot.launch().then(() => console.log("Bot is running!"));
