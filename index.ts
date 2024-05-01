import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { xmtpClient } from "./lib/client";

const envPath = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envPath });
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cors());

app.post("/lookup", async (req: Request, res: Response) => {
  const { address } = req.body;
  console.log(req.body);
  if (typeof address !== "string") {
    console.log(req.body);
    res.status(400).send("Address must be a string");
    return;
  }
  const client = await xmtpClient;
  const canMessage = await client.canMessage(address);
  res.json({ onNetwork: canMessage }).status(200);
});

app.post("/subscribe", async (req: Request, res: Response) => {
  const { address, signature } = req.body;
  if (typeof address !== "string") {
    res.status(400).send("Address must be a string");
    return;
  }

  if (typeof signature !== "string") {
    res.status(400).send("Signature must be a string");
    return;
  }
  try {
    const client = await xmtpClient;
    // TODO: Set Signature on new conversation
    const conversation = await client.conversations.newConversation(address);
    await conversation.send("Welcome to Good Morning!");
    res.status(200).send({ topic: conversation.topic });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/subscriptions", async (req: Request, res: Response) => {});

app.post("/broadcast", async (req: Request, res: Response) => {
  const { message } = req.body;
  // Supporting sending only Text Content, but can be updated to send different types of content
  if (typeof message !== "string") {
    res.status(400).send("Message must be a string");
    return;
  }
  const client = await xmtpClient;
  const conversations = await client.conversations.list();
  for (const conversation of conversations) {
    await conversation.send(message);
  }
  res.status(200).send("Broadcasted message to all conversations");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
