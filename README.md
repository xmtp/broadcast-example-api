# broadcast-api

To install dependencies:

```bash
bun install
```

To run:

```bash
yarn dev
```

This project was created using `bun init` in bun v1.0.25. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
## Example Env
An example Env File could look something like:
```
XMTP_ENV=dev
PORT=6989

# XMTP Broadcast specific configuration
XMTP_RATE_LIMIT_AMOUNT=1000
XMTP_RATE_LIMIT_DURATION=300000
XMTP_KEY_BUNDLE=<hex string of broadcast keybundle>
XMTP_FILE_PERSISTENCE_PATH=/tmp/xmtp
```
