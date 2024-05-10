import { Client, type XmtpEnv } from "@xmtp/xmtp-js";
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { RedisPersistence } from "@xmtp/redis-persistence";
import { createClient } from "@redis/client";
import { broadCastConfigEntities } from "./broadcasterConfigs";
import { base64ToBytes } from "./utils/base64ToBytes";

const redis = createClient({
  url: process.env.REDIS_URL,
});
redis.connect();

let clientsInitialized = false;
const clients = new Map<string, Client>();
// Work around for some weirdness when deploying, could be solved by removing grpc though
export async function initializeClients() {
  clientsInitialized = true;
  return Promise.all(
    broadCastConfigEntities.addresses.map(async (address) => {
      console.log("Initializing client for: ", address);
      const config = broadCastConfigEntities.map[address];
      const keyBundle = process.env[`${config.id}_KEY_BUNDLE`];
      const filePath = process.env[`${config.id}_FILE_PERSISTENCE_PATH`];
      if (!keyBundle) {
        console.error(`Missing ${config.id}_KEY_BUNDLE`);
        return;
      }
      if (!filePath) {
        console.error(`Missing ${config.id}_FILE_PERSISTENCE_PATH`);
        return;
      }
      try {
        const client = await Client.create(null, {
          privateKeyOverride: base64ToBytes(keyBundle),
          apiClientFactory: GrpcApiClient.fromOptions as any,
          basePersistence: new RedisPersistence(redis as any, "xmtp:"),
          env: (process.env.XMTP_ENV as XmtpEnv) ?? "dev",
        });
        console.log(
          `Client initialized at: ${client.address} for ${config.id}`
        );
        clients.set(config.address, client);
      } catch (err) {
        console.log(err);
      }
    })
  );
}

export const getXmtpClient = async (address: string) => {
  if (!clientsInitialized) {
    console.log("Clients not initialized");
    await initializeClients();
  }
  return clients.get(address) ?? null;
};
