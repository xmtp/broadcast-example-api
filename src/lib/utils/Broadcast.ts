import { type Conversation, type Client } from "@xmtp/xmtp-js";

interface BroadcastOptions {
  client: Client;
  addresses: string[];
  cachedCanMessageAddresses: string[];
  rateLimitAmount?: number;
  rateLimitTime?: number;

  // Callbacks
  onBatchStart?: (addresses: string[]) => void;
  onBatchComplete?: (addresses: string[]) => void;
  onBroadcastComplete?: () => void;
  onCantMessageAddress?: (address: string) => void;
  onCanMessageAddreses?: (addresses: string[]) => void;
  onMessageFailed?: (address: string) => void;
  onMessageSent?: (address: string) => void;
  onCanMessageAddressesUpdate?: (addresses: string[]) => void;
  onDelay?: (ms: number) => void;
}

const GENERAL_RATE_LIMIT = 10000;

export class Broadcast {
  client: Client;
  addresses: string[];
  cachedCanMessageAddresses: Set<string>;
  rateLimitAmount: number;
  rateLimitTime: number;
  batches: string[][] = [];
  errorBatch: string[] = [];
  conversationMapping: Map<string, Conversation> = new Map();

  // Callbacks
  onBatchStart?: (addresses: string[]) => void;
  onBatchComplete?: (addresses: string[]) => void;
  onBroadcastComplete?: () => void;
  onCantMessageAddress?: (address: string) => void;
  onCanMessageAddreses?: (addresses: string[]) => void;
  onMessageFailed?: (address: string) => void;
  onMessageSent?: (address: string) => void;
  onCanMessageAddressesUpdate?: (addresses: string[]) => void;
  onDelay?: (ms: number) => void;

  constructor({
    client,
    addresses,
    cachedCanMessageAddresses,
    rateLimitAmount = 1000,
    rateLimitTime = 1000 * 60 * 5,
    onBatchStart,
    onBatchComplete,
    onBroadcastComplete,
    onCantMessageAddress,
    onCanMessageAddreses,
    onMessageFailed,
    onMessageSent,
    onCanMessageAddressesUpdate,
    onDelay,
  }: BroadcastOptions) {
    this.client = client;
    this.addresses = addresses;
    this.cachedCanMessageAddresses = new Set(cachedCanMessageAddresses);
    this.rateLimitAmount = rateLimitAmount;
    this.rateLimitTime = rateLimitTime;
    this.onBatchStart = onBatchStart;
    this.onBatchComplete = onBatchComplete;
    this.onBroadcastComplete = onBroadcastComplete;
    this.onCantMessageAddress = onCantMessageAddress;
    this.onCanMessageAddreses = onCanMessageAddreses;
    this.onMessageFailed = onMessageFailed;
    this.onMessageSent = onMessageSent;
    this.onCanMessageAddressesUpdate = onCanMessageAddressesUpdate;
    this.onDelay = onDelay;
  }

  public broadcast = async ({ message }: { message: string }) => {
    const conversations = await this.client.conversations.list();
    for (const conversation of conversations) {
      this.conversationMapping.set(conversation.peerAddress, conversation);
    }
    console.log("delaying after list");
    if (conversations.length / 2 > GENERAL_RATE_LIMIT - this.rateLimitAmount) {
      await this.delay(this.rateLimitTime);
    }

    this.batches = this.getBatches();
    for (let batchIndex = 0; batchIndex < this.batches.length; batchIndex++) {
      await this.handleBatch({
        addresses: this.batches[batchIndex],
        message: message,
      });
      if (batchIndex !== this.batches.length - 1) {
        await this.delay(this.rateLimitTime);
      } else {
        await this.sendErrorBatch(message);
      }
    }
    this.onBroadcastComplete?.();
  };

  private handleBatch = async ({
    addresses,
    message,
  }: {
    addresses: string[];
    message: string;
  }) => {
    this.onBatchStart?.(addresses);
    await this.canMessageAddresses(addresses, this.onCanMessageAddressesUpdate);
    for (const address of addresses) {
      if (!this.cachedCanMessageAddresses.has(address)) {
        this.onCantMessageAddress?.(address);
        continue;
      }
      try {
        let conversation = this.conversationMapping.get(address);
        if (!conversation) {
          conversation = await this.client.conversations.newConversation(
            address
          );
          this.conversationMapping.set(address, conversation);
        }
        await conversation.send(message);
        this.onMessageSent?.(address);
      } catch (err) {
        this.onMessageFailed?.(address);
        this.errorBatch.push(address);
        await this.delay(this.rateLimitTime);
      }
    }
    this.onBatchComplete?.(addresses);
  };

  private sendErrorBatch = async (message: string) => {
    if (this.errorBatch.length === 0) {
      return;
    }
    const finalErrors = [];
    for (const address of this.errorBatch) {
      try {
        const conversation = await this.client.conversations.newConversation(
          address
        );
        await conversation.send(message);
        this.onMessageSent?.(address);
      } catch (err) {
        this.onMessageFailed?.(address);
        this.errorBatch.push(address);
        await this.delay(this.rateLimitTime);
      }
    }
    this.errorBatch = finalErrors;
  };

  private canMessageAddresses = async (
    addresses: string[],
    onCanMessageAddressesUpdate?: (newAddresses: string[]) => void
  ) => {
    const unknownStateAddresses: string[] = [];
    for (let i = 0; i < addresses.length; i++) {
      if (!this.cachedCanMessageAddresses.has(addresses[i])) {
        unknownStateAddresses.push(addresses[i]);
      }
    }
    const canMessageAddresses = await this.client.canMessage(
      unknownStateAddresses
    );
    const newCanMessageAddresses: string[] = [];
    for (let i = 0; i < addresses.length; i++) {
      if (canMessageAddresses[i]) {
        newCanMessageAddresses.push(addresses[i]);
        this.cachedCanMessageAddresses.add(addresses[i]);
      }
    }
    onCanMessageAddressesUpdate?.(newCanMessageAddresses);
  };

  private delay = async (ms: number) => {
    this.onDelay?.(ms);
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  };

  private getBatches = (): string[][] => {
    let batch: string[] = [];
    const batches: string[][] = [];
    let batchCount = 0;
    for (const address of this.addresses) {
      // No matter what we will want to send a message so this is 1 count
      // If sending multiple messages like a broadcast with text and image will need to add more
      batchCount++;
      batch.push(address);
      if (!this.conversationMapping.has(address)) {
        // this conversation will likely need to be created
        // so we count it as 2
        // 1 for getUserContactFromNetwork
        // 1 for post to network
        batchCount += 2;
      }
      //       if (batchCount >= this.rateLimitAmount / 2) { keeping this commented for now, will uncomment/remove after testing
      if (batchCount >= this.rateLimitAmount / 2) {
        batches.push(batch);
        batch = [];
        batchCount = 0;
      }
    }
    if (batch.length > 0) {
      batches.push(batch);
    }
    return batches;
  };
}
