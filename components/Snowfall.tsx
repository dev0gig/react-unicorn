import React, { useMemo } from 'react';

export const Snowfall: React.FC = () => {
  const snowflakes = useMemo(() => {
    const flakes = [];
    const count = 50; // Number of flakes
    const symbols = ['❄', '❅', '❆', '•'];
    
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100; // random horizontal position
      const size = 0.5 + Math.random() * 1.5; // random size
      const duration = 5 + Math.random() * 10; // random fall speed
      const delay = Math.random() * -20; // random start delay to stagger
      const opacity = 0.3 + Math.random() * 0.5;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      flakes.push(
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${left}vw`,
            fontSize: `${size}rem`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: opacity,
          }}
        >
          {symbol}
        </div>
      );
    }
    return flakes;
  }, []);

  return <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">{snowflakes}</div>;
};