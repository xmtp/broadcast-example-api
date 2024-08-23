# Set up an example broadcast API

The **broadcast-example-api** repo provides an example broadcast API to help demonstrate an implementation of a Subscribe button with [built-in consent](https://docs.xmtp.org/consent/subscribe) provided by XMTP.

Follow these steps to set up an example broadcast API like the one backing the example subscribe-broadcast web page [deployed here](https://subscribe-broadcast.vercel.app/subscribe/button) and connected to the XMTP `dev` network.

To get the most out of this repo, use it with the [subscribe-broadcast repo](https://github.com/xmtp/subscribe-broadcast). The subscribe-broadcast repo provides an example subscribe-broadcast web page that you can use with the example broadcast API to send broadcast messages and provide broadcast statuses. To learn how, see [Try the subscribe with built-in consent and broadcast flow](https://docs.xmtp.org/consent/subscribe-broadcast).

**Note**: This project was created using `bun init` in bun v1.0.25. [Bun](https://bun.sh/) is a fast all-in-one JavaScript runtime.

## Install dependencies

```bash
bun install
```

## Get a broadcast key bundle

For this example, you can use this script to get a key bundle for the wallet address you want to use to broadcast the message.

First, pick the wallet address you want to use as the broadcast sending address. Ensure that it is enabled on the XMTP `dev` network.

### Install the XMTP SDK

If not already installed, install the XMTP JavaScript SDK. You must be using Node.js >=20.

```bash
yarn add @xmtp/xmtp-js ethers
```

### Install TSX

If not already installed, install TSX.

```bash
npm install -g tsx
```

### Create the script to generate the key bundle

In the `broadcast-example-api` directory, create a `generateAndPrintKeys.ts` file with the following contents.

Replace `<YOUR_PRIVATE_KEY>` with the private key for the wallet address you want to use as the broadcast address.

```tsx
import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import type { Signer } from "ethers";

const ENCODING = "base64"; // Use base64 encoding for a clean text output

export const generateAndPrintKeys = async (signer: Signer) => {
  const clientOptions = {
    env: "production", // this works even if in .env, XMTP_ENV=dev. if set this to dev, key bundle doesn't work.
  };

  const address = await signer.getAddress();
  let keys: Uint8Array | null = null;

  keys = await Client.getKeys(signer, {
    ...clientOptions,
    skipContactPublishing: true,
    persistConversations: false,
  });

  // Output the keys in Base64 format for .env storage
  console.log(`XMTP_KEY_BUNDLE=${Buffer.from(keys).toString(ENCODING)}`);

  // Example of how you might use these keys in creating the client
  const client = await Client.create(null, {
    ...clientOptions,
    privateKeyOverride: keys,
  });

  return client;
};

// Example usage
const main = async () => {
  const privateKey = "<YOUR_PRIVATE_KEY>"; // Replace with your private key
  const wallet = new Wallet(privateKey);

  console.log(`Using Wallet Address: ${wallet.address}`);

  await generateAndPrintKeys(wallet);
};

main().catch(console.error);
```

### Run the script

Run the script to get the key bundle. Make a note of the key bundle. You’ll need it in the next step.

```bash
tsx generateAndPrintKeys.ts
```

## Set up the environment

In the `broadcast-example-api` directory, create an `.env` file with the following contents, for example.

Replace `<your hex string of broadcast key bundle>` with the key bundle you got from the `generateAndPrintKeys.ts` script.

```
XMTP_ENV=dev
PORT=6989

# XMTP Broadcast-specific configuration
XMTP_RATE_LIMIT_AMOUNT=1000
XMTP_RATE_LIMIT_DURATION=300000
XMTP_KEY_BUNDLE=<your hex string of broadcast key bundle>
XMTP_FILE_PERSISTENCE_PATH=/tmp/xmtp
```

### Update the CORS policy

In `index.ts` at the root of the `broadcast-example-api` directory, add `"http://localhost:3000"` as shown in the following example.

This addition enables the broadcast API to accept requests from `http://localhost:3000` , which will be the URL of the example subscribe-broadcast page that you’ll use with the broadcast API in an upcoming step.

```tsx
app.use(
  cors({
    origin: ["http://localhost:3000", "https://subscribe-broadcast.vercel.app"],
  })
);
```

## Install dotenv

If not already installed, install dotenv.

```bash
yarn add dotenv
```

### Load environment variables to your app

At the top of the `src/index.ts` file, add the following line. This will load all variables from your `.env` file into `process.env`.

```tsx
import "dotenv/config";
```

## Install and start Redis

If not already installed, install Redis.

### Install Redis

```bash
brew install redis
```

### Start Redis

```bash
redis-server
```

### Verify Redis is running

```bash
redis-cli ping
```

## Define a broadcast welcome message

In `src/lib/broadcasterConfigs.ts`, remove all but the first object in the broadcast configuration array. When you are done, the array should look like this:

```ts
const broadcastConfigs: BroadcastConfig[] = [
  {
    address: "0x85583261a4c3ad6785Ac90BD8880393831F97F54",
    greeting: "Welcome to Hello World Wild Web broadcasts",
    id: "XMTP",
  },
];
```

Set the **address** key to the broadcast sending address.

Set the **greeting** key to the welcome message you want to send when someone subscribes to the broadcast.

For the purposes of this example, you can leave the **id** key as-is.

## Run the broadcast API

```bash
yarn dev
```

To use this example broadcast API to try out the flow to subscribe to a broadcast with built-in consent, use it with the [subscribe-broadcast repo](https://github.com/xmtp/subscribe-broadcast).

To learn how, see [Try the subscribe with built-in consent and broadcast flow](https://docs.xmtp.org/consent/subscribe-broadcast).
