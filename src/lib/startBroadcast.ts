import type { Client } from "@xmtp/xmtp-js";
import {
  finishBroadcast,
  incrementBroadcastSent,
  updateBroadcastStatus,
} from "./broadcasts";
import { Broadcast } from "./utils/Broadcast";
import { broadCastConfigEntities } from "./broadcasterConfigs";
const XMTP_RATE_LIMIT = 1000;
const XMTP_RATE_LIMIT_TIME = 60 * 1000; // 1 minute
const XMTP_RATE_LIMIT_TIME_INCREASE = XMTP_RATE_LIMIT_TIME * 5; // 5 minutes

let sendCount = 0;
let errorCount = 0;
let startTime: number;
export const startBroadcast = async (
  client: Client,
  broadcastAddresses: string[],
  message: string,
  broadcastId: string
): Promise<void> => {
  const onBroadcastComplete = () => {
    let endTime = Date.now();
    console.log(
      `Broadcast ${broadcastId} completed Total time ${endTime - startTime}ms`
    );
    finishBroadcast(broadcastId);
  };
  const onMessageFailed = (address: string) => {
    errorCount++;
    console.log(`Message failed for address ${errorCount} : ${address}`);
  };
  const onMessageSent = () => {
    sendCount++;
    incrementBroadcastSent(broadcastId);
  };
  const onCanMessageAddressesUpdate = (addresses: string[]) => {
    console.log(`Can message addresses updated to ${addresses.length}`);
  };
  const onBatchComplete = (addresses: string[]) => {
    console.log(`Batch complete for ${addresses.length} addresses`);
  };
  const onCantMessageAddress = (address: string) => {
    console.log(`Can't message address ${address}`);
  };
  const onCanMessageAddreses = (addresses: string[]) => {
    console.log(`Can message addresses ${addresses.length}`);
  };
  const onDelay = (ms: number) => {
    console.log(`Delaying for ${ms}ms`);
    updateBroadcastStatus(broadcastId, "waiting");
  };
  const onBatchStart = (addresses: string[]) => {
    console.log(`Batch start for ${addresses.length} addresses`);
    updateBroadcastStatus(broadcastId, "sending");
  };
  errorCount = 0;
  sendCount = 0;
  startTime = Date.now();
  const broadcastConfigId = broadCastConfigEntities.map[client.address].id;
  const broadcast = new Broadcast({
    client,
    addresses: broadcastAddresses,
    cachedCanMessageAddresses: [],
    rateLimitAmount: Number(
      process.env[`${broadcastConfigId}_RATE_LIMIT_AMOUNT`] ?? XMTP_RATE_LIMIT
    ),
    rateLimitTime: Number(
      process.env[`${broadcastConfigId}_RATE_LIMIT_DURATION`] ??
        XMTP_RATE_LIMIT_TIME_INCREASE
    ),
    onBatchStart,
    onBatchComplete,
    onBroadcastComplete,
    onCantMessageAddress,
    onCanMessageAddreses,
    onMessageFailed,
    onMessageSent,
    onCanMessageAddressesUpdate,
    onDelay,
  });
  try {
    await broadcast.broadcast({ message });
  } catch (err) {
    console.error(`Error broadcasting: ${err}`);
    updateBroadcastStatus(broadcastId, "failed");
  }
};
