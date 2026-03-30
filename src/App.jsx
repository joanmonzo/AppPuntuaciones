import { useState, useEffect, useRef } from "react";
import "./App.css";
import fotoEquipos from "./foto_equipos.png";

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
  return <span className="resultado positivo">{valor} pts</span>;
}

function PlayerRow({ player, rank, colorIndex, prevRank, parRow, onClick, currentRound }) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const rankDelta = prevRank !== null && prevRank !== undefined ? prevRank - rank : 0;
  
  const resultado = player._stableResultado !== undefined && player._stableResultado !== "" ? player._stableResultado : player["RESULTADO ACTUAL"];
  const hoyo = player["HOYO"] || 18;

  const equipo = player["EQUIPO"]?.trim() || null;
  const logoUrl = equipo ? `/logos/${equipo.toLowerCase().replace(/\s+/g, '-')}.jpeg` : null;

  const arquetipoTitulo = player["FLL"]?.trim() || null;
  const arquetipoDesc = player.ARQUETIPO_DESC?.trim() || null;

  const isTop4 = rank <= 4;
  const isWorst4 = rank >= 8;
  const highlightClass = isTop4 ? "highlight-top" : isWorst4 ? "highlight-bottom" : "";

  const isGeneral = currentRound === "General";

  // AHORA SÍ: En General coge el TOTAL de la fila del Par (ej. 156, 164...). En Rondas coge el TOTAL del jugador.
  const totalGolpes = isGeneral 
    ? (parRow?.TOTAL !== undefined && parRow?.TOTAL !== "" ? parRow.TOTAL : "-")
    : (player.TOTAL !== undefined && player.TOTAL !== "" ? player.TOTAL : "-");

  const parTotal = isGeneral
    ? "-" 
    : (player.PAR_JUGADOR_TOTAL !== undefined && player.PAR_JUGADOR_TOTAL !== "" ? player.PAR_JUGADOR_TOTAL : (parRow?.TOTAL !== undefined && parRow?.TOTAL !== "" ? parRow.TOTAL : "-"));

  return (
    <div 
      className={`player-row ${highlightClass}`} 
      onClick={isGeneral ? null : onClick} 
      style={{ cursor: isGeneral ? "default" : "pointer" }}
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
          <span style={{ position: 'absolute', zIndex: 1 }}>{getInitials(player._CleanName || player.Jugador)}</span>
          <img 
            src="/the-golfos-on-tour-2026.jpeg" 
            alt="Logo Torneo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 }}
            onError={(e) => e.target.style.display = 'none'} 
          />
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
        {(arquetipoTitulo || arquetipoDesc) && (
          <div className="player-arquetipo">
            {arquetipoTitulo && <span className="arq-title">{arquetipoTitulo}</span>}
            {arquetipoDesc && <span className="arq-desc">{arquetipoDesc}</span>}
          </div>
        )}
      </div>

      <div className="row-stats">
        <div className="stat-block">
          <span className="stat-label">Total</span>
          <span className="stat-val">{totalGolpes}</span>
        </div>
        
        {!isGeneral && (
          <>
            <div className="stat-block">
              <span className="stat-label">Par</span>
              <span className="stat-val">{parTotal}</span>
            </div>
            <div className="stat-block">
              <span className="stat-label">Hoyo</span>
              <span className="stat-val">{hoyo}</span>
            </div>
          </>
        )}
      </div>

      <div className="row-resultado">
        <ResultadoBadge valor={resultado} />
      </div>
    </div>
  );
}

