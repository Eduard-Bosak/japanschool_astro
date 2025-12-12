'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Switch({
  id,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className
}: SwitchProps) {
  // Use internal state if not controlled
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleClick = () => {
    if (disabled) return;

    const newValue = !isChecked;

    // Update internal state if uncontrolled
    if (checked === undefined) {
      setInternalChecked(newValue);
    }

    // Call callback
    if (onCheckedChange) {
      onCheckedChange(newValue);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isChecked ? 'bg-primary' : 'bg-input',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      style={{ transition: 'background-color 200ms' }}
    >
      {/* Thumb/Knob */}
      <span
        style={{
          position: 'absolute',
          top: '1px',
          left: isChecked ? '22px' : '2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 200ms ease-out'
        }}
      />
    </button>
  );
}

export { Switch };
