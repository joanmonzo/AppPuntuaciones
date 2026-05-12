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

  // Limpiamos la variable de ronda para que NO muestre "General" si existe
  const roundDisplay = currentRound && !currentRound.toUpperCase().includes("GENERAL") ? currentRound : "";

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title" style={{ fontSize: '28px', letterSpacing: '1px' }}>
          THE GOLFOS ON TOUR{' '}
          {roundDisplay && (
            <span
              style={{
                fontSize: '0.5em',
                color: 'var(--gold)',
                verticalAlign: 'middle',
                marginLeft: '10px'
              }}
            >
              {roundDisplay}
            </span>
          )}
          <span>
            <img
              src={appLogo}
              alt="Logo"
              style={{
                height: '80px',
                verticalAlign: 'middle',
                marginLeft: '30px',
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
            {/* PESTAÑA MARCADOR: Forzada a MORADO SÓLIDO (No transparente) */}
            <button
              className={`tab-btn ${activeTab === 'marcador' ? 'active' : ''}`}
              onClick={() => setActiveTab('marcador')}
              style={{
                // Usamos HEX directo para asegurar el tono morado CTA y forzamos opacidad
                backgroundColor: activeTab === 'marcador' ? '#a855f7' : '',
                borderColor: activeTab === 'marcador' ? '#a855f7' : '',
                color: activeTab === 'marcador' ? '#fff' : '',
                // ESTOS CAMBIOS GARANTIZAN QUE NO SEA TRANSPARENTE
                backgroundImage: activeTab === 'marcador' ? 'none' : '',
                opacity: activeTab === 'marcador' ? '1' : '',
                boxShadow: activeTab === 'marcador' ? '0 2px 8px rgba(168, 85, 247, 0.4)' : ''
              }}
            >
              Marcador
            </button>
          </div>
        </div>
      </div>

      <div className="header-right" style={{ alignItems: 'flex-start' }}>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className={`status-dot ${isOffline ? 'offline' : error ? 'error' : 'online'}`}
              style={{
                ...(isOffline ? { backgroundColor: 'orange', boxShadow: '0 0 10px orange' } : {}),
                ...(!isOffline && !error ? {
                  backgroundColor: 'var(--red)',
                  boxShadow: '0 0 8px var(--red)',
                  animation: 'blink 1.5s infinite'
                } : {})
              }}
            />

            <span
              className="status-text"
              style={{
                fontSize: '16px',
                fontWeight: '900',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {isSyncing || syncQueue.length > 0
                ? <span style={{ color: 'var(--gold)' }}>SINCRONIZANDO...</span>
                : isOffline
                  ? <span style={{ color: 'orange' }}>OFFLINE</span>
                  : error
                    ? <span style={{ color: 'var(--red)' }}>ERROR</span>
                    : (
                      <>
                        <span style={{ color: 'var(--red)', textShadow: '0 0 10px rgba(224, 91, 91, 0.3)' }}>
                          LIVE SCORING
                        </span>

                        {lastUpdate && (
                          <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                          }}>
                            {lastUpdate.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        )}
                      </>
                    )}
            </span>
          </div>

          {!isOffline && !error && !isSyncing && (
            <span style={{
              fontSize: '9px',
              color: 'var(--text2)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '2px',
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>
              Última actualización de datos
            </span>
          )}
        </div>
      </div>
    </header>
  );
}