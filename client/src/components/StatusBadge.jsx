import React from 'react';
const STYLES = { pending:'bg-elevated text-inkmuted', accepted:'bg-amber/10 text-amber', picked_up:'bg-amber/10 text-amber', delivered:'bg-teal/10 text-teal' };
const LABELS = { pending:'Placed', accepted:'Accepted', picked_up:'Picked up', delivered:'Delivered' };
export default function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]||'bg-elevated text-inkmuted'}`}>{LABELS[status]||status}</span>;
}
