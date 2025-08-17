
import React, { useEffect } from 'react';

type Props = { tableId: string };

export default function GameScreen({ tableId }: Props) {
  useEffect(() => {
    if (tableId) {
      localStorage.setItem('LAST_TABLE_ID', String(tableId));
    }
  }, [tableId]);

  return <div>Game screen for table {tableId}</div>;
}
