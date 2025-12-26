const db = require('../config/database');

function trackNavigation(req, res, next) {
  const userId = req.user?.id || null;
  const guestId = req.guestId || req.cookies?.guest_id || null;
  const method = req.method;
  const path = req.path;
  const query = JSON.stringify(req.query || {});
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';

  db.run(
    `INSERT INTO navigation_history (user_id, guest_id, method, path, query, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [userId, guestId, method, path, query, userAgent, ip],
    (err) => {
      if (err) {
        console.error('Erro ao registrar navegação:', err);
      }
    }
  );

  next();
}

module.exports = trackNavigation;

