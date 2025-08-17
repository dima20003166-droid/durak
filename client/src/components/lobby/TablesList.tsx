
import React, { useEffect, useState } from 'react';
import { fetchTables, joinTable, getMyActiveTable, TableDto } from '../../api/tables';

const LAST_KEY = 'LAST_TABLE_ID';

export default function TablesList() {
  const [tables, setTables] = useState<TableDto[]>([]);
  const [myActive, setMyActive] = useState<string | null>(null);

  useEffect(() => {
    fetchTables().then(setTables).catch(console.error);
    getMyActiveTable().then((t) => setMyActive(t?.tableId ?? null)).catch(() => {});
  }, []);

  const lastLocal = typeof window !== 'undefined' ? localStorage.getItem(LAST_KEY) : null;

  const handleJoin = async (id: string) => {
    const res = await joinTable(id);
    if (res.status === 'locked') {
      alert('Стол занят, идёт игра');
      return;
    }
    const tid = res.tableId || id;
    window.location.href = `/game/${tid}`;
  };

  return (
    <div className="tables">
      {tables.map(t => {
        const canRejoin = Boolean(t.canRejoin) || t.id === lastLocal || t.id === myActive;
        const playingLocked = t.status === 'playing' && !canRejoin;
        return (
          <div key={t.id} className="table-row">
            <div className="title">{t.title || 'Стол'}</div>
            <div className="status">{t.status}</div>
            <div className="action">
              {playingLocked ? (
                <button className="btn btn-disabled" disabled>Идёт игра</button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleJoin(t.id)}>
                  {canRejoin ? 'Вернуться' : 'Идти в игру'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
