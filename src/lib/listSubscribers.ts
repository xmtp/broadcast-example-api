import type { Client } from "@xmtp/xmtp-js";

export const listSubscribers = async (client: Client): Promise<string[]> => {
  const conversations = await client.conversations.listFromCache();
  return conversations.map((conversation) => conversation.peerAddress);
};
