import type { Client } from "@xmtp/xmtp-js";
import {
  finishBroadcast,
  updateBroadcastFromBatch,
  updateBroadcastStatus,
} from "./broadcasts";
const XMTP_RATE_LIMIT = 1000;
const XMTP_RATE_LIMIT_TIME = 60 * 1000; // 1 minute
const XMTP_RATE_LIMIT_TIME_INCREASE = XMTP_RATE_LIMIT_TIME * 5; // 5 minutes

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const startBroadcast = async (
  client: Client,
  broadcastAddresses: string[],
  message: string,
  broadcastId: string
): Promise<void> => {
  const batches: string[][] = [];
  let batch: string[] = [];
  const canMessageAddresses = await client.canMessage(broadcastAddresses);
  let errorCount = 0;
  for (let i = 0; i < canMessageAddresses.length; i++) {
    if (canMessageAddresses[i]) {
      batch.push(broadcastAddresses[i]);
    }
    // Add a batch of 500 addresses to the batches array
    // An introduction message is sent for new contacts, so each new message will actually be 2 messages in this case
    // We want to send 1000 messages per minute, so we split the batches in half
    // Additional optimization can be done to send messages to contacts that have already been introduced
    if (batch.length === XMTP_RATE_LIMIT / 2) {
      batches.push(batch);
      batch = [];
    }
  }
  if (batch.length > 0) {
    batches.push(batch);
  }

  for (let i = 0; i < batches.length; i++) {
    const batch: string[] = [];
    const sentAddresses: string[] = [];
    updateBroadcastStatus(broadcastId, "sending");
    await Promise.all(
      batches[i].map(async (address, index) => {
        const conversation = await client.conversations.newConversation(
          address
        );
        try {
          await conversation.send(message);
          console.log(
            `Sent message for batch ${i} index ${index} to ${address}`
          );
          sentAddresses.push(address);
        } catch (err) {
          errorCount++;
          console.error(err);
          batch.push(address);
          // Add error handling here
        }
      })
    );
    updateBroadcastFromBatch(broadcastId, sentAddresses);
    if (i !== batches.length - 1) {
      updateBroadcastStatus(broadcastId, "waiting");
      // Wait between batches
      console.log(`Waiting between batches ${i} and ${i + 1}`);
      await delay(XMTP_RATE_LIMIT_TIME_INCREASE);
    }
    if (batch.length > 0) {
      batches.push(batch);
    }
  }
  finishBroadcast(broadcastId);
};
