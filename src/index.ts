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
import { token_meta } from "./utils";
import { rug_check } from "./rug_check";

const bot = new Telegraf(bot_token);

const commands = [
  { command: "help", description: "information about the bot" },
  { command: "token", description: "Get token bubblemap and info" },
];

bot.telegram.setMyCommands(commands);

bot.use((ctx, next) => {
  console.log("from: ", ctx.message?.from.username);
  // @ts-ignore
  console.log("message: ", ctx.message?.text);
  next();
});

// start command
bot.start((ctx: Context) => {
  const bot_username = "Bubblemaps123_bot";
  return ctx.reply(
    escapeMarkdownV2(`🌟 Hey there! I'm your go-to bot for token insights and stunning bubble maps! 🚀 

💬 What I can do for you:
- Analyze token info on Solana or Ethereum
- Create awesome bubble maps to visualize data

📩 How to get started:
- Send me a toke mint address for Solana and for Ethereum send the contract address and select network after sharing
- In group chats, just tag me with the contract address

Let's dive into the world of tokens together! 🎉`),
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
    "Welcome to the bubblemaps bot. Enter any solana or ethereum address to get the bubblemap and token information. In groups enter the address and tag the bot",
  );
});

bot.command("token", (ctx) => {
  return ctx.reply("📌 Enter the contract address (CA) :");
});

const userMessages = new Map(); // A In-Memory Map to store address entered by the user.
// Map is used retrive the address after the user clicks on the network buttons.
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

  // push the address to the map
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
    const holders = await token_meta(address);
    const rug_score = await rug_check(address);
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
      if (!fs.existsSync(photoSource)) {
        return ctx.replyWithHTML(
          `❌ The Bubblemap has not been request for this token. <a href="https://bubblemaps.io/get-premium/">Get Premium</a> if you want to request new maps. 

<a href="https://bubblemaps.io">LEARNMORE</a>
`,
        );
      }
      return ctx.replyWithPhoto({ source: photoSource });
    }

    await ctx.replyWithPhoto(
      {
        source: photoSource,
      },
      {
        caption: format_token_data_html(token_data, holders, rug_score?.score),
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
          Markup.button.callback("POL", "network_poly"),
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
    if (!fs.existsSync(photoSource)) {
      return ctx.replyWithHTML(
        `❌ The Bubblemap has not been request for this token. <a href="https://bubblemaps.io/get-premium/">Get Premium</a> if you want to request new maps. 

<a href="https://bubblemaps.io">LEARNMORE</a>
`,
      );
    }
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
