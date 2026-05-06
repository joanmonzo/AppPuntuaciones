import React from 'react';
import { getInitials, getScoreClass } from '../utils/helpers';
import { TEAM_AVATAR_IMAGES } from '../utils/constants';

export default function PlayerModal({
  equiposUnicosMatch,
  scoringTeamFilter,
  setScoringTeamFilter,
  scoringPlayer,
  setScoringPlayer,
  players,
  resetScores,
  saveScores,
  isSaving,
  scoringRound,
  setScoringRound,
  scoringData,
  dbRonda1,
  dbRonda2,
  setSelectedHoleInfo,
  handleScoreChange
}) {
  const teamLogo = scoringPlayer ? TEAM_AVATAR_IMAGES[scoringPlayer.EQUIPO] : null;

  return (
    <div className="anotacion-tab slide-up">
      {!scoringPlayer && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '15px 20px',
          marginBottom: '20px',
          color: 'var(--text2)',
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          💡 Selecciona un jugador del menú superior o haz clic en cualquier nombre de la clasificación para empezar a introducir los resultados
        </div>
      )}

      <div className="scoring-controls-wrapper" style={{ marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        
        {/* Agrupamos Logos (Vertical) + Selector (Al lado) */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          
          {/* 1. FILTRO POR EQUIPOS (VERTICAL) */}
          <div className="team-filter-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {equiposUnicosMatch.map(eq => {
              const logo = TEAM_AVATAR_IMAGES[eq];
              const isActive = scoringTeamFilter === eq;
              const isAnyActive = scoringTeamFilter !== "";

              return (
                <button
                  key={eq}
                  onClick={() => {
                    setScoringTeamFilter(isActive ? "" : eq);
                    setScoringPlayer(null);
                  }}
                  title={eq}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    border: isActive ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg3)',
                    padding: '0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isAnyActive && !isActive ? 0.3 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isActive ? '0 4px 10px rgba(212, 175, 55, 0.2)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {logo ? (
                    <img src={logo} alt={eq} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text)' }}>
                      {getInitials(eq)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. SELECTOR DE JUGADOR (AL LADO) */}
          <div className="control-group" style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {scoringTeamFilter ? `Filtrando: ${scoringTeamFilter}` : "Seleccionar Jugador"}
            </label>
            <select
              className="scoring-select"
              value={scoringPlayer?.Jugador || ""}
              onChange={(e) => {
                const p = players.find(pl => pl.Jugador === e.target.value);
                setScoringPlayer(p);
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '14px', fontWeight: '600' }}
            >
              <option value="">— Elegir jugador —</option>
              {players
                .filter(p => !scoringTeamFilter || p.EQUIPO === scoringTeamFilter)
                .sort((a, b) => {
                  const nameA = (a._CleanName || a.Jugador || "").toUpperCase();
                  const nameB = (b._CleanName || b.Jugador || "").toUpperCase();
                  return nameA.localeCompare(nameB);
                })
                .map(p => (
                  <option key={p.Jugador} value={p.Jugador}>
                    {p._CleanName || p.Jugador} ({p.ARQUETIPO || "Sin Arquetipo"})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* 3. BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <button className="reset-btn" onClick={resetScores} disabled={!scoringPlayer || isSaving} title="Borrar ronda actual" style={{ width: '46px', height: '46px', borderRadius: '12px' }}>↺</button>
          <button className="save-btn" onClick={saveScores} disabled={!scoringPlayer || isSaving} style={{ padding: '0 25px', borderRadius: '12px', height: '46px', fontSize: '14px', fontWeight: '800', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(91, 196, 216, 0.2)' }}>
            {isSaving ? "PROCESANDO..." : "GUARDAR"}
          </button>
        </div>
      </div>

      {/* Anotación de golpes */}
      {scoringPlayer && (
        <div className="scoring-grid-container card-premium" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="card-header-scoring" style={{ padding: '25px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr minmax(100px, 1fr)', alignItems: 'center', gap: '30px', flex: 1 }}>
              <div className="team-logo-modal" style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border2)', flexShrink: 0 }}>
                {teamLogo ? (
                  <img src={teamLogo} alt={scoringPlayer.EQUIPO} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--gold)' }}>
                    {getInitials(scoringPlayer.EQUIPO)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h2 style={{ color: 'var(--text)', margin: 0, fontSize: '22px', letterSpacing: '0.5px', fontWeight: '700', lineHeight: '1.1' }}>
                  {scoringPlayer._CleanName || scoringPlayer.Jugador}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase' }}>
                  {scoringPlayer.ARQUETIPO || "—"}
                </span>
              </div>
            </div>

            <div className="modal-tabs round-selector-tab" style={{ margin: 0 }}>
              <button className={`modal-tab-btn ${scoringRound === "Ronda 1" ? "active" : ""}`} onClick={() => setScoringRound("Ronda 1")}>R1</button>
              <button className={`modal-tab-btn ${scoringRound === "Ronda 2" ? "active" : ""}`} onClick={() => setScoringRound("Ronda 2")}>R2</button>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="stats-grid">
              <div className="stats-row header" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '10px 15px' }}>
                <span>Hoyo</span>
                <span>PAR CAMPO</span>
                <span>PAR JUEGO</span>
                <span>GOLPES</span>
              </div>
              <div className="scrollable-grid" style={{ maxHeight: '60vh', overflowY: 'auto', marginRight: '-25px' }}>
                {(() => {
                  const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
                  const parCampoRow = activeDb.find(p => p.Jugador === "PAR CAMPO");
                  const parJugadorRow = activeDb.find(p => p.Jugador === scoringPlayer?._parName);
                  const hcpRow = activeDb.find(p => p.Jugador === "HCP HOYO");

                  return Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
                    const data = scoringData[h] || { par: "", golpes: "" };
                    const hcpVal = hcpRow?.[h] || "-";

                    const parCampo = Number(parCampoRow?.[h]) || 0;
                    const hándicap = Number(parJugadorRow?.[h]) || 0;
                    const parTotal = parCampo + hándicap;

                    const scoreClass = getScoreClass(data.golpes, parTotal);

                    return (
                      <div className="stats-row" key={h} style={{ gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '12px 15px', marginBottom: '4px' }}>
                        <div className="hole-cell">
                          <button className="hole-btn-trigger" onClick={() => setSelectedHoleInfo(h)} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: '700' }}>
                            {h} 🗺️
                          </button>
                        </div>
                        <span style={{ color: 'var(--text2)', alignSelf: 'center', fontWeight: '600' }}>{parCampo > 0 ? parCampo : "-"}</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'var(--text2)', fontWeight: '600' }}>
                            {parTotal > 0 ? parTotal : "-"}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="text"
                            inputMode="text"
                            className={`edit-input ${scoreClass}`}
                            value={data.golpes}
                            onChange={(e) => handleScoreChange(h, "golpes", e.target.value)}
                            disabled={isSaving}
                            placeholder="-"
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}