
import http from './http';

export type TableDto = {
  id: string;
  title?: string;
  status: 'waiting' | 'playing' | 'finished';
  players?: Array<{ id: string; name?: string }>|string[];
  canRejoin?: boolean;
};

export async function fetchTables(): Promise<TableDto[]> {
  const res = await http.get('/tables');
  return res.data;
}

export async function joinTable(id: string): Promise<{status: 'rejoin'|'joined'|'locked'; tableId?: string}> {
  const res = await http.post(`/tables/${id}/join`);
  return res.data;
}

export async function getMyActiveTable(): Promise<{tableId: string; canRejoin: boolean} | null> {
  const res = await http.get('/me/active-table');
  return res.data;
}
