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
}) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">
          Clasificación{' '}
          <span
            style={{
              fontSize: '0.5em',
              color: 'var(--gold)',
              verticalAlign: 'middle',
            }}
          >
            {currentRound}
          </span>
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
              Individuales
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
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div
          className={`status-dot ${isOffline ? 'offline' : error ? 'error' : 'ok'} ${pulse ? 'pulse' : ''}`}
          style={isOffline ? { backgroundColor: 'orange', boxShadow: '0 0 10px orange' } : {}}
        />
        <span className="status-text">
          {isSyncing || syncQueue.length > 0
            ? `Sincronizando cambios pendientes... (${syncQueue.length})`
            : isOffline
              ? 'Modo Offline'
              : error
                ? 'Error de conexión'
                : lastUpdate
                  ? lastUpdate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                  : 'Conectando…'}
        </span>
      </div>
    </header>
  );
}
