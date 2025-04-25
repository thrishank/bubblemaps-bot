<a href="https://app.bubblemaps.io">
  <img src="https://app.bubblemaps.io/img/bubblemaps.51902376.svg" alt="Bubble Maps" title="BubbleMaps" align="right" height="60" />
</a>

# Bubble Maps Telegram Bot

A powerful Telegram bot that visualizes token distribution and provides in-depth analytics for any token supported by [Bubblemaps](https://bubblemaps.io) Supports both Solana and EVM chains (Ethereum, BSC, ARB, etc). The bot is designed to be user-friendly and efficient, making it easy for users to access bubble maps without needing to visit the Bubblemaps website.

## Features

- Send any contract address (Solana or EVM)
- Get a bubblemap screenshot generated from Bubblemaps
- Display's key token information- price, market cap, volume, and more
- Decentralization Score (via Bubblemaps Score API) and rug check score for solana tokens
- Supports inline usage in group chats by tagging the bot

## Demo

Try it live on Telegram: [@Bubblemaps123_bot](https://t.me/Bubblemaps123_bot)

<https://t.me/Bubblemaps123_bot>

You can:

- DM the bot with a token address
- Add it to a group and tag it with a contract address

https://github.com/user-attachments/assets/978e1e2f-78f8-493f-82fb-8fa7c49999e2

## Setup

1. clone the repo and install the dependencies

```bash
https://github.com/thrishank/bubblemaps-bot
cd bubblemaps-bot
pnpm install
```

2. create a env.ts file in src/

```typescript
export const bot_token = "";
export const location = ""; // Folder to store bubblemap screenshots
```

3. start the bot

```bash
pnpm build
pnpm start
```

## Tech Stack and Architecture

- Typescript
- Telegraf.js – Telegram bot framework
- selenium-webdriver – Headless browser-based image generation
- token meta data from coingecko api
