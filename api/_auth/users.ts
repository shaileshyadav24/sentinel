import { randomUUID } from "node:crypto";
import { kvGet, kvSet } from "../_kv.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

function userKey(email: string): string {
  return `user:${email.trim().toLowerCase()}`;
}

export async function getUser(email: string): Promise<UserRecord | null> {
  return kvGet<UserRecord>(userKey(email));
}

export async function createUser(email: string, password: string): Promise<UserRecord> {
  const normalizedEmail = email.trim().toLowerCase();
  const { hash, salt } = await hashPassword(password);
  const user: UserRecord = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: Date.now(),
  };
  await kvSet(userKey(normalizedEmail), user);
  return user;
}

export async function verifyUserPassword(user: UserRecord, password: string): Promise<boolean> {
  return verifyPassword(password, user.passwordHash, user.passwordSalt);
}
