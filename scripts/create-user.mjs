// Create a login user:  npm run user:create -- <username> [password]
// Password is prompted securely when omitted (never pass secrets in shared shells).
import readline from "node:readline";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

function ask(question, silent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: silent ? undefined : process.stdout,
    terminal: true,
  });
  return new Promise((resolve) => {
    if (silent) {
      // mask typed characters
      process.stdout.write(question);
      const onData = (ch) => {
        const c = ch.toString();
        if (c === "\n" || c === "\r" || c === "\u0004") {
          process.stdin.off("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(line);
        } else if (c === "\u0003") {
          process.exit(1);
        } else {
          line += c;
        }
      };
      let line = "";
      process.stdin.on("data", onData);
    } else {
      rl.question(question, (a) => {
        rl.close();
        resolve(a);
      });
    }
  });
}

const username = (process.argv[2] ?? "").trim();
if (!username || username.length > 100 || !/^[A-Za-z0-9_.-]+$/.test(username)) {
  console.error("Usage: npm run user:create -- <username> [password]");
  console.error("Username: 1-100 chars, letters/numbers/._- only.");
  process.exit(1);
}

let password = process.argv[3] ?? "";
if (!password) password = await ask("Password (min 8 chars): ", true);
if (password.length < 8 || password.length > 72) {
  console.error("Password must be 8-72 characters.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const exists = await client.query(`SELECT id FROM users WHERE username = $1`, [username]);
  if (exists.rowCount > 0) {
    console.error(`User "${username}" already exists.`);
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await client.query(`INSERT INTO users (username, password_hash) VALUES ($1, $2)`, [username, hash]);
  console.log(`User "${username}" created. They can now log in.`);
} finally {
  await client.end();
}
