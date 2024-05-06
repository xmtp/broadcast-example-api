import { Client, type XmtpEnv } from "@xmtp/xmtp-js";
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { FsPersistence } from "@xmtp/fs-persistence";
import { broadCastConfigEntities } from "./broadcasterConfigs";
import { base64ToBytes } from "./utils/base64ToBytes";

let clientsInitialized = false;
const clients = new Map<string, Client>();
export async function initializeClients() {
  clientsInitialized = true;
  return Promise.all(
    broadCastConfigEntities.addresses.map((address) => {
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
      console.log("About to initialize client for: ", address);
      Client.create(null, {
        privateKeyOverride: base64ToBytes(keyBundle),
        apiClientFactory: GrpcApiClient.fromOptions,
        basePersistence: new FsPersistence(filePath),
        env: (process.env.XMTP_ENV as XmtpEnv) ?? "dev",
      })
        .then((client) => {
          console.log(
            `Client initialized at: ${client.address} for ${config.id}`
          );
          clients.set(config.address, client);
        })
        .catch((err) => {
          console.log(err);
        });
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
