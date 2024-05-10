interface Broadcast {
  id: string;
  address: string;
  message: string;
  recipients: number;
  sent: number;
  startTime: string;
  endTime?: string;
  status: "sending" | "waiting" | "completed" | "failed";
}

interface BroadcastEntities {
  ids: string[];
  entities: { [id: string]: Broadcast };
}

export const broadcastEntities: BroadcastEntities = {
  ids: [],
  entities: {},
};

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const addBroadcast = (
  broadcastAddress: string,
  recipients: string[],
  message: string
): string => {
  const id = uuidv4();

  const broadcast: Broadcast = {
    id,
    address: broadcastAddress,
    message,
    recipients: recipients.length,
    sent: 0,
    startTime: new Date().toISOString(),
    status: "sending",
  };
  broadcastEntities.ids.push(id);
  broadcastEntities.entities[id] = broadcast;

  return id;
};

export const incrementBroadcastSent = (id: string): void => {
  const broadcast = broadcastEntities.entities[id];
  const count = broadcast.sent + 1;
  const total = broadcast.recipients;
  broadcastEntities.entities[id].sent = broadcast.sent + 1;
  console.log(`Message sent for broadcast ${id} ${count}/${total}`);
};

export const updateBroadcastStatus = (
  id: string,
  status: Broadcast["status"]
): void => {
  broadcastEntities.entities[id].status = status;
};

export const finishBroadcast = (id: string): void => {
  broadcastEntities.entities[id].endTime = new Date().toISOString();
  broadcastEntities.entities[id].status = "completed";
};
