import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set — add it to your .env.local file.");
  }

  const client = new MongoClient(uri);

  // Cache the connection on the global object in dev so Next.js's module
  // reloading (HMR) doesn't open a fresh MongoClient on every edit.
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  return client.connect();
}

let clientPromise: Promise<MongoClient> | undefined;

export function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  return clientPromise;
}

const DB_NAME = process.env.MONGODB_DB || "homz";

export async function getDb() {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}
