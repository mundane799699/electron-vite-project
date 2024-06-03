import { parentPort } from "node:worker_threads";
import { getSqlite3 } from "./sqlite3";

parentPort.on("message", async ({ sql, filename }) => {
  try {
    const db = await getSqlite3(filename);
    const result = await query({ sql }, db);
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});

function query(param, db): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(param.sql, param.params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
