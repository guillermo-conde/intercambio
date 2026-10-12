const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

// 👇 Participantes hardcodeados
const PARTICIPANTS = ['Jefe', 'Jefa', 'Mono', 'Perrucho', 'Memo'];

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin caracteres confusos (0/O, 1/I/L)

async function db() {
  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  await sql`CREATE TABLE IF NOT EXISTS draws (
    giver TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    receiver_enc TEXT NOT NULL,
    code_enc TEXT NOT NULL
  )`;
  return sql;
}

const key = (secret, saltHex) => crypto.scryptSync(secret, Buffer.from(saltHex, 'hex'), 32);

function encrypt(secret, saltHex, text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(secret, saltHex), iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}

// Devuelve el texto, o null si la llave (código/contraseña) no es la correcta
function decrypt(secret, saltHex, b64) {
  try {
    const b = Buffer.from(b64, 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', key(secret, saltHex), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function newCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return 'NAV-' + s;
}

function normalizeCode(input) {
  const clean = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^NAV/, '');
  return 'NAV-' + clean;
}

function checkPassword(given, expected) {
  const h = (v) => crypto.createHash('sha256').update(String(v || '')).digest();
  return crypto.timingSafeEqual(h(given), h(expected));
}

// Sattolo: genera un ciclo único → nadie se toca a sí mismo, todos dan y reciben 1 regalo
function drawPairs() {
  const n = PARTICIPANTS.length;
  const perm = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i);
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return PARTICIPANTS.map((giver, i) => ({ giver, receiver: PARTICIPANTS[perm[i]] }));
}

module.exports = { PARTICIPANTS, db, encrypt, decrypt, newCode, normalizeCode, checkPassword, drawPairs };
