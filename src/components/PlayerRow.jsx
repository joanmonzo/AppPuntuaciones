import React from 'react';
import { RankBadge, ResultadoBadge } from './UIComponents';
import { AVATAR_COLORS, TEAM_AVATAR_IMAGES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import maradonaGif from '../maradona.gif';

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
    ? `/${equipo.toLowerCase().replace(/\s+/g, "-")}.jpeg`
    : null;

  const isTop4 = rank <= 4;
  const isChallenger = rank === 5 || rank === 6;
  const isWorst4 = totalPlayers > 6 && rank > totalPlayers - 4;
  const highlightClass = isTop4
    ? "highlight-top"
    : isChallenger
      ? "highlight-middle"
      : isWorst4
        ? "highlight-bottom"
        : "";

  const avatarImageUrl = TEAM_AVATAR_IMAGES[equipo];

  const isMaradona = activeHoleRound === "Ronda 1" ? player._isMaradonaR1 : player._isMaradonaR2;
  const hasZero = isMaradona;

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
          <span className="player-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
              <span className="name-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player._CleanName || player.Jugador}
              </span>
              {player._onFire && <span className="on-fire-icon" title="¡En racha!">🔥</span>}
              {player._woodenSpoon && <span className="wooden-spoon-icon" style={{ marginLeft: '6px', display: 'inline-block' }} title="Cuchara de madera">🥄</span>}
            </span>
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

        <div className="maradona-col" style={{ width: '40px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          {(player._isMaradonaR1 || player._isMaradonaR2) && (
            <img
              src={maradonaGif}
              alt="Maradona"
              className="maradona-gif"
              style={{
                width: '35px',
                height: '22px',
                borderRadius: '2px',
                boxShadow: 'none'
              }}
            />
          )}
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