function PlayerModal({ player, onClose, parRow, onRefreshNeeded, currentRound }) {
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  const isGeneral = currentRound === "General";

  useEffect(() => {
    if (player) {
      const initial = {};
      holes.forEach(h => {
        initial[h] = {
          par: parRow && parRow[h] !== undefined ? parRow[h] : "",
          golpes: player[h] !== undefined ? player[h] : ""
        };
      });
      setEditedData(initial);
      setIsEditing(false);
    }
  }, [player, parRow]);

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
      enviarDatos({ jugador: player.Jugador, ronda: currentRound, golpes: nuevosGolpes }), 
      enviarDatos({ jugador: parRow ? parRow.Jugador : `PAR ${String(player.Jugador).toUpperCase()}`, ronda: currentRound, golpes: nuevosPares }) 
    ]);
    
    setIsEditing(false);
    setIsSaving(false);
    onClose(); 
    setTimeout(() => { if(onRefreshNeeded) onRefreshNeeded(); }, 2000);
  };

  // NUEVA FUNCIÓN: Resetea los golpes del jugador a vacío ("")
  const handleReset = async () => {
    const confirmReset = window.confirm(`⚠️ ¿Estás seguro de que quieres BORRAR todos los golpes de ${player._CleanName || player.Jugador} en la ${currentRound}?`);
    
    if (!confirmReset) return;

    setIsSaving(true); 

    let golpesVacios = {};
    holes.forEach(hole => {
      golpesVacios[hole] = ""; // Lo dejamos vacío como al empezar
    });

    const paqueteGolpes = {
        jugador: player.Jugador,
        ronda: currentRound,
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
    setTimeout(() => { if(onRefreshNeeded) onRefreshNeeded(); }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Estadísticas: {player._CleanName || player.Jugador}</h2>
          <div className="header-actions">
            {!isGeneral && (
              isEditing ? (
                <>
                  <button 
                    className="save-btn" 
                    onClick={handleSave} 
                    disabled={isSaving}
                    style={isSaving ? { backgroundColor: '#95a5a6', cursor: 'not-allowed' } : {}}
                  >
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                  </button>
                  <button className="cancel-btn" onClick={() => setIsEditing(false)} disabled={isSaving}>CANCELAR</button>
                </>
              ) : (
                <>
                  {/* NUEVO BOTÓN DE REINICIO */}
                  <button className="reset-btn" onClick={handleReset} disabled={isSaving} title="Reiniciar Partida">↺</button>
                  <button className="edit-btn" onClick={() => setIsEditing(true)} title="Editar">✎</button>
                </>
              )
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
  const [selectedTeam, setSelectedTeam] = useState(null); 
  const [currentRound, setCurrentRound] = useState("General"); 

  const prevHashRef = useRef(null);

  const procesarHoja = (raw) => {
    if (!raw || raw.error) return [];
    raw.forEach((row, index) => {
      if (isRealPlayer(row)) {
        row._CleanName = String(row.Jugador).replace(" RESULTADO REAL", "").trim();
        
        // NUEVA LÓGICA: Vincula el nombre exacto de su fila PAR asociada
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
            pGen["FLL"] = pBase["FLL"];
            pGen["ARQUETIPO_DESC"] = pBase["ARQUETIPO_DESC"];
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

  const activeData = currentRound === "Ronda 1" ? dbRonda1 : currentRound === "Ronda 2" ? dbRonda2 : dbGeneral;

  const players = activeData
    .filter(isRealPlayer)
    .sort((a, b) => (b._stableResultado || 0) - (a._stableResultado || 0));

  const leader = players[0];
  const equiposUnicos = [...new Set(players.map(p => p.EQUIPO).filter(e => e && e.trim() !== ""))];
  const isGeneral = currentRound === "General";

  return (
    <div className="app">
      <div className="bg-grid" />

      <header className="header">
        <div className="header-left">
          <h1 className="title">
            Clasificación <span style={{fontSize: "0.5em", color: "var(--gold)", verticalAlign: "middle"}}>{currentRound}</span>
            <span><img src={fotoEquipos} alt="foto equipos" style={{height: "100px", verticalAlign: "middle", marginLeft: "50px", borderRadius: "10px"}} /></span>
          </h1>
          <p className="subtitle">
            {players.length > 0 ? `${players.length} jugadores ${!isGeneral ? `· Hoyo ${leader?.HOYO ?? "18"}` : ''}` : "Cargando…"}
          </p>

          <div className="tabs-container">
            <button className={`tab-btn ${activeTab === "clasificacion" ? "active" : ""}`} onClick={() => { setActiveTab("clasificacion"); setSelectedTeam(null); }}>
              Individuales
            </button>
            <button className={`tab-btn ${activeTab === "equipos" ? "active" : ""}`} onClick={() => setActiveTab("equipos")}>
              Equipos
            </button>

            <div style={{ width: '2px', background: 'var(--border)', margin: '0 8px' }}></div>

            <button className={`tab-btn ${currentRound === "Ronda 1" ? "active" : ""}`} onClick={() => setCurrentRound("Ronda 1")}>Ronda 1</button>
            <button className={`tab-btn ${currentRound === "Ronda 2" ? "active" : ""}`} onClick={() => setCurrentRound("Ronda 2")}>Ronda 2</button>
            <button className={`tab-btn ${currentRound === "General" ? "active" : ""}`} onClick={() => setCurrentRound("General")}>General</button>
          </div>
        </div>
        
        <div className="header-right">
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
                <div className="table-header">
                  <span className="th-rank">#</span>
                  <span className="th-player">Jugador</span>
                  <span className="th-stats">{isGeneral ? "Total" : "Total · Par · Hoyo"}</span>
                  <span className="th-resultado">Stable Resultado</span>
                </div>
                <div className="table-body">
                  {players.map((player, i) => (
                    <PlayerRow
                      key={player.Jugador}
                      player={player}
                      rank={i + 1}
                      colorIndex={i}
                      // AHORA USA _parName PARA ENCONTRAR EL PAR DE ESE JUGADOR AUNQUE SE LLAMEN DIFERENTE
                      parRow={activeData.find((p) => p.Jugador === player._parName)}
                      onClick={() => setSelectedPlayer(player)} 
                      currentRound={currentRound} 
                    />
                  ))}
                </div>
              </>
            )}

            {activeTab === "equipos" && !selectedTeam && (
              <div className="equipos-grid">
                {equiposUnicos.length > 0 ? (
                  equiposUnicos.map(equipo => {
                    const jugadoresDelEquipo = players.filter(p => p.EQUIPO === equipo);
                    return (
                      <div key={equipo} className="equipo-card" onClick={() => setSelectedTeam(equipo)}>
                        <h3>{equipo}</h3>
                        <span>{jugadoresDelEquipo.length} jugadores asignados</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="loading">No hay equipos asignados.</div>
                )}
              </div>
            )}

            {activeTab === "equipos" && selectedTeam && (
              <div className="equipo-detalle">
                <div className="equipo-detalle-header">
                  <button className="back-btn" onClick={() => setSelectedTeam(null)}>← VOLVER</button>
                  <h2>Equipo: <span className="equipo-nombre-resaltado">{selectedTeam}</span></h2>
                </div>
                
                <div className="table-header">
                  <span className="th-rank">#</span>
                  <span className="th-player">Jugador</span>
                  <span className="th-stats">{isGeneral ? "Total" : "Total · Par · Hoyo"}</span>
                  <span className="th-resultado">Stable Resultado</span>
                </div>
                <div className="table-body">
                  {players.filter(p => p.EQUIPO === selectedTeam).map((player, i) => (
                    <PlayerRow
                      key={player.Jugador}
                      player={player}
                      rank={i + 1}
                      colorIndex={i}
                      parRow={activeData.find((p) => p.Jugador === player._parName)}
                      onClick={() => setSelectedPlayer(player)} 
                      currentRound={currentRound}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <PlayerModal 
        player={selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
        parRow={selectedPlayer ? activeData.find(p => p.Jugador === selectedPlayer._parName) : null}
        onRefreshNeeded={fetchData} 
        currentRound={currentRound}
      />

      <footer className="footer">
        <span>Actualización automática cada {POLL_INTERVAL / 1000}s</span>
      </footer>
    </div>
  );
}