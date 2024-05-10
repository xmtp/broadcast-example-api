import * as fs from "fs";

export const getDevWalletAddresses = (): string[] => {
  // Read from addresses.json
  const addresses = JSON.parse(fs.readFileSync("addresses.json", "utf-8"));
  return addresses;
};
