interface BroadcastConfig {
  address: string;
  greeting: string;
  id: string;
}

const broadcastConfigs: BroadcastConfig[] = [];

interface BroadcastConfigEntities {
  addresses: string[];
  map: { [address: string]: BroadcastConfig };
}

export const broadCastConfigEntities = broadcastConfigs.reduce(
  (acc, config) => {
    acc.addresses.push(config.address);
    acc.map[config.address] = config;
    return acc;
  },
  { addresses: [], map: {} } as BroadcastConfigEntities
);
