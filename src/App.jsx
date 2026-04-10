import { useState, useEffect, useRef } from "react";
import "./App.css";

import fotoEquipos from "./the-golfos-on-tour-2026.jpeg";
import imgFlyingCarajillos from "./flying-carajillos.png";
import imgCarabassaSlice from "./carabassa-slice.jpeg";

const API_URL =
  "https://script.google.com/macros/s/AKfycbx0hO-6xi53Siyr86zYkBPSVF2hKaYEgRw0Y-IjvjS5I1EOpegSj498XHQZr0xEqhXcfA/exec";

const POLL_INTERVAL = 5000;

const AVATAR_COLORS = [
  { bg: "#1a1500", text: "#e0c97f" },
  { bg: "#0f2d40", text: "#5bc4d8" },
  { bg: "#2d1a0f", text: "#e09b5b" },
  { bg: "#0f2d1a", text: "#5be07a" },
  { bg: "#1a0f2d", text: "#a05be0" },
  { bg: "#2d0f0f", text: "#e05b5b" },
  { bg: "#2d2d0f", text: "#d4e05b" },
  { bg: "#0f1a2d", text: "#5b8fe0" },
  { bg: "#2d0f1a", text: "#e05bab" },
  { bg: "#0f2d2d", text: "#5be0c4" },
  { bg: "#1a2d0f", text: "#8fe05b" },
];

const TEAM_AVATAR_IMAGES = {
  "FLYING CARAJILLOS": imgFlyingCarajillos,
  "CARABASSA SLICE FOCKERS": imgCarabassaSlice
};

function getInitials(name) {
  if (!name) return "?";
  return String(name).split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getRoundKeys(player) {
  if (!player) return [];
  return Object.keys(player)
    .filter((k) => !isNaN(Number(k)))
    .map(Number)
    .sort((a, b) => a - b);
}

function isRealPlayer(p) {
  return (
    p.Jugador &&
    !String(p.Jugador).startsWith("PAR ") &&
    p.Jugador !== "PAR CAMPO" &&
    p.Jugador !== "HCP HOYO" &&
    p.Jugador !== "STABLE" &&
    p.Jugador !== "STABLE RESULTADO" &&
    (typeof p["RESULTADO ACTUAL"] === "number" || p["RESULTADO ACTUAL"] === "")
  );
}

function RankBadge({ rank }) {
  let medalClass = "standard";
  if (rank === 1) medalClass = "gold";
  if (rank === 2) medalClass = "silver";
  if (rank === 3) medalClass = "bronze";

  return <span className={`golf-ball-badge ${medalClass}`}>{rank}</span>;
}

function ResultadoBadge({ valor }) {
  const numValor = Number(valor);
  let claseTipo = "neutro";

  if (!isNaN(numValor) && valor !== "") {
    if (numValor >= 36) {
      claseTipo = "positivo";
    } else if (numValor <= 35) {
      claseTipo = "negativo";
    }
  }

  return <span className={`resultado ${claseTipo}`}>{valor}</span>;
}

function PlayerRow({ player, rank, colorIndex, prevRank, parRow, onClick, currentRound }) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const rankDelta = prevRank !== null && prevRank !== undefined ? prevRank - rank : 0;

  const resultado = player._stableResultado !== undefined && player._stableResultado !== "" ? player._stableResultado : player["RESULTADO ACTUAL"];
  const hoyo = player["HOYO"] || 18;

  const equipo = player["EQUIPO"]?.trim() || "";
  const logoUrl = equipo ? `/logos/${equipo.toLowerCase().replace(/\s+/g, '-')}.jpeg` : null;

  const isTop4 = rank <= 4;
  const isWorst4 = rank >= 8;
  const highlightClass = isTop4 ? "highlight-top" : isWorst4 ? "highlight-bottom" : "";

  const isGeneral = currentRound === "General";

  const totalGolpes = isGeneral
    ? (parRow?.TOTAL !== undefined && parRow?.TOTAL !== "" ? parRow.TOTAL : "-")
    : (player.TOTAL !== undefined && player.TOTAL !== "" ? player.TOTAL : "-");

  const parTotal = isGeneral
    ? "-"
    : (player.PAR_JUGADOR_TOTAL !== undefined && player.PAR_JUGADOR_TOTAL !== "" ? player.PAR_JUGADOR_TOTAL : (parRow?.TOTAL !== undefined && parRow?.TOTAL !== "" ? parRow.TOTAL : "-"));

  const avatarImageUrl = TEAM_AVATAR_IMAGES[equipo];

  return (
    <div
      className={`player-row ${highlightClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="row-rank">
        <RankBadge rank={rank} />
        {rankDelta !== 0 && (
          <span className={`rank-delta ${rankDelta > 0 ? "up" : "down"}`}>
            {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
          </span>
        )}
      </div>

      <div className="row-player">
        <div className="avatar" style={{ background: color.bg, color: color.text, position: 'relative', overflow: 'hidden' }}>
          {/* INICIALES SIEMPRE DE FONDO */}
          <span style={{ position: 'absolute', zIndex: 1 }}>{getInitials(player._CleanName || player.Jugador)}</span>

          {/* IMAGEN POR ENCIMA SÓLO SI ESTÁ ASIGNADA AL EQUIPO */}
          {avatarImageUrl && (
            <img
              src={avatarImageUrl}
              alt={`Logo ${equipo}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 }}
            />
          )}
        </div>

        <div className="player-info">
          <span className="player-name">{player._CleanName || player.Jugador}</span>
          {equipo && (
            <div className="player-team">
              <img src={logoUrl} alt={equipo} className="team-logo" onError={(e) => e.target.style.display = 'none'} />
              <span className="team-name">{equipo}</span>
            </div>
          )}
        </div>
      </div>

      <div className="row-stats">
        <div className="stat-block">
          <span className="stat-val">{player._cleanR1}</span>
        </div>
        <div className="stat-block">
          <span className="stat-val">{player._cleanR2}</span>
        </div>
      </div>

      <div className="row-resultado">
        <ResultadoBadge valor={player._totalScore} />
      </div>
    </div>
  );
}

