const crypto = require('crypto');
const L = require('./_lib');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    const { password, action } = req.body || {};
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) return res.status(500).json({ error: 'Falta configurar ADMIN_PASSWORD en Vercel' });
    if (!L.checkPassword(password, adminPass)) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const sql = await L.db();

    if (action === 'generate') {
      const rows = L.drawPairs().map(({ giver, receiver }) => {
        const code = L.newCode();
        const salt = crypto.randomBytes(16).toString('hex');
        return {
          giver, salt,
          receiver_enc: L.encrypt(code, salt, receiver),  // solo se abre con el código del participante
          code_enc: L.encrypt(adminPass, salt, code),     // solo se abre con la contraseña de admin
        };
      });
      await sql.transaction([
        sql`DELETE FROM draws`,
        ...rows.map((r) => sql`INSERT INTO draws (giver, salt, receiver_enc, code_enc)
                               VALUES (${r.giver}, ${r.salt}, ${r.receiver_enc}, ${r.code_enc})`),
      ]);
    } else if (action !== 'status') {
      return res.status(400).json({ error: 'Acción no válida' });
    }

    const stored = await sql`SELECT giver, salt, code_enc FROM draws`;
    if (!stored.length) return res.json({ generated: false });
    const codes = L.PARTICIPANTS
      .map((name) => {
        const r = stored.find((x) => x.giver === name);
        return r && { name, code: L.decrypt(adminPass, r.salt, r.code_enc) };
      })
      .filter(Boolean);
    res.json({ generated: true, codes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor: ' + e.message });
  }
};
