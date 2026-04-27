// src/constants/instruments.js
export const forexPairs = [
  "EURUSD", "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURNZD",
  "GBPUSD", "GBPJPY", "GBPCHF", "GBPAUD", "GBPNZD",
  "USDJPY", "USDCHF", "USDCAD",
  "AUDUSD", "AUDJPY",
  "NZDUSD", "NZDJPY",
  "CHFJPY", "CADJPY"
  // tu pourras compléter jusqu’aux 42 paires
];

export const cryptoPairs = ["BTCUSD", "ETHUSD"];

export const indexPairs = ["US30", "NAS100", "SP500"];

export const metalPairs = ["XAUUSD"];

export const allInstruments = [
  ...forexPairs,
  ...cryptoPairs,
  ...indexPairs,
  ...metalPairs
];
