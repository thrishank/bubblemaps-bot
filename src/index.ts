import { Context, Markup, Telegraf } from "telegraf";
import * as fs from "fs";
import {
  api,
  format_token_data_html,
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

bot.start((ctx: Context) => {
  return ctx.reply(
    escapeMarkdownV2(
      "👋 Hello! I can help you check token information and generate bubble maps. \n\n🔹 Send me a *contract address* (Solana or Ethereum). \n🔹For ethereum address i will ask for network",
    ),
    { parse_mode: "MarkdownV2" },
  );
});

bot.command("token", (ctx) => {
  ctx.reply(escapeMarkdownV2("📌 Please enter the contract address:"), {
    parse_mode: "MarkdownV2",
  });
});

const userMessages = new Map();
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const isGroupChat = ctx.chat.type.includes("group");
  const botUsername = (await bot.telegram.getMe()).username;
  const messageText = ctx.message.text.trim();

  // If it's a group chat, ensure the bot is tagged
  if (isGroupChat && !messageText.includes(`@${botUsername}`)) {
    return;
  }

  // Extract address from the message
  const address = messageText.replace(`@${botUsername}`, "").trim();

  userMessages.set(userId, { contractAddress: address });

  if (!isSolanaPublicKey(address) && !isEthereumAddress(address)) {
    return ctx.reply(
      escapeMarkdownV2(
        "⚠️ Invalid address. Please enter a valid contract address.\n\nExample:\n- Solana: `HvhG...w2FQ` \n- Ethereum: `0x1234...abcd`",
      ),
      { parse_mode: "MarkdownV2" },
    );
  }

  if (isSolanaPublicKey(address)) {
    const message = await ctx.reply(
      "⏳ Generating the bubblemap, please wait...",
    );

    const photoSource = `${location}/${address}.png`;
    if (!fs.existsSync(photoSource)) {
      await screenshot("sol", address);
    }
    const token_data = await api("sol", address);

    await ctx.deleteMessage(message.message_id);
    await ctx.replyWithPhoto(
      {
        source: photoSource,
      },
      {
        caption: format_token_data_html(token_data),
        parse_mode: "HTML",
      },
    );
  }

  if (isEthereumAddress(address)) {
    ctx.reply(
      "Select a network:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("ETH", "network_eth"),
          Markup.button.callback("BSC", "network_bsc"),
          Markup.button.callback("FTM", "network_ftm"),
        ],
        [
          Markup.button.callback("AVAX", "network_avax"),
          Markup.button.callback("CRO", "network_cro"),
          Markup.button.callback("ARB", "network_arbi"),
        ],
        [
          Markup.button.callback("POL", "network_poli"),
          Markup.button.callback("BASE", "network_base"),
          Markup.button.callback("SONIC", "network_sonic"),
        ],
      ]),
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

  // @ts-ignore
  const network = ctx.update.callback_query.data.split("_")[1]; // Extract network from callback data

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageReplyMarkup(undefined); // Remove buttons safely
  }

  await ctx.editMessageText("⏳ Generating the bubblemap, please wait...");

  // check if the image already exists
  const photoSource = `${location}/${contractAddress}.png`;
  if (!fs.existsSync(photoSource)) {
    await screenshot(network, contractAddress);
  }
  const token_data = await api(network, contractAddress);

  await ctx.replyWithPhoto(
    {
      source: photoSource,
    },
    {
      caption: format_token_data_html(token_data),
      parse_mode: "HTML",
    },
  );

  await ctx.deleteMessage();
});

function escapeMarkdownV2(text: string) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

bot.launch().then(() => console.log("Bot is running!"));
