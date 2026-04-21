import React from 'react';
import { RankBadge, ResultadoBadge } from './UIComponents';
import { AVATAR_COLORS, TEAM_AVATAR_IMAGES } from '../utils/constants';
import { getInitials } from '../utils/helpers';

export default function PlayerRow({
  player,
  rank,
  colorIndex,
  onClick,
  hoyoActivo,
  activeHoleRound,
  totalPlayers,
}) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  const equipo = player["EQUIPO"]?.trim() || "";
  const logoUrl = equipo
    ? `/logos/${equipo.toLowerCase().replace(/\s+/g, "-")}.jpeg`
    : null;

  const isTop4 = rank <= 4;
  const isWorst4 = totalPlayers > 4 && rank > totalPlayers - 4;
  const highlightClass = isTop4
    ? "highlight-top"
    : isWorst4
      ? "highlight-bottom"
      : "";

  const avatarImageUrl = TEAM_AVATAR_IMAGES[equipo];

  return (
    <div
      className={`player-row ${highlightClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="row-rank">
        <RankBadge rank={rank} />
      </div>

      <div className="row-player">
        <div
          className="avatar"
          style={{
            background: color.bg,
            color: color.text,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span style={{ position: "absolute", zIndex: 1 }}>
            {getInitials(player._CleanName || player.Jugador)}
          </span>
          {avatarImageUrl && (
            <img
              src={avatarImageUrl}
              alt={`Logo ${equipo}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                zIndex: 2,
              }}
            />
          )}
        </div>

        <div className="player-info">
          <span className="player-name">
            {player._CleanName || player.Jugador}
            {player._onFire && <span className="on-fire-icon" title="¡En racha (últimos 2 hoyos bajo el par)!">🔥</span>}
          </span>
          {equipo && (
            <div className="player-team">
              <img
                src={logoUrl}
                alt={equipo}
                className="team-logo"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="team-name">{equipo}</span>
            </div>
          )}
        </div>
      </div>

      <div className="row-hoyo">
        <span className="stat-val">{hoyoActivo}</span>
      </div>

      <div className="row-stats">
        <div
          className={`stat-block ${activeHoleRound === "Ronda 1" ? "active-col" : "dim-col"}`}
        >
          <span className="stat-val">{player._cleanR1}</span>
        </div>
        <div
          className={`stat-block ${activeHoleRound === "Ronda 2" ? "active-col" : "dim-col"}`}
        >
          <span className="stat-val">{player._cleanR2}</span>
        </div>
      </div>

      <div className="row-resultado">
        <ResultadoBadge valor={player._totalScore} />
      </div>
    </div>
  );
}
