import { Context, Markup, Telegraf } from "telegraf";
import * as fs from "fs";
import {
  format_token_data_html,
  isEthereumAddress,
  isSolanaPublicKey,
} from "./utils";
import { bot_token, location } from "./env";
import { screenshot } from "./ss";
import { price } from "./price";

const bot = new Telegraf(bot_token);

const commands = [
  { command: "help", description: "information about the bot" },
  { command: "token", description: "Get token bubblemap and info" },
];
bot.telegram.setMyCommands(commands);

bot.use((ctx, next) => {
  console.log(ctx.message);
  next();
});

bot.start((ctx: Context) => {
  const bot_username = "Bubblemaps123_bot";
  return ctx.reply(
    escapeMarkdownV2(
      "👋 Hello! I can help you check token information and generate bubble maps. \n\n🔹 Send me a *contract address* (Solana or Ethereum).\n\n🔹 In groups, tag me with the contract address.",
    ),
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        Markup.button.url(
          "➕ Add to Group",
          `https://t.me/${bot_username}?startgroup=true`,
        ),
      ]),
    },
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "Welcome to the bubblemaps bot. Enter any solana or ethereum address to get the bubblemap and token information",
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
        "❌  Invalid address. Please enter a valid contract address.\n\nExample:\n- Solana: `HvhG...w2FQ` \n- Ethereum: `0x1234...abcd`",
      ),
      { parse_mode: "MarkdownV2" },
    );
  }

  if (isSolanaPublicKey(address)) {
    const message = await ctx.reply(
      "⏳ Generating the bubblemap, please wait...",
    );

    const token_data = await price("sol", address);
    const photoSource = `${location}/${address}_sol.png`;
    if (!fs.existsSync(photoSource)) {
      try {
        await screenshot("sol", address);
      } catch {
        return ctx.reply(
          "❌ Error generating the bubblemap. Please ensure it's a valid mint address and try again.",
        );
      }
    }

    await ctx.deleteMessage(message.message_id);

    if (!token_data) {
      return ctx.replyWithPhoto({ source: photoSource });
    }

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

  const token_data = await price(network, contractAddress);

  // check if the image already exists
  const photoSource = `${location}/${contractAddress}_${network}.png`;
  if (!fs.existsSync(photoSource)) {
    try {
      await screenshot(network, contractAddress);
    } catch {
      return ctx.reply(
        `❌ Error generating the bubblemap for ${contractAddress}, network: ${network}. Please ensure it's a valid contract address and network and try again.`,
      );
    }
  }

  if (!token_data) {
    await ctx.deleteMessage();
    return ctx.replyWithPhoto({ source: photoSource });
  }

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
