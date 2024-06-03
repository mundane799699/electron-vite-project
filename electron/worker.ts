import { parentPort } from "node:worker_threads";
import { sqQuery } from "./sqlite";

parentPort.on("message", async (sql) => {
  try {
    const result = await sqQuery({ sql });
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
