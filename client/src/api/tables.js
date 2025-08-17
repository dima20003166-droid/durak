import http from './http.js'
export async function fetchTables(){ const r = await http.get('/tables'); return r.data }
export async function joinTable(id){ const r = await http.post(`/tables/${id}/join`); return r.data }
export async function getMyActiveTable(){ const r = await http.get('/me/active-table'); return r.data }
