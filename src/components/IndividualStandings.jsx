import React from 'react';
import PlayerRow from './PlayerRow';

export default function IndividualStandings({
    players,
    activeHoleRound,
    setActiveHoleRound,
    dbRonda1,
    dbRonda2,
    setSelectedPlayer,
    showIndividualNotice
}) {
    return (
        <div className="clasificacion-tab slide-up">
            {showIndividualNotice && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    marginBottom: '20px',
                    color: 'var(--text2)',
                    fontSize: '14px',
                    textAlign: 'center',
                    fontWeight: '500'
                }}>
                    💡 Haz clic en cualquier jugador para ver su tarjeta detallada o introducir resultados
                </div>
            )}

            {/*Cabecera*/}
            <div className="table-header header-individual">
                <span className="th-rank">#</span>
                <span className="th-player">Jugador</span>

                <span className="th-hoyo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span>Hoyo</span>
                    <div className="modal-tabs mini">
                        <span
                            className="modal-tab-btn active"
                            style={{ padding: "1px 6px", fontSize: "10px", minWidth: "auto", cursor: "default" }}
                        >
                            {activeHoleRound === "Ronda 1" ? "R1" : "R2"}
                        </span>
                    </div>
                </span>

                <div className="th-stats header-r1r2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="modal-tabs mini">
                        <button
                            className={`modal-tab-btn ${activeHoleRound === "Ronda 1" ? "active" : ""}`}
                            onClick={() => setActiveHoleRound("Ronda 1")}
                        >
                            R1
                        </button>
                        <button
                            className={`modal-tab-btn ${activeHoleRound === "Ronda 2" ? "active" : ""}`}
                            onClick={() => setActiveHoleRound("Ronda 2")}
                        >
                            R2
                        </button>
                    </div>
                </div>

                <span className="th-resultado">TOTAL</span>
            </div>

            {/*Listado de jugadores*/}
            <div className="table-body">
                {players.map((p, i) => {
                    const rData = activeHoleRound === "Ronda 1"
                        ? dbRonda1.find(d => d.Jugador === p.Jugador)
                        : dbRonda2.find(d => d.Jugador === p.Jugador);

                    return (
                        <PlayerRow
                            key={p.Jugador}
                            player={p}
                            rank={p._rank}
                            colorIndex={i}
                            onClick={() => setSelectedPlayer(p)}
                            hoyoActivo={rData?.HOYO || rData?.Hoyo || "-"}
                            activeHoleRound={activeHoleRound}
                            totalPlayers={players.length}
                        />
                    );
                })}
            </div>
        </div>
    );
}