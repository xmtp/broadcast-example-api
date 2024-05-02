interface Broadcast {
  id: string;
  message: string;
  recipients: string[];
  sent: string[];
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

export const addBroadcast = (recipients: string[], message: string): string => {
  const id = uuidv4();

  const broadcast: Broadcast = {
    id,
    message,
    recipients,
    sent: [],
    startTime: new Date().toISOString(),
    status: "sending",
  };
  broadcastEntities.ids.push(id);
  broadcastEntities.entities[id] = broadcast;

  return id;
};

export const updateBroadcastFromBatch = (id: string, batch: string[]): void => {
  const broadcast = broadcastEntities.entities[id];
  broadcast.sent.push(...batch);
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
