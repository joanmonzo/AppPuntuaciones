import React from 'react';
import { TEAM_CAPTAINS, TEAM_AVATAR_IMAGES } from '../utils/constants';
import { getInitials, getScoreClass } from '../utils/helpers';
import { RankBadge, ResultadoBadge } from './UIComponents';

export default function TeamStandings({
    equiposData,
    maxPuntosEquipos,
    expandedTeam,
    setExpandedTeam,
    accordionRound,
    setAccordionRound,
    selectedHoleInfo,
    setSelectedHoleInfo,
    dbRonda1,
    dbRonda2,
    matchPlayHtml
}) {
    return (
        <div className="equipos-lista slide-up">
            <div className="table-header header-equipos">
                <span className="th-rank">Pos</span>
                <span className="th-team">Equipo</span>
                <span className="th-players-list hide-mobile">Jugadores</span>
                <span className="th-r1">R1</span>
                <span className="th-r2">R2</span>
                <span className="th-tot">Pts</span>
            </div>
            <div className="table-body">
                {equiposData.length > 0 ? (
                    equiposData.map((eq) => {
                        const isLeader = eq.totalPuntos === maxPuntosEquipos && eq.totalPuntos > 0;
                        const logoUrl = TEAM_AVATAR_IMAGES[eq.equipo];
                        const isExpanded = expandedTeam === eq.equipo;

                        return (
                            <div
                                key={eq.equipo}
                                className={`team-accordion-wrapper ${isExpanded ? "expanded" : ""} ${eq.isFinished ? "finished" : ""}`}
                            >
                                <div
                                    className={`equipo-row ${isLeader ? "leader" : ""} ${isExpanded ? "active" : ""} ${eq.isFinished ? "finished" : ""}`}
                                    onClick={() => setExpandedTeam((prev) => prev === eq.equipo ? null : eq.equipo)}
                                >
                                    <div className="row-rank">
                                        <RankBadge rank={eq._rank} showMedal={eq.isFinished} />
                                    </div>
                                    <div className="row-team">
                                        <div className="team-avatar-mini">
                                            {logoUrl ? (
                                                <img src={logoUrl} alt={eq.equipo} />
                                            ) : (
                                                <span>{getInitials(eq.equipo)}</span>
                                            )}
                                        </div>
                                        <span className="team-name-row">{eq.equipo}</span>
                                        <span className="accordion-arrow">
                                            {isExpanded ? "▼" : "▶"}
                                        </span>
                                    </div>
                                    <div className="row-players-list hide-mobile">
                                        {eq.jugadores.map((p, idx) => {
                                            const nombre = p._CleanName || p.Jugador;
                                            const capName = TEAM_CAPTAINS[eq.equipo.toUpperCase()];
                                            const esCapitan = capName && nombre.toUpperCase().includes(capName.toUpperCase());
                                            return (
                                                <span key={idx} className={`player-mini-tag ${esCapitan ? "captain-tag" : ""}`}>
                                                    {nombre} {esCapitan && <span className="cap-icon">(C)</span>}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <span className="score-val" style={{ textAlign: "center", fontWeight: "600" }}>{eq.teamR1}</span>
                                    <span className="score-val" style={{ textAlign: "center", fontWeight: "600" }}>{eq.teamR2}</span>
                                    <div className="score-tot">
                                        <ResultadoBadge valor={eq.totalPuntos} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="equipo-desplegable">
                                        <div className="desplegable-header">
                                            <span className="desplegable-title">Estadísticas por hoyo</span>
                                            <div className="modal-tabs mini">
                                                <button
                                                    className={`modal-tab-btn ${accordionRound === "R1" ? "active" : ""}`}
                                                    onClick={() => setAccordionRound("R1")}
                                                >
                                                    R1
                                                </button>
                                                <button
                                                    className={`modal-tab-btn ${accordionRound === "R2" ? "active" : ""}`}
                                                    onClick={() => setAccordionRound("R2")}
                                                >
                                                    R2
                                                </button>
                                            </div>
                                        </div>

                                        <div className="table-responsive">
                                            <div className="hole-grid">
                                                <div className="hole-row header">
                                                    <span className="hole-label">Hoyo</span>
                                                    {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
                                                        <span
                                                            key={h}
                                                            className="hole-num score-box"
                                                            onClick={() => setSelectedHoleInfo(selectedHoleInfo === h ? null : h)}
                                                        >
                                                            {h}
                                                        </span>
                                                    ))}
                                                    <span className="hole-total">Tot</span>
                                                </div>

                                                <div className="hole-row par">
                                                    <span className="hole-label">Par</span>
                                                    {(() => {
                                                        const anyPlayer = eq.jugadores[0];
                                                        const parRow = dbRonda1.find((p) => p.Jugador === anyPlayer?._parName) ||
                                                            dbRonda2.find((p) => p.Jugador === anyPlayer?._parName);
                                                        let parSum = 0;
                                                        return (
                                                            <>
                                                                {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
                                                                    const pVal = Number(parRow?.[h]) || 0;
                                                                    parSum += pVal;
                                                                    return (
                                                                        <span key={h} className="score-box">{pVal || "-"}</span>
                                                                    );
                                                                })}
                                                                <span className="hole-total">{parSum}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {eq.jugadores.map((player) => {
                                                    const source = accordionRound === "R1" ? player._r1Data : player._r2Data;
                                                    const parRow = dbRonda1.find((p) => p.Jugador === player?._parName) ||
                                                        dbRonda2.find((p) => p.Jugador === player?._parName);
                                                    let totalStrokes = 0;
                                                    const nombre = player._CleanName || player.Jugador;
                                                    const capName = TEAM_CAPTAINS[eq.equipo.toUpperCase()];
                                                    const esCapitan = capName && nombre.toUpperCase().includes(capName.toUpperCase());

                                                    if (!source) {
                                                        return (
                                                            <div className="hole-row player" key={player.Jugador}>
                                                                <span className="hole-label">
                                                                    {nombre} {esCapitan && <span className="cap-icon-mini">(C)</span>}
                                                                </span>
                                                                <span style={{ gridColumn: "span 19", color: "var(--text2)", fontStyle: "italic", fontSize: "11px" }}>
                                                                    Sin datos en esta ronda
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="hole-row player" key={player.Jugador}>
                                                            <span className="hole-label">
                                                                {nombre} {esCapitan && <span className="cap-icon-mini">(C)</span>}
                                                            </span>
                                                            {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
                                                                const strokesRaw = source[h];
                                                                const strokes = Number(strokesRaw);
                                                                const par = Number(parRow?.[h]);
                                                                totalStrokes += strokes || 0;
                                                                const scoreClass = getScoreClass(strokesRaw, par);

                                                                return (
                                                                    <span key={h} className={`score-box ${scoreClass}`}>
                                                                        {strokesRaw || "-"}
                                                                    </span>
                                                                );
                                                            })}
                                                            <span className="hole-total">{totalStrokes || "-"}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="loading">No hay equipos asignados.</div>
                )}
            </div>

            {matchPlayHtml && (
                <div className="marcador-enfrentamientos slide-up" style={{
                    marginTop: '25px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '15px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                            ⚔️ Puntos en Juego (Match Play)
                        </h3>
                    </div>

                    <div style={{ padding: '15px' }}>
                        <ul
                            className="matchplay-list"
                            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}
                            dangerouslySetInnerHTML={{ __html: matchPlayHtml }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}