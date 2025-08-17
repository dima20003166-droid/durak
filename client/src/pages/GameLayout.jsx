
import React from 'react';

export default function GameLayout({ header, center, top, bottom, left, right, footer }) {
  return (
    <div className="durak-table text-text">
      {header && <header className="game-header mb-2">{header}</header>}
      {top && <div className="flex justify-center gap-4 mb-4">{top}</div>}
      <div className="flex flex-1 w-full">
        {left && <div className="flex flex-col justify-center mr-4">{left}</div>}
        <div className="flex-1 flex flex-col items-center justify-center">{center}</div>
        {right && <div className="flex flex-col justify-center ml-4">{right}</div>}
      </div>
      {bottom && <div className="flex justify-center gap-4 mt-4">{bottom}</div>}
      {footer && <footer className="game-footer mt-2">{footer}</footer>}
    </div>
  );
}