function PlayerModal({ player, onClose, onRefreshNeeded, dbRonda1, dbRonda2 }) {
  const [modalRound, setModalRound] = useState("Ronda 1");
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  // Determinar los datos de la ronda actual dentro del modal
  const activeDb = modalRound === "Ronda 1" ? dbRonda1 : dbRonda2;
  const roundPlayerData = player ? activeDb.find(p => p.Jugador === player.Jugador) : null;
  const parRow = roundPlayerData ? activeDb.find(p => p.Jugador === roundPlayerData._parName) : null;

  useEffect(() => {
    if (player) {
      const initial = {};
      holes.forEach(h => {
        initial[h] = {
          par: parRow && parRow[h] !== undefined ? parRow[h] : "",
          golpes: roundPlayerData && roundPlayerData[h] !== undefined ? roundPlayerData[h] : ""
        };
      });
      setEditedData(initial);
      setIsEditing(false);
    }
  }, [player, modalRound, parRow, roundPlayerData]);

  if (!player) return null;

  const handleInputChange = (hole, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [hole]: { ...prev[hole], [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    let nuevosGolpes = {};
    let nuevosPares = {};

    Object.keys(editedData).forEach(hole => {
      nuevosGolpes[hole] = editedData[hole].golpes;
      nuevosPares[hole] = editedData[hole].par;
    });

    const enviarDatos = async (paquete) => {
      try {
        await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(paquete),
          headers: { "Content-Type": "text/plain" }
        });
      } catch (error) {
        console.log(`Error al guardar en Sheets`, error);
      }
    };

    await Promise.all([
      enviarDatos({ jugador: player.Jugador, ronda: modalRound, golpes: nuevosGolpes }),
      enviarDatos({ jugador: parRow ? parRow.Jugador : `PAR ${String(player.Jugador).toUpperCase()}`, ronda: modalRound, golpes: nuevosPares })
    ]);

    setIsEditing(false);
    setIsSaving(false);
    onClose();
    setTimeout(() => { if (onRefreshNeeded) onRefreshNeeded(); }, 2000);
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(`⚠️ ¿Estás seguro de que quieres BORRAR todos los golpes de ${player._CleanName || player.Jugador} en la ${modalRound}?`);

    if (!confirmReset) return;

    setIsSaving(true);

    let golpesVacios = {};
    holes.forEach(hole => {
      golpesVacios[hole] = "";
    });

    const paqueteGolpes = {
      jugador: player.Jugador,
      ronda: modalRound,
      golpes: golpesVacios
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(paqueteGolpes),
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.log(`Error al resetear en Sheets`, error);
    }

    setIsEditing(false);
    setIsSaving(false);
    onClose();
    setTimeout(() => { if (onRefreshNeeded) onRefreshNeeded(); }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <h2>{player._CleanName || player.Jugador}</h2>
            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${modalRound === "Ronda 1" ? "active" : ""}`} 
                onClick={() => { setModalRound("Ronda 1"); setIsEditing(false); }}
              >R1</button>
              <button 
                className={`modal-tab-btn ${modalRound === "Ronda 2" ? "active" : ""}`} 
                onClick={() => { setModalRound("Ronda 2"); setIsEditing(false); }}
              >R2</button>
            </div>
          </div>
          <div className="header-actions">
            {isEditing ? (
              <>
                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={isSaving ? { backgroundColor: '#95a5a6', cursor: 'not-allowed' } : {}}
                >
                  {isSaving ? '...' : 'GUARDAR'}
                </button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)} disabled={isSaving}>CAN</button>
              </>
            ) : (
              <>
                <button className="reset-btn" onClick={handleReset} disabled={isSaving} title="Reiniciar Partida">↺</button>
                <button className="edit-btn" onClick={() => setIsEditing(true)} title="Editar">✎</button>
              </>
            )}
            <button className="close-btn" onClick={onClose} disabled={isSaving}>&times;</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="stats-grid">
            <div className="stats-row header">
              <span>Hoyo</span>
              <span>Par</span>
              <span>Golpes</span>
            </div>
            {holes.map((h) => {
              const currentEditedHole = editedData[h] || { par: "", golpes: "" };
              const golpesNum = Number(currentEditedHole.golpes);
              const parNum = Number(currentEditedHole.par);

              let scoreClass = "score-par";
              if (!isNaN(parNum) && !isNaN(golpesNum) && currentEditedHole.golpes !== "" && currentEditedHole.par !== "") {
                if (golpesNum < parNum) scoreClass = "score-under";
                else if (golpesNum > parNum) scoreClass = "score-over";
              }

              return (
                <div className="stats-row" key={h}>
                  <span>{h}</span>
                  {isEditing ? (
                    <input type="number" className="edit-input" value={currentEditedHole.par} onChange={(e) => handleInputChange(h, 'par', e.target.value)} disabled={isSaving} />
                  ) : (
                    <span>{currentEditedHole.par || "-"}</span>
                  )}
                  {isEditing ? (
                    <input type="number" className={`edit-input ${scoreClass}`} value={currentEditedHole.golpes} onChange={(e) => handleInputChange(h, 'golpes', e.target.value)} disabled={isSaving} />
                  ) : (
                    <span className={scoreClass}>{currentEditedHole.golpes === "" ? "-" : currentEditedHole.golpes}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [dbRonda1, setDbRonda1] = useState([]);
  const [dbRonda2, setDbRonda2] = useState([]);
  const [dbGeneral, setDbGeneral] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pulse, setPulse] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("clasificacion");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [accordionRound, setAccordionRound] = useState("R1");
  const [currentRound, setCurrentRound] = useState("General");

  // NUEVA LÓGICA DE TEMA (MODO CLARO/OSCURO)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const prevHashRef = useRef(null);

  const procesarHoja = (raw) => {
    if (!raw || raw.error) return [];
    raw.forEach((row, index) => {
      if (isRealPlayer(row)) {
        row._CleanName = String(row.Jugador).replace(" RESULTADO REAL", "").trim();

        const parRow = raw[index + 1];
        if (parRow && String(parRow.Jugador).startsWith("PAR ")) {
          row._parName = parRow.Jugador;
        }

        const stableRow = raw[index + 3];
        if (stableRow && stableRow.Jugador === "STABLE RESULTADO") {
          row._stableResultado = stableRow["RESULTADO ACTUAL"];
        } else {
          row._stableResultado = row["RESULTADO ACTUAL"];
        }
      }
    });
    return raw;
  };

  async function fetchData() {
    try {
      const t = new Date().getTime();

      const [res1, res2, resGen] = await Promise.all([
        fetch(`${API_URL}?ronda=Ronda 1&t=${t}`),
        fetch(`${API_URL}?ronda=Ronda 2&t=${t}`),
        fetch(`${API_URL}?ronda=General&t=${t}`)
      ]);

      if (!res1.ok || !res2.ok || !resGen.ok) throw new Error(`HTTP Error`);

      const raw1 = await res1.json();
      const raw2 = await res2.json();
      const rawGen = await resGen.json();

      const processedR1 = procesarHoja(raw1);
      const processedR2 = procesarHoja(raw2);
      const processedGen = procesarHoja(rawGen);

      const hash = JSON.stringify({ r1: raw1, r2: raw2, rg: rawGen });
      if (hash === prevHashRef.current) return;
      prevHashRef.current = hash;

      processedGen.forEach(pGen => {
        if (isRealPlayer(pGen)) {
          const pBase = processedR1.find(p => p.Jugador === pGen.Jugador) ||
            processedR2.find(p => p.Jugador === pGen.Jugador);
          if (pBase) {
            pGen["EQUIPO"] = pBase["EQUIPO"];
          }
        }
      });

      setDbRonda1(processedR1);
      setDbRonda2(processedR2);
      setDbGeneral(processedGen);

      setLastUpdate(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Crear lista unificada de jugadores con puntos de ambas rondas
  const playerMap = new Map();

  // Procesar Ronda 1
  dbRonda1.filter(isRealPlayer).forEach(p => {
    playerMap.set(p.Jugador, {
      ...p,
      _r1Data: p,
      _cleanR1: Number(p._stableResultado) || 0,
      _cleanR2: 0,
      _totalScore: Number(p._stableResultado) || 0
    });
  });

  // Procesar Ronda 2
  dbRonda2.filter(isRealPlayer).forEach(p => {
    if (playerMap.has(p.Jugador)) {
      const existing = playerMap.get(p.Jugador);
      existing._r2Data = p;
      existing._cleanR2 = Number(p._stableResultado) || 0;
      existing._totalScore = existing._cleanR1 + existing._cleanR2;
    } else {
      playerMap.set(p.Jugador, {
        ...p,
        _r2Data: p,
        _cleanR1: 0,
        _cleanR2: Number(p._stableResultado) || 0,
        _totalScore: Number(p._stableResultado) || 0
      });
    }
  });

  const sortedPlayers = Array.from(playerMap.values())
    .sort((a, b) => b._totalScore - a._totalScore);

  let currentRank = 0;
  let lastScore = null;
  const players = sortedPlayers.map((p, i) => {
    const score = p._totalScore;
    if (score !== lastScore) {
      currentRank = i + 1;
    }
    lastScore = score;
    return { ...p, _rank: currentRank };
  });

  const leader = players[0];

  // Obtener equipos únicos, sumar puntos por ronda y ordenar
  const equiposUnicos = [...new Set(players.map(p => p.EQUIPO).filter(e => e && e.trim() !== ""))];
  const rawEquiposData = equiposUnicos.map(equipo => {
    const jugadores = players.filter(p => p.EQUIPO === equipo);
    const teamR1 = jugadores.reduce((sum, p) => sum + (p._cleanR1 || 0), 0);
    const teamR2 = jugadores.reduce((sum, p) => sum + (p._cleanR2 || 0), 0);
    const totalPuntos = teamR1 + teamR2;
    return { equipo, jugadores, teamR1, teamR2, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  let currentEqRank = 0;
  let lastEqScore = null;
  const equiposData = rawEquiposData.map((eq, i) => {
    if (eq.totalPuntos !== lastEqScore) {
      currentEqRank = i + 1;
    }
    lastEqScore = eq.totalPuntos;
    return { ...eq, _rank: currentEqRank };
  });

  // Variable para identificar al equipo (o equipos empatados) con más puntos
  const maxPuntosEquipos = equiposData.length > 0 ? equiposData[0].totalPuntos : 0;

  const isGeneral = currentRound === "General";

  return (
    <div className="app">
      <div className="bg-grid" />

      <header className="header">
        <div className="header-left">
          <h1 className="title">
            Clasificación <span style={{ fontSize: "0.5em", color: "var(--gold)", verticalAlign: "middle" }}>{currentRound}</span>
            <span><img src={fotoEquipos} alt="foto equipos" style={{ height: "100px", verticalAlign: "middle", marginLeft: "50px", borderRadius: "10px" }} /></span>
          </h1>
          <p className="subtitle">
            {players.length > 0 ? `${players.length} jugadores ${!isGeneral ? `· Hoyo ${leader?.HOYO ?? "18"}` : ''}` : "Cargando…"}
          </p>

          <div className="tabs-groups" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div className="tabs-container" style={{ marginTop: 0 }}>
              <button className={`tab-btn ${activeTab === "clasificacion" ? "active" : ""}`} onClick={() => { setActiveTab("clasificacion"); setSelectedTeam(null); }}>
                Individuales
              </button>
              <button className={`tab-btn ${activeTab === "equipos" ? "active equipos" : ""}`} onClick={() => setActiveTab("equipos")}>
                Equipos
              </button>
            </div>

            {/* Las pestañas de rondas se han eliminado ya que las tablas muestran vista unificada */}
          </div>
        </div>

        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className={`status-dot ${error ? "error" : "ok"} ${pulse ? "pulse" : ""}`} />
          <span className="status-text">
            {error ? "Sin conexión" : lastUpdate ? lastUpdate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Conectando…"}
          </span>
        </div>
      </header>

      <main className="main">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Cargando datos…</span>
          </div>
        ) : error ? (
          <div className="error-box">
            <span className="error-icon">!</span>
            <div>
              <p className="error-title">Error al cargar</p>
              <p className="error-msg">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "clasificacion" && (
              <>
                <div className="table-header header-individual">
                  <span className="th-rank">#</span>
                  <span className="th-player">Jugador</span>
                  <div className="th-stats header-r1r2">
                    <span>R1</span>
                    <span>R2</span>
                  </div>
                  <span className="th-resultado">TOTAL</span>
                </div>
                <div className="table-body">
                  {players.map((player, i) => (
                    <PlayerRow
                      key={player.Jugador}
                      player={player}
                      rank={player._rank}
                      colorIndex={i}
                      parRow={dbRonda1.find((p) => p.Jugador === player._parName) || dbRonda2.find((p) => p.Jugador === player._parName)}
                      onClick={() => setSelectedPlayer(player)}
                      currentRound={currentRound}
                    />
                  ))}
                </div>
              </>
            )}

            {activeTab === "equipos" && (
              <div className="equipos-lista">
                <div className="table-header header-equipos">
                  <span className="th-rank">Pos</span>
                  <span className="th-team">Equipo</span>
                  <span className="th-players-list hide-mobile">Jugadores</span>
                  <span className="th-r1">R1</span>
                  <span className="th-r2">R2</span>
                  <span className="th-tot">Tot</span>
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
                          className={`team-accordion-wrapper ${isExpanded ? 'expanded' : ''}`}
                        >
                          <div
                            className={`equipo-row ${isLeader ? 'leader' : ''} ${isExpanded ? 'active' : ''}`}
                            onClick={() => setExpandedTeam(prev => prev === eq.equipo ? null : eq.equipo)}
                          >
                            <div className="row-rank">
                              <RankBadge rank={eq._rank} />
                            </div>
                            <div className="row-team">
                              <div className="team-avatar-mini">
                                {logoUrl ? <img src={logoUrl} alt={eq.equipo} /> : <span>{getInitials(eq.equipo)}</span>}
                              </div>
                              <span className="team-name-row">{eq.equipo}</span>
                              <span className="accordion-arrow">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                            <div className="row-players-list hide-mobile">
                              {eq.jugadores.map((p, idx) => (
                                <span key={idx} className="player-mini-tag">
                                  {p._CleanName || p.Jugador}
                                </span>
                              ))}
                            </div>
                            <div className="row-scores">
                              <span className="score-val">{eq.teamR1}</span>
                              <span className="score-val">{eq.teamR2}</span>
                              <div className="score-tot">
                                <ResultadoBadge valor={eq.totalPuntos} />
                              </div>
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
                                  >R1</button>
                                  <button 
                                    className={`modal-tab-btn ${accordionRound === "R2" ? "active" : ""}`} 
                                    onClick={() => setAccordionRound("R2")}
                                  >R2</button>
                                </div>
                              </div>
                              
                              <div className="table-responsive">
                                <div className="hole-grid">
                                  {/* Cabecera Hoyos */}
                                  <div className="hole-row header">
                                    <span className="hole-label">Hoyo</span>
                                    {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                                      <span key={h} className="hole-num">{h}</span>
                                    ))}
                                    <span className="hole-total">Tot</span>
                                  </div>

                                  {/* Fila PAR */}
                                  <div className="hole-row par">
                                    <span className="hole-label">Par</span>
                                    {(() => {
                                      const anyPlayer = eq.jugadores[0];
                                      const parRow = dbRonda1.find(p => p.Jugador === anyPlayer?._parName) || dbRonda2.find(p => p.Jugador === anyPlayer?._parName);
                                      let parSum = 0;
                                      return (
                                        <>
                                          {Array.from({ length: 18 }, (_, i) => i + 1).map(h => {
                                            const pVal = Number(parRow?.[h]) || 0;
                                            parSum += pVal;
                                            return <span key={h}>{pVal || "-"}</span>;
                                          })}
                                          <span className="hole-total">{parSum}</span>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* Filas Jugadores */}
                                  {eq.jugadores.map(player => {
                                    // Usar los datos de la ronda seleccionada en el acordeón
                                    const source = accordionRound === "R1" ? player._r1Data : player._r2Data;
                                    const parRow = dbRonda1.find(p => p.Jugador === player?._parName) || dbRonda2.find(p => p.Jugador === player?._parName);
                                    let totalStrokes = 0;

                                    if (!source) {
                                      return (
                                        <div className="hole-row player" key={player.Jugador}>
                                          <span className="hole-label">{player._CleanName || player.Jugador}</span>
                                          <span style={{ gridColumn: 'span 19', color: 'var(--text2)', fontStyle: 'italic', fontSize: '11px' }}>Sin datos en esta ronda</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="hole-row player" key={player.Jugador}>
                                        <span className="hole-label">{player._CleanName || player.Jugador}</span>
                                        {Array.from({ length: 18 }, (_, i) => i + 1).map(h => {
                                          const strokesRaw = source[h];
                                          const strokes = Number(strokesRaw);
                                          const par = Number(parRow?.[h]);
                                          totalStrokes += strokes || 0;
                                          
                                          let scoreClass = "";
                                          if (strokesRaw !== "" && strokes && par) {
                                            if (strokes < par) scoreClass = "score-under";
                                            else if (strokes > par) scoreClass = "score-over";
                                            else scoreClass = "score-par";
                                          }

                                          return <span key={h} className={scoreClass}>{strokesRaw || "-"}</span>;
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
              </div>
            )}
          </>
        )}
      </main>

      <PlayerModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onRefreshNeeded={fetchData}
        dbRonda1={dbRonda1}
        dbRonda2={dbRonda2}
      />

      <footer className="footer">
        <span>Actualización automática cada {POLL_INTERVAL / 1000}s</span>
      </footer>
    </div>
  );
}