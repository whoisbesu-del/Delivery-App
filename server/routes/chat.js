const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Get all conversations for current user
router.get('/conversations', authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        u1.name as p1_name, u1.role as p1_role,
        u2.name as p2_name, u2.role as p2_role,
        (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id!=$1 AND read_at IS NULL)::int as unread_count
      FROM conversations c
      JOIN users u1 ON u1.id=c.participant1
      JOIN users u2 ON u2.id=c.participant2
      WHERE c.participant1=$1 OR c.participant2=$1
      ORDER BY last_message_at DESC NULLS LAST
    `, [req.user.id]);

    res.json({ conversations: result.rows.map(c => ({
      id: c.id, type: c.type, orderId: c.order_id,
      lastMessage: c.last_message, lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count || 0,
      otherUser: req.user.id === c.participant1
        ? { id: c.participant2, name: c.p2_name, role: c.p2_role }
        : { id: c.participant1, name: c.p1_name, role: c.p1_role },
    }))});
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not fetch conversations.' }); }
});

// Get or create conversation
router.post('/conversations', authRequired, async (req, res) => {
  try {
    const { otherUserId, type, orderId } = req.body || {};
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required.' });
    const p1 = Math.min(req.user.id, Number(otherUserId));
    const p2 = Math.max(req.user.id, Number(otherUserId));
    const orderIdVal = orderId ? Number(orderId) : null;

    let result = await pool.query(
      `SELECT * FROM conversations WHERE participant1=$1 AND participant2=$2 AND
       (($3::int IS NULL AND order_id IS NULL) OR order_id=$3)`,
      [p1, p2, orderIdVal]
    );
    if (result.rows.length > 0) return res.json({ conversation: result.rows[0] });

    result = await pool.query(
      'INSERT INTO conversations (type,order_id,participant1,participant2) VALUES ($1,$2,$3,$4) RETURNING *',
      [type || 'support', orderIdVal, p1, p2]
    );
    res.status(201).json({ conversation: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not create conversation.' }); }
});

// Get messages
router.get('/conversations/:id/messages', authRequired, async (req, res) => {
  try {
    const conv = await pool.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    if (!conv.rows.length) return res.status(404).json({ error: 'Conversation not found.' });
    const c = conv.rows[0];
    if (c.participant1 !== req.user.id && c.participant2 !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    // Mark as read
    await pool.query(
      'UPDATE messages SET read_at=NOW() WHERE conversation_id=$1 AND sender_id!=$2 AND read_at IS NULL',
      [req.params.id, req.user.id]
    );
    const result = await pool.query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.conversation_id=$1 ORDER BY m.created_at ASC`,
      [req.params.id]
    );
    res.json({ messages: result.rows.map(m => ({
      id: m.id, body: m.body, createdAt: m.created_at, readAt: m.read_at,
      sender: { id: m.sender_id, name: m.sender_name, role: m.sender_role }
    }))});
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not fetch messages.' }); }
});

// Send message
router.post('/conversations/:id/messages', authRequired, async (req, res) => {
  try {
    const conv = await pool.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    if (!conv.rows.length) return res.status(404).json({ error: 'Conversation not found.' });
    const c = conv.rows[0];
    if (c.participant1 !== req.user.id && c.participant2 !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { body } = req.body || {};
    if (!body?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
    const result = await pool.query(
      'INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, body.trim()]
    );
    const m = result.rows[0];
    res.status(201).json({ message: { id:m.id, body:m.body, createdAt:m.created_at,
      sender:{ id:req.user.id, name:req.user.name, role:req.user.role } } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not send message.' }); }
});

// Total unread
router.get('/unread', authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)::int as count FROM messages m
      JOIN conversations c ON c.id=m.conversation_id
      WHERE (c.participant1=$1 OR c.participant2=$1) AND m.sender_id!=$1 AND m.read_at IS NULL
    `, [req.user.id]);
    res.json({ unread: result.rows[0].count });
  } catch { res.json({ unread: 0 }); }
});

// Get admin ID for support chat
router.get('/admin-contact', authRequired, async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    res.json({ adminId: result.rows[0]?.id || null });
  } catch (err) { res.status(500).json({ error: 'Could not get admin contact.' }); }
});

module.exports = router;
