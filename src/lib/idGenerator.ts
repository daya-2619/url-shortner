const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MACHINE_ID = 'a'; // Fixed prefix as per our sharding strategy

// Simple counter to handle multiple requests within the same millisecond
let counter = 0;
let lastTimestamp = 0;

/**
 * Encodes a big integer to a Base62 string.
 */
function encodeBase62(num: bigint): string {
  if (num === BigInt(0)) return BASE62_ALPHABET[0];
  let encoded = '';
  let current = num;
  const base = BigInt(62);
  
  while (current > BigInt(0)) {
    const remainder = Number(current % base);
    encoded = BASE62_ALPHABET[remainder] + encoded;
    current = current / base;
  }
  return encoded;
}

/**
 * Generates a globally unique short ID with the machine prefix.
 */
export function generateShortId(): string {
  let currentTimestamp = Date.now();
  
  if (currentTimestamp === lastTimestamp) {
    counter++;
    // If we exceed 999 requests per ms, wait for the next ms (simplified for demo)
    if (counter > 999) {
      while (currentTimestamp <= lastTimestamp) {
        currentTimestamp = Date.now();
      }
      counter = 0;
    }
  } else {
    counter = 0;
  }
  
  lastTimestamp = currentTimestamp;
  
  // Combine timestamp and counter into a single integer
  // e.g. Timestamp (41 bits) + Counter (10 bits) -> Snowflake-like approach
  const uniqueNum = BigInt(currentTimestamp) * BigInt(1000) + BigInt(counter);
  
  const base62Id = encodeBase62(uniqueNum);
  
  return MACHINE_ID + base62Id;
}
