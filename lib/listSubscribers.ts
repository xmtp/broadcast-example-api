import { xmtpClient } from "./client";

interface Subscriber {
  address: string;
  canMessage: boolean;
}

export const listSubscribers = async (): Promise<Subscriber[]> => {
  const client = await xmtpClient;

  return [];
  // subscribers: conversation.subscribers,
};
