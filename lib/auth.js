import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const usersFile = path.join(process.cwd(), "data", "users.json");

async function ensureUsersFile() {
  try {
    await fs.access(usersFile);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(path.dirname(usersFile), { recursive: true });
      await fs.writeFile(usersFile, "[]", "utf-8");
    } else {
      throw error;
    }
  }
}

async function readUsers() {
  await ensureUsersFile();
  const content = await fs.readFile(usersFile, "utf-8");
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse users.json", error);
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const users = await readUsers();
  const normalized = email.toLowerCase();
  return (
    users.find((user) => user.email.toLowerCase() === normalized) ?? null
  );
}

export async function createUser({ username, email, password }) {
  const users = await readUsers();
  const normalizedEmail = email.toLowerCase();
  const existing = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const newUser = {
    id: crypto.randomUUID(),
    username,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}

export async function verifyUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const passwordHash = hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return null;
  }

  return user;
}
