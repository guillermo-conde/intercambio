const L = require('./_lib');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    const code = L.normalizeCode((req.body || {}).code);
    const sql = await L.db();
    const rows = await sql`SELECT giver, salt, receiver_enc FROM draws`;
    for (const r of rows) {
      const receiver = L.decrypt(code, r.salt, r.receiver_enc);
      if (receiver) return res.json({ giver: r.giver, receiver });
    }
    res.status(404).json({ error: 'Ese código no es válido. Revisa que esté bien escrito.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
