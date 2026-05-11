import React from 'react';

export default function AppHeader({
  appLogo,
  currentRound,
  players,
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  isOffline,
  error,
  pulse,
  isSyncing,
  syncQueue,
  lastUpdate,
  currentTime,
}) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">
          Clasificación{' '}
          <span>
            <img
              src={appLogo}
              alt="The Golfos On Tour 2026"
              style={{
                height: '100px',
                verticalAlign: 'middle',
                marginLeft: '50px',
                borderRadius: '10px',
              }}
            />
          </span>
        </h1>
        <p className="subtitle">
          {players.length > 0 ? `${players.length} jugadores` : 'Cargando…'}
        </p>

        <div
          className="tabs-groups"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <div className="tabs-container" style={{ marginTop: 0 }}>
            <button
              className={`tab-btn ${activeTab === 'clasificacion' ? 'active' : ''}`}
              onClick={() => setActiveTab('clasificacion')}
            >
              Clasificación
            </button>
            <button
              className={`tab-btn ${activeTab === 'equipos' ? 'active equipos' : ''}`}
              onClick={() => setActiveTab('equipos')}
            >
              Equipos
            </button>
            <button
              className={`tab-btn ${activeTab === 'anotar' ? 'active anotar' : ''}`}
              onClick={() => setActiveTab('anotar')}
              style={{ position: 'relative' }}
            >
              Anotar{' '}
              <span style={{ fontSize: '10px', verticalAlign: 'top', marginLeft: '2px' }}>✎</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'marcador' ? 'active marcador' : ''}`}
              onClick={() => setActiveTab('marcador')}
              style={{ position: 'relative' }}
            >
              Marcador{' '}
              <span style={{ fontSize: '10px', verticalAlign: 'top', marginLeft: '2px' }}>📋</span>
            </button>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="clock-container" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '1px' }}>
              {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 5px var(--green)' }} />
              <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--green)', textTransform: 'uppercase' }}>Live</span>
            </div>
          </div>
          <span className="status-text" style={{ fontSize: '10px', opacity: 0.8 }}>
            {isSyncing || syncQueue.length > 0
              ? `Sincronizando... (${syncQueue.length})`
              : isOffline
                ? 'Modo Offline'
                : error
                  ? 'Error de conexión'
                  : `Actualizado: ${lastUpdate ? lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '...'}`}
          </span>
        </div>
      </div>
    </header>
  );
}