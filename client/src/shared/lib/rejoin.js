// client/src/shared/lib/rejoin.js
export const KEY_REJOIN = 'durak:lastTableId';
export function saveLastTableId(tableId){ try{ localStorage.setItem(KEY_REJOIN, String(tableId)); }catch(e){} }
export function getLastTableId(){ try{ return localStorage.getItem(KEY_REJOIN) || null; }catch(e){ return null; } }
export function clearLastTableId(){ try{ localStorage.removeItem(KEY_REJOIN); }catch(e){} }
