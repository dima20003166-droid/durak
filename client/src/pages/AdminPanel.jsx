// client/src/pages/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import socketService from '../services/socketService';

const numberOr = (v, def=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export default function AdminPanel({ user: _user, setPage, siteSettings }) {
  void _user;
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(
    siteSettings || {
      commission: 5,
      botsEnabled: true,
      maxPlayersLimit: 6,
      rake: 0.05,
      roundDurationMs: 30000,
      lockMs: 2500,
      minBet: 1,
      maxBet: 1000,
    }
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [range, setRange] = useState('1d');
  const [stats, setStats] = useState({ totalRevenue: 0, matchesCount: 0, earningsByDay: {}, onlineCount: 0, botNet: 0 });
  const [online, setOnline] = useState(0);

  useEffect(() => {
    socketService.adminGetAllUsers();
    socketService.adminGetSettings();
    socketService.adminGetStats(range);
  }, [range]);

  useEffect(() => {
    const onUsers = (list) => setUsers(Array.isArray(list) ? list : []);
    const onSettings = (s) => setSettings(prev => ({ ...prev, ...(s || {}) }));
    const onStats = (payload) => setStats(payload || { totalRevenue: 0, matchesCount: 0, earningsByDay: {}, onlineCount: 0 });
    const onOnline = ({ count }) => setOnline(numberOr(count, 0));

    socketService.on('admin_user_list', onUsers);
    socketService.on('admin_settings_data', onSettings);
    socketService.on('admin_stats', onStats);
    socketService.on('online_count', onOnline);

    return () => {
      socketService.off('admin_user_list', onUsers);
      socketService.off('admin_settings_data', onSettings);
      socketService.off('admin_stats', onStats);
      socketService.off('online_count', onOnline);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleUserChange = (id, patch) => {
    setUsers(prev => prev.map(u => u.id === id ? ({ ...u, ...patch }) : u));
  };

  const saveUser = (u) => {
    socketService.adminUpdateUser(u.id, {
      balance: numberOr(u.balance, 0),
      rank: numberOr(u.rank, u.rank || 0),
      role: u.role || 'user',
      isBanned: !!u.isBanned
    });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      socketService.adminUpdateSettings({
        commission: numberOr(settings.commission, 0),
        botsEnabled: !!settings.botsEnabled,
        maxPlayersLimit: Math.min(6, Math.max(2, Number(settings.maxPlayersLimit || 6))),
        rake: numberOr(settings.rake, 0),
        roundDurationMs: numberOr(settings.roundDurationMs, 0),
        lockMs: numberOr(settings.lockMs, 0),
        minBet: numberOr(settings.minBet, 0),
        maxBet: numberOr(settings.maxBet, 0),
      });
      // server will broadcast admin_settings_data
    } finally {
      setTimeout(() => setSavingSettings(false), 400);
    }
  };

  return (
      <div className="min-h-screen p-6 md:p-10 bg-bg text-text">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">Панель администратора</h1>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-surface text-sm">Онлайн: <span className="font-bold">{stats.onlineCount || online}</span></div>
            <button onClick={() => setPage('lobby')} className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 font-semibold text-text">В лобби</button>
          </div>
        </header>

      {/* Settings */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface/70 rounded-2xl p-5 shadow-md col-span-1">
            <h2 className="text-lg font-semibold mb-4">Настройки сайта</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Комиссия, %</label>
                <input
                  type="number"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.commission ?? 5}
                onChange={e => setSettings({ ...settings, commission: e.target.value })}
                min="0"
                max="50"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rake</label>
              <input
                type="number"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.rake ?? 0.05}
                onChange={e => setSettings({ ...settings, rake: e.target.value })}
                min="0"
                max="1"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Длительность раунда, мс</label>
              <input
                type="number"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.roundDurationMs ?? 30000}
                onChange={e => setSettings({ ...settings, roundDurationMs: e.target.value })}
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Lock, мс</label>
              <input
                type="number"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.lockMs ?? 2500}
                onChange={e => setSettings({ ...settings, lockMs: e.target.value })}
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Минимальная ставка</label>
              <input
                type="number"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.minBet ?? 1}
                onChange={e => setSettings({ ...settings, minBet: e.target.value })}
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Максимальная ставка</label>
              <input
                type="number"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2"
                value={settings.maxBet ?? 1000}
                onChange={e => setSettings({ ...settings, maxBet: e.target.value })}
                min="0"
                step="1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm mb-1">Боты</label>
                <div className="text-muted text-sm">Включить/выключить заполнение столов ботами</div>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, botsEnabled: !s.botsEnabled }))}
                className={`px-4 py-2 rounded-xl font-semibold ${settings.botsEnabled ? 'bg-danger hover:bg-danger/80' : 'bg-primary hover:bg-primary/80'}`}
              >
                {settings.botsEnabled ? 'Выключить' : 'Включить'}
              </button>
            </div>
            {/* Лимит максимум игроков для создания столов */}
            <div className="flex items-center justify-between p-4 bg-surface/60 rounded-xl border border-border/50">
              <div>
                <label className="block text-sm mb-1">Лимит «максимум игроков»</label>
                <div className="text-muted text-sm">Ограничить выбор в лобби. Диапазон 2–6.</div>
              </div>
              <select
                value={Number(settings.maxPlayersLimit||6)}
                onChange={(e) => setSettings(s => ({ ...s, maxPlayersLimit: Number(e.target.value)||6 }))}
                className="px-4 py-2 rounded-xl bg-surface border border-border"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="w-full mt-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 font-bold disabled:opacity-60"
            >
              {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>

        {/* Stats */}
          <div className="bg-surface/70 rounded-2xl p-5 shadow-md col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Статистика</h2>
            <div className="inline-flex rounded-xl overflow-hidden border border-border">
                {['1d','7d','30d'].map(r => (
                  <button key={r} onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-sm ${range===r ? 'bg-surface' : 'bg-bg hover:bg-surface/80'}`}>
                  {r==='1d'?'1 день': r==='7d'?'7 дней':'Месяц'}
                </button>
              ))}
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-bg rounded-xl p-4">
                <div className="text-muted text-sm">Заработок сайта</div>
              <div className="mt-1 text-2xl font-extrabold">{(stats.totalRevenue ?? 0).toFixed ? stats.totalRevenue.toFixed(2) : stats.totalRevenue} ₽</div>
            </div>
              <div className="bg-bg rounded-xl p-4">
                <div className="text-muted text-sm">Сыграно игр</div>
              <div className="mt-1 text-2xl font-extrabold">{stats.matchesCount || 0}</div>
            </div>
              <div className="bg-bg rounded-xl p-4">
                <div className="text-muted text-sm">Онлайн игроков</div>
              <div className="mt-1 text-2xl font-extrabold">{stats.onlineCount || online}</div>
            </div>
              <div className="bg-bg rounded-xl p-4">
                <div className="text-muted text-sm">Боты (прибыль/убыток)</div>
              <div className="mt-1 text-2xl font-extrabold">{(stats.botNet ?? 0).toFixed ? stats.botNet.toFixed(2) : stats.botNet} ₽</div>
            </div>
          </div>
          {/* Simple table of earnings by day */}
            {stats.earningsByDay && Object.keys(stats.earningsByDay).length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="py-2 pr-4">Дата</th>
                      <th className="py-2">Заработок, ₽</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.earningsByDay).sort((a,b)=>a[0].localeCompare(b[0])).map(([day, sum]) => (
                      <tr key={day} className="border-b border-surface">
                        <td className="py-2 pr-4">{day}</td>
                        <td className="py-2">{sum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>

      {/* Users */}
        <section className="bg-surface/70 rounded-2xl p-5 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Пользователи</h2>
              <input
                placeholder="Поиск по никнейму, email или ID"
                className="w-full md:w-80 bg-bg border border-border rounded-xl px-3 py-2"
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
            </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
                <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Ник</th>
                <th className="py-2 pr-4">Баланс</th>
                <th className="py-2 pr-4">Ранг</th>
                <th className="py-2 pr-4">Роль</th>
                <th className="py-2 pr-4">Бан</th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                  <tr key={u.id} className="border-b border-surface">
                  <td className="py-2 pr-4 max-w-[220px] truncate">{u.id}</td>
                  <td className="py-2 pr-4">{u.username || '—'}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                        className="w-28 bg-bg border border-border rounded-lg px-2 py-1"
                      value={numberOr(u.balance, 0)}
                      onChange={e=>handleUserChange(u.id, { balance: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                        className="w-24 bg-bg border border-border rounded-lg px-2 py-1"
                      value={numberOr(u.rank || 0, 0)}
                      onChange={e=>handleUserChange(u.id, { rank: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                        className="bg-bg border border-border rounded-lg px-2 py-1"
                      value={u.role || 'user'}
                      onChange={e=>handleUserChange(u.id, { role: e.target.value })}
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="checkbox"
                      checked={!!u.isBanned}
                      onChange={e=>handleUserChange(u.id, { isBanned: e.target.checked })}
                    />
                  </td>
                  <td className="py-2">
                    <button onClick={()=>saveUser(u)} className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/80 font-semibold">Сохранить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

AdminPanel.propTypes = {
  user: PropTypes.object.isRequired,
  setPage: PropTypes.func.isRequired,
  siteSettings: PropTypes.shape({
    commission: PropTypes.number,
    botsEnabled: PropTypes.bool,
    maxPlayersLimit: PropTypes.number,
  }),
};