// src/sqlite/index.ts
import { app } from "electron";
import * as path from "path";
import * as sqlite3 from "sqlite3";
import { queryParam, insertParam, updateParam, deleteParam } from "./types";

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "sqliteDatabase.db");

console.log("Database path:", dbPath);

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("PRAGMA foreign_keys = ON");
        console.log("Connected to the database.");
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Database closed.");
          resolve();
        }
      });
    });
  }

  query(param: queryParam): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.db.all(param.sql, param.params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  insert(param: insertParam): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const keys = Object.keys(param.data);
      const values = Object.values(param.data);
      const placeholders = keys.map(() => "?").join(",");
      const sql = `INSERT INTO ${param.table} (${keys.join(
        ","
      )}) VALUES (${placeholders})`;

      this.db.run(sql, values, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  insertOrReplace(param: insertParam): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const keys = Object.keys(param.data);
      const values = Object.values(param.data);
      const placeholders = keys.map(() => "?").join(",");
      const updateKeys = keys.filter((key) => key !== "note_id");
      const updateValues = updateKeys
        .map((key) => `${key} = excluded.${key}`)
        .join(",");
      const sql = `INSERT INTO ${param.table} (${keys.join(
        ","
      )}) VALUES (${placeholders}) ON CONFLICT (note_id) DO UPDATE SET ${updateValues}`;

      this.db.run(sql, values, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  update(param: updateParam): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const entries = Object.entries(param.data)
        .map(([key, value]) => `${key} = ?`)
        .join(",");
      const params = Object.values(param.data);
      const sql = `UPDATE ${param.table} SET ${entries} WHERE ${param.condition}`;

      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  delete(param: deleteParam): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sql = `DELETE FROM ${param.table} WHERE ${param.condition}`;

      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const db = new Database();

export const initSqlite = async () => {
  try {
    await db.open();
    await db.query({
      sql: `
      CREATE TABLE IF NOT EXISTS tb_xhs_collect (
        note_id TEXT PRIMARY KEY,
        display_title TEXT,
        desc TEXT,
        author_name TEXT,
        author_id TEXT,
        cover_url TEXT,
        type TEXT,
        liked_count INTEGER,
        download_status INTEGER DEFAULT 0
      )
    `,
    });
    console.log("Database initialized.");
  } catch (err) {
    console.error("Error opening database:", err);
  }
};

export const sqQuery = db.query.bind(db);
export const sqInsert = db.insert.bind(db);
export const sqUpdate = db.update.bind(db);
export const sqDelete = db.delete.bind(db);
export const sqInertOrReplace = db.insertOrReplace.bind(db);
