import React from 'react';
const STYLES = {
  pending:   { bg:'var(--bg3)',           color:'var(--text3)' },
  accepted:  { bg:'rgba(34,197,94,0.12)', color:'#22C55E' },
  picked_up: { bg:'rgba(34,197,94,0.12)', color:'#22C55E' },
  delivered: { bg:'rgba(34,197,94,0.2)',  color:'#16A34A' },
};
const LABELS = { pending:'Placed', accepted:'Accepted', picked_up:'Picked up', delivered:'Delivered' };
export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.pending;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:999, padding:'3px 10px', fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center' }}>
      {LABELS[status]||status}
    </span>
  );
}
