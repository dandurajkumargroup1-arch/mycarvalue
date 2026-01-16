"use client";

import React from 'react';

// This is a placeholder component after removing framer-motion.
// It just renders a div, preserving the component structure.
export const MotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    // We remove the animation-specific props so they don't get passed to the DOM element.
    const { initial, animate, transition, ...rest } = props as any;
    
    return (
      <div ref={ref} {...rest}>
        {children}
      </div>
    );
  }
);
MotionDiv.displayName = 'MotionDiv';
