/**
 * Checks if a string is a valid Solana public key
 * @param address The string to check
 * @returns boolean indicating whether the string is a valid Solana public key
 */
export function isSolanaPublicKey(address: string): boolean {
  // Solana public keys are base58-encoded and 44 characters long
  const solanaPublicKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
  return solanaPublicKeyRegex.test(address);
}

/**
 * Checks if a string is a valid Ethereum address
 * @param address The string to check
 * @returns boolean indicating whether the string is a valid Ethereum address
 */
export function isEthereumAddress(address: string): boolean {
  // Ethereum addresses are 42 characters long (including '0x') and hexadecimal
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

// CG-FQrb4ThLv32HZUqbvDHzqxHR
export async function api(network: string, address: string) {
  const url = `https://api.coingecko.com/api/v3/coins/id/contract/${address}?x_cg_demo_api_key=CG-FQrb4ThLv32HZUqbvDHzqxHR`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  const res = await fetch(url, options);
  const data = await res.json();
  const score_res = await fetch(
    `https://api-legacy.bubblemaps.io/map-metadata?chain=${network}&token=${address}`,
  );
  const score_data = await score_res.json();
  const score = score_data.decentralisation_score;
  const token_data = {
    name: data.name,
    price: data.market_data?.current_price?.usd,
    market_cap: data.market_data?.market_cap?.usd,
    fully_diluted_valuation: data.market_data?.fully_diluted_valuation?.usd,
    total_volume: data.market_data?.total_volume?.usd,
    price_change_percentage_24h: data.market_data?.price_change_percentage_24h,
    score,
  };
  console.log(token_data);
  return token_data;
}

export const format_number = (num: number) => {
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`; // Billion
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`; // Million
  } else {
    return `$${num.toFixed(2)}`; // Default formatting
  }
};

export const format_token_data = (token_data: any) => {
  return `
    ${token_data.name}
    📈 Price: ${format_number(token_data.price)}
    💰 Market Cap: ${format_number(token_data.market_cap)}
    💵 FDV: ${format_number(token_data.fully_diluted_valuation)}
    🔄 Total Volume: ${format_number(token_data.total_volume)}
    📉 Price Change (24h): ${token_data.price_change_percentage_24h}%
       Decentralisation Score: ${token_data.score}
  `;
};
