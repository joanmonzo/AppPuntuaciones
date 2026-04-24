import React from 'react';
import PlayerRow from './PlayerRow';

export default function IndividualStandings({
    players,
    activeHoleRound,
    dbRonda1,
    dbRonda2,
    setSelectedPlayer
}) {
    return (
        <div className="clasificacion-tab slide-up">
            <div className="table-header header-individual">
                <span className="th-rank">#</span>
                <span className="th-player">Jugador</span>
                <span className="th-hoyo">Hoyo</span>
                <div className="th-stats header-r1r2">
                    <span className={activeHoleRound === "Ronda 1" ? "active-th" : ""}>R1</span>
                    <span className={activeHoleRound === "Ronda 2" ? "active-th" : ""}>R2</span>
                </div>
                <span className="th-resultado">TOTAL</span>
            </div>

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