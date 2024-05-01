import { Wallet } from "ethers";
import { Client, type XmtpEnv } from "@xmtp/xmtp-js";
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { FsPersistence } from "@xmtp/fs-persistence";

const signer = process.env.KEY
  ? new Wallet(process.env.KEY)
  : Wallet.createRandom();

export const xmtpClient = Client.create(signer, {
  // apiClientFactory: GrpcApiClient.fromOptions,
  basePersistence: new FsPersistence("/tmp/xmtp"),
  env: process.env.XMTP_ENV as XmtpEnv,
});
