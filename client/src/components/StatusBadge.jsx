import React from 'react';

const STYLES = {
  pending: 'bg-line text-inkmuted',
  accepted: 'bg-ambersoft text-amber',
  picked_up: 'bg-ambersoft text-amber',
  delivered: 'bg-tealsoft text-teal',
};

const LABELS = {
  pending: 'Placed',
  accepted: 'Accepted',
  picked_up: 'Picked up',
  delivered: 'Delivered',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STYLES[status] || 'bg-line text-inkmuted'
      }`}
    >
      {LABELS[status] || status}
    </span>
  );
}
