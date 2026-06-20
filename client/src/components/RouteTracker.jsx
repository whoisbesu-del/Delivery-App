import React from 'react';

const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'delivered', label: 'Delivered' },
];

export default function RouteTracker({ status, compact = false }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const isDelivered = status === 'delivered';

  return (
    <div className={compact ? 'flex items-center' : 'w-full'}>
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const reached = idx <= currentIdx;
          const isLast = idx === STEPS.length - 1;
          const dotColor = reached ? (isLast && isDelivered ? 'bg-teal' : 'bg-amber') : 'bg-line';
          const lineColor = idx < currentIdx ? 'bg-amber' : 'bg-line';
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full ${dotColor} ${compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} ${
                    reached && idx === currentIdx && !isDelivered ? 'ring-4 ring-ambersoft' : ''
                  } transition-colors`}
                />
                {!compact && (
                  <span
                    className={`mt-2 font-mono text-[11px] uppercase tracking-wide ${
                      reached ? 'text-ink' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`${compact ? 'h-[2px] w-6' : 'h-[2px] w-10 sm:w-16'} ${lineColor} transition-colors ${
                    compact ? '' : '-mt-5'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
