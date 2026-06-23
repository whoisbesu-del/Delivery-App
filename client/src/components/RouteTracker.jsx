import React from 'react';

const STEPS = [
  { key:'pending',   label:'Placed' },
  { key:'accepted',  label:'Accepted' },
  { key:'picked_up', label:'Picked up' },
  { key:'delivered', label:'Delivered' },
];

export default function RouteTracker({ status, compact=false }) {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  const isDelivered = status === 'delivered';
  return (
    <div className="flex items-center">
      {STEPS.map((step, idx) => {
        const reached = idx <= currentIdx;
        const isLast = idx === STEPS.length - 1;
        const dotColor = reached ? (isLast && isDelivered ? '#22C55E' : '#22C55E') : 'var(--border)';
        const lineColor = idx < currentIdx ? '#22C55E' : 'var(--border)';
        const dotSize = compact ? 8 : 12;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div style={{ width:dotSize, height:dotSize, borderRadius:'50%', background:dotColor,
                boxShadow: reached && idx===currentIdx && !isDelivered ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
                transition:'all 0.3s ease' }} />
              {!compact && (
                <span className="mt-1.5 text-[10px] font-mono uppercase tracking-wide whitespace-nowrap"
                  style={{ color: reached ? 'var(--text)' : 'var(--text3)' }}>
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div style={{ height:2, width:compact?24:36, background:lineColor,
                marginBottom:compact?0:18, transition:'background 0.3s ease' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
