import { Markup, Telegraf } from "telegraf";
import {
  api,
  format_token_data,
  isEthereumAddress,
  isSolanaPublicKey,
} from "./utils";
import { bot_token, location } from "./env";
import { screenshot } from "./ss";

const bot = new Telegraf(bot_token);

const commands = [{ command: "token", description: "Get token info" }];
bot.telegram.setMyCommands(commands);

bot.use((ctx, next) => {
  console.log(ctx.message);
  next();
});

bot.start((ctx) => {
  return ctx.reply(
    "Hello! I am a bot that can help you with token information. Enter the contract address of the token you want to check.",
  );
});

bot.command("token", (ctx) => {
  ctx.reply("Enter contract address: ");
});

const userMessages = new Map();
bot.on("text", async (ctx) => {
  const address = ctx.message.text.trim();
  const userId = ctx.from.id;

  userMessages.set(userId, { contractAddress: address });

  if (isSolanaPublicKey(address)) {
    ctx.reply("generating the bubblemaps ....");
    await screenshot("sol", address);
    const token_data = await api("sol", address);
    ctx.replyWithPhoto({
      source: `${location}/${address}.png`,
    });
    return ctx.reply(format_token_data(token_data));
  } else if (isEthereumAddress(address)) {
    ctx.reply(
      "Select a network:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("ETH", "network_ETH"),
          Markup.button.callback("BSC", "network_BSC"),
          Markup.button.callback("FTM", "network_FTM"),
        ],
        [
          Markup.button.callback("AVAX", "network_AVAX"),
          Markup.button.callback("CRO", "network_CRO"),
          Markup.button.callback("ARB", "network_ARBI"),
        ],
        [
          Markup.button.callback("POL", "network_POL"),
          Markup.button.callback("BASE", "network_BASE"),
          Markup.button.callback("SONIC", "network_SONIC"),
        ],
      ]),
    );
  } else {
    ctx.reply(
      "Invalid address. Please enter a valid Solana or Ethereum address.",
    );
  }
});

// Handle button clicks for network selection
bot.action(/network_/, async (ctx) => {
  const userId = ctx.from.id;
  const { contractAddress } = userMessages.get(userId) || {};

  if (!contractAddress) {
    return ctx.reply("Please enter a contract address first.");
  }

  const network = ctx.match[0].split("_")[1]; // Extract network from callback data
  ctx.reply(
    `You selected the ${network} network for address: ${contractAddress}. generating the bubblemaps ....`,
  );

  await screenshot(network, contractAddress);
  ctx.replyWithPhoto({
    source: `${location}/${contractAddress}.png`,
  });

  const token_data = await api(contractAddress, network);
  ctx.reply(format_token_data(token_data));
});

bot.launch().then(() => console.log("Bot is running!"));
