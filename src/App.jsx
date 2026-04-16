import { useState, useEffect, useRef } from "react";
import "./App.css";

import fotoEquipos from "./the-golfos-on-tour-2026.jpeg";
import imgFlyingCarajillos from "./flying-carajillos.png";
import imgCarabassaSlice from "./carabassa-slice.jpeg";

const API_URL =
  "https://script.google.com/macros/s/AKfycbx0hO-6xi53Siyr86zYkBPSVF2hKaYEgRw0Y-IjvjS5I1EOpegSj498XHQZr0xEqhXcfA/exec";

const POLL_INTERVAL = 5000;

const TEAM_CAPTAINS = {
  "FLYING CARAJILLOS": "Paco",
  "CARABASSA SLICE FOCKERS": "Quique",
  "CARABASSA SLICE": "Quique",
};

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
  "CARABASSA SLICE FOCKERS": imgCarabassaSlice,
};

function getInitials(name) {
  if (!name) return "?";
  return String(name)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

function PlayerRow({
  player,
  rank,
  colorIndex,
  prevRank,
  parRow,
  onClick,
  currentRound,
  hoyoActivo,
  activeHoleRound,
}) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const rankDelta =
    prevRank !== null && prevRank !== undefined ? prevRank - rank : 0;

  const hoyo = player["HOYO"] || 18;

  const equipo = player["EQUIPO"]?.trim() || "";
  const logoUrl = equipo
    ? `/logos/${equipo.toLowerCase().replace(/\s+/g, "-")}.jpeg`
    : null;

  const isTop4 = rank <= 4;
  const isWorst4 = rank >= 8;
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
        {rankDelta !== 0 && (
          <span className={`rank-delta ${rankDelta > 0 ? "up" : "down"}`}>
            {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
          </span>
        )}
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

function PlayerModal({
  player,
  onClose,
  onRefreshNeeded,
  dbRonda1,
  dbRonda2,
  selectedHoleInfo,
  setSelectedHoleInfo,
}) {
  const [modalRound, setModalRound] = useState("Ronda 1");
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  const activeDb = modalRound === "Ronda 1" ? dbRonda1 : dbRonda2;
  const roundPlayerData = player
    ? activeDb.find((p) => p.Jugador === player.Jugador)
    : null;
  const parRow = roundPlayerData
    ? activeDb.find((p) => p.Jugador === roundPlayerData._parName)
    : null;

  const hcpRow = activeDb.find((p) => p.Jugador === "HCP HOYO");

  useEffect(() => {
    if (player) {
      const initial = {};
      holes.forEach((h) => {
        initial[h] = {
          par: parRow && parRow[h] !== undefined ? parRow[h] : "",
          golpes:
            roundPlayerData && roundPlayerData[h] !== undefined
              ? roundPlayerData[h]
              : "",
        };
      });
      setEditedData(initial);
      setIsEditing(false);
    }
  }, [player, modalRound, parRow, roundPlayerData]);

  if (!player) return null;

  const handleInputChange = (hole, field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [hole]: { ...prev[hole], [field]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    let nuevosGolpes = {};
    let nuevosPares = {};

    Object.keys(editedData).forEach((hole) => {
      nuevosGolpes[hole] = editedData[hole].golpes;
      nuevosPares[hole] = editedData[hole].par;
    });

    const enviarDatos = async (paquete) => {
      try {
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(paquete),
          headers: { "Content-Type": "text/plain" },
        });
      } catch (error) {
        console.log(`Error al guardar en Sheets`, error);
      }
    };

    await Promise.all([
      enviarDatos({
        jugador: player.Jugador,
        ronda: modalRound,
        golpes: nuevosGolpes,
      }),
      enviarDatos({
        jugador: parRow
          ? parRow.Jugador
          : `PAR ${String(player.Jugador).toUpperCase()}`,
        ronda: modalRound,
        golpes: nuevosPares,
      }),
    ]);

    setIsEditing(false);
    setIsSaving(false);
    onClose();
    setTimeout(() => {
      if (onRefreshNeeded) onRefreshNeeded();
    }, 2000);
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      `⚠️ ¿Estás seguro de que quieres BORRAR todos los golpes de ${player._CleanName || player.Jugador} en la ${modalRound}?`,
    );
    if (!confirmReset) return;

    setIsSaving(true);
    let golpesVacios = {};
    holes.forEach((hole) => {
      golpesVacios[hole] = "";
    });

    const paqueteGolpes = {
      jugador: player.Jugador,
      ronda: modalRound,
      golpes: golpesVacios,
    };

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(paqueteGolpes),
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      console.log(`Error al resetear en Sheets`, error);
    }

    setIsEditing(false);
    setIsSaving(false);
    onClose();
    setTimeout(() => {
      if (onRefreshNeeded) onRefreshNeeded();
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} disabled={isSaving}>
          &times;
        </button>

        <div className="modal-header">
          <div className="modal-title-area">
            <h2 style={{ color: "var(--gold)", fontSize: "24px", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
              {player.ARQUETIPO || player.fll || player.FLL || "SIN ARQUETIPO"}
            </h2>

            <span style={{ color: "var(--text2)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", marginTop: "4px", display: "block" }}>
              {player._CleanName || player.Jugador}
            </span>

            <div className="modal-tabs" style={{ marginTop: "12px" }}>
              <button
                className={`modal-tab-btn ${modalRound === "Ronda 1" ? "active" : ""}`}
                onClick={() => {
                  setModalRound("Ronda 1");
                  setIsEditing(false);
                }}
              >
                R1
              </button>
              <button
                className={`modal-tab-btn ${modalRound === "Ronda 2" ? "active" : ""}`}
                onClick={() => {
                  setModalRound("Ronda 2");
                  setIsEditing(false);
                }}
              >
                R2
              </button>
            </div>
          </div>

          <div className="header-actions">
            {isEditing ? (
              <>
                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={
                    isSaving
                      ? { backgroundColor: "#95a5a6", cursor: "not-allowed" }
                      : {}
                  }
                >
                  {isSaving ? "..." : "GUARDAR"}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  CAN
                </button>
              </>
            ) : (
              <>
                <button
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={isSaving}
                  title="Reiniciar Partida"
                >
                  ↺
                </button>
                <button
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                  title="Editar"
                >
                  ✎
                </button>
              </>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div className="stats-grid">
            <div
              className="stats-row header"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              <span>Hoyo</span>
              <span>PAR Hoyo</span>
              <span>PAR Jug.</span>
              <span>Golpes</span>
            </div>
            {holes.map((h) => {
              const currentEditedHole = editedData[h] || {
                par: "",
                golpes: "",
              };
              const golpesNum = Number(currentEditedHole.golpes);
              const parNum = Number(currentEditedHole.par);

              const hcpHoyoVal =
                hcpRow && hcpRow[h] !== undefined && hcpRow[h] !== ""
                  ? hcpRow[h]
                  : "-";

              let scoreClass = "score-par";
              if (
                !isNaN(parNum) &&
                !isNaN(golpesNum) &&
                currentEditedHole.golpes !== "" &&
                currentEditedHole.par !== ""
              ) {
                if (golpesNum < parNum) scoreClass = "score-under";
                else if (golpesNum > parNum) scoreClass = "score-over";
              }

              return (
                <div
                  className="stats-row"
                  key={h}
                  style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                >
                  <div className="hole-cell">
                    <button
                      type="button"
                      className="hole-btn-trigger"
                      onClick={() => setSelectedHoleInfo(h)}
                      title={`Ver info hoyo ${h}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        backgroundColor: "var(--bg3)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "var(--text)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {h} <span className="hole-indicator-icon">🗺️</span>
                    </button>
                  </div>

                  <span>{hcpHoyoVal}</span>

                  {isEditing ? (
                    <input
                      type="number"
                      className="edit-input"
                      value={currentEditedHole.par}
                      onChange={(e) =>
                        handleInputChange(h, "par", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <span>{currentEditedHole.par || "-"}</span>
                  )}

                  {isEditing ? (
                    <input
                      type="number"
                      className={`edit-input ${scoreClass}`}
                      value={currentEditedHole.golpes}
                      onChange={(e) =>
                        handleInputChange(h, "golpes", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <span className={scoreClass}>
                      {currentEditedHole.golpes === ""
                        ? "-"
                        : currentEditedHole.golpes}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {selectedHoleInfo && (
            <div
              className="hole-preview-overlay"
              onClick={() => setSelectedHoleInfo(null)}
            >
              <div
                className="hole-preview-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-preview"
                  onClick={() => setSelectedHoleInfo(null)}
                >
                  ×
                </button>
                <h3>Información Hoyo {selectedHoleInfo}</h3>
                <img
                  src={`/images/hoyos/hoyo-${selectedHoleInfo}.jpg`}
                  alt={`Hoyo ${selectedHoleInfo}`}
                  className="hole-map-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Imagen+No+Disponible";
                  }}
                />
              </div>
            </div>
          )}
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
  const [selectedHoleInfo, setSelectedHoleInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("clasificacion");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [accordionRound, setAccordionRound] = useState("R1");
  const [activeHoleRound, setActiveHoleRound] = useState("Ronda 1");
  const [currentRound, setCurrentRound] = useState("General");

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const prevHashRef = useRef(null);

  const procesarHoja = (raw) => {
    if (!raw || raw.error) return [];
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      if (isRealPlayer(row)) {
        row._CleanName = String(row.Jugador || "")
          .replace(" RESULTADO REAL", "")
          .trim();
        let foundPar = false;
        let foundStable = false;

        for (let j = i + 1; j < i + 6 && j < raw.length; j++) {
          const subRow = raw[j];
          if (!subRow) continue;

          if (!foundPar && String(subRow.Jugador).startsWith("PAR ")) {
            row._parName = subRow.Jugador;
            foundPar = true;
          }
          if (!foundStable && subRow.Jugador === "STABLE RESULTADO") {
            row._stableResultado = subRow["RESULTADO ACTUAL"];
            foundStable = true;
          }
          if (isRealPlayer(subRow)) break;
        }
        if (!foundStable) {
          row._stableResultado = row["RESULTADO ACTUAL"];
        }
      }
    }
    return raw;
  };

  async function fetchData() {
    try {
      const t = new Date().getTime();

      const [res1, res2, resGen] = await Promise.all([
        fetch(`${API_URL}?ronda=Ronda 1&t=${t}`),
        fetch(`${API_URL}?ronda=Ronda 2&t=${t}`),
        fetch(`${API_URL}?ronda=General&t=${t}`),
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

      processedGen.forEach((pGen) => {
        if (isRealPlayer(pGen)) {
          const pBase =
            processedR1.find((p) => p.Jugador === pGen.Jugador) ||
            processedR2.find((p) => p.Jugador === pGen.Jugador);
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

  const playerMap = new Map();

  dbRonda1.filter(isRealPlayer).forEach((p) => {
    const rawValR1 = p._stableResultado;
    const valR1 =
      rawValR1 !== "" && rawValR1 !== undefined ? Number(rawValR1) : "-";

    playerMap.set(p.Jugador, {
      ...p,
      _r1Data: p,
      _cleanR1: valR1,
      _cleanR2: "-",
      _totalScore: valR1 !== "-" ? valR1 : 0,
    });
  });

  dbRonda2.filter(isRealPlayer).forEach((p) => {
    const rawValR2 = p._stableResultado;
    const valR2 =
      rawValR2 !== "" && rawValR2 !== undefined ? Number(rawValR2) : "-";

    if (playerMap.has(p.Jugador)) {
      const existing = playerMap.get(p.Jugador);
      existing._r2Data = p;
      existing._cleanR2 = valR2;

      const score1 = existing._cleanR1 !== "-" ? existing._cleanR1 : 0;
      const score2 = valR2 !== "-" ? valR2 : 0;
      existing._totalScore = score1 + score2;

      if (p.Hoyo && Number(p.Hoyo) > 0) {
        existing.Hoyo = p.Hoyo;
      }
    } else {
      playerMap.set(p.Jugador, {
        ...p,
        _r2Data: p,
        _cleanR1: "-",
        _cleanR2: valR2,
        _totalScore: valR2 !== "-" ? valR2 : 0,
      });
    }
  });

  const sortedPlayers = Array.from(playerMap.values())
    .map((p) => {
      const pGen = dbGeneral.find((pg) => pg.Jugador === p.Jugador);

      let ptsR1 = 0;
      let ptsR2 = 0;
      let ptsTot = 0;

      if (pGen) {
        ptsR1 =
          pGen["PUNTOS DIA 1"] !== "" && pGen["PUNTOS DIA 1"] !== undefined
            ? Number(pGen["PUNTOS DIA 1"])
            : 0;
        ptsR2 =
          pGen["PUNTOS DIA 2"] !== "" && pGen["PUNTOS DIA 2"] !== undefined
            ? Number(pGen["PUNTOS DIA 2"])
            : 0;
        ptsTot =
          pGen["PUNTOS INDIV. TOTAL"] !== "" &&
            pGen["PUNTOS INDIV. TOTAL"] !== undefined
            ? Number(pGen["PUNTOS INDIV. TOTAL"])
            : 0;
      }

      return {
        ...p,
        _puntosDia1: ptsR1,
        _puntosDia2: ptsR2,
        _puntosIndivTotal: ptsTot,
      };
    })
    .sort(
      (a, b) => (Number(b._totalScore) || 0) - (Number(a._totalScore) || 0),
    );

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

  const equiposUnicosMatch = [
    ...new Set(
      players.map((p) => p.EQUIPO).filter((e) => e && e.trim() !== ""),
    ),
  ];

  const pDecorated = players;

  let matchPlayHtml = "";
  let matchPlayPts = {};

  if (equiposUnicosMatch.length === 2) {
    const eq1Name = equiposUnicosMatch[0];
    const eq2Name = equiposUnicosMatch[1];
    matchPlayPts = { [eq1Name]: 0, [eq2Name]: 0 };

    let eq1Players = pDecorated
      .filter((p) => p.EQUIPO === eq1Name)
      .sort((a, b) => b._puntosIndivTotal - a._puntosIndivTotal);
    let eq2Players = pDecorated
      .filter((p) => p.EQUIPO === eq2Name)
      .sort((a, b) => b._puntosIndivTotal - a._puntosIndivTotal);

    const minLen = Math.min(eq1Players.length, eq2Players.length);
    const hasTrio = eq1Players.length !== eq2Players.length;
    const normalMatchesCount = hasTrio ? minLen - 1 : minLen;

    let html = [];

    for (let i = 0; i < normalMatchesCount; i++) {
      const p1 = eq1Players[i];
      const p2 = eq2Players[i];

      if (p1._puntosIndivTotal > p2._puntosIndivTotal) {
        matchPlayPts[p1.EQUIPO] += 2;
        html.push(
          `<li><b>1v1:</b> <b>${p1._CleanName}</b> (${p1._puntosIndivTotal}) gana a ${p2._CleanName} (${p2._puntosIndivTotal}). <br><span style='color:#e67e22; font-weight:bold;'>+2 ${p1.EQUIPO}</span></li>`,
        );
      } else if (p2._puntosIndivTotal > p1._puntosIndivTotal) {
        matchPlayPts[p2.EQUIPO] += 2;
        html.push(
          `<li><b>1v1:</b> <b>${p2._CleanName}</b> (${p2._puntosIndivTotal}) gana a ${p1._CleanName} (${p1._puntosIndivTotal}). <br><span style='color:#e67e22; font-weight:bold;'>+2 ${p2.EQUIPO}</span></li>`,
        );
      } else {
        matchPlayPts[p1.EQUIPO] += 1;
        matchPlayPts[p2.EQUIPO] += 1;
        html.push(
          `<li><b>1v1:</b> <b>Empate</b> entre ${p1._CleanName} y ${p2._CleanName} (${p1._puntosIndivTotal} pts). <br><span style='color:#e67e22; font-weight:bold;'>+1 cada equipo</span></li>`,
        );
      }
    }

    if (hasTrio) {
      const minEq =
        eq1Players.length < eq2Players.length ? eq1Players : eq2Players;
      const maxEq =
        eq1Players.length > eq2Players.length ? eq1Players : eq2Players;

      const solitario = minEq[minEq.length - 1];
      const pareja1 = maxEq[maxEq.length - 2];
      const pareja2 = maxEq[maxEq.length - 1];

      matchPlayPts[minEq[0].EQUIPO] += 1;

      const trio = [solitario, pareja1, pareja2].sort(
        (a, b) => b._puntosIndivTotal - a._puntosIndivTotal,
      );

      matchPlayPts[trio[0].EQUIPO] += 2;
      matchPlayPts[trio[1].EQUIPO] += 2;

      html.push(
        `<li class='trio' style='margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;'><b>El Trío Final:</b> ${solitario._CleanName} vs ${pareja1._CleanName} y ${pareja2._CleanName}.<br> 1º: ${trio[0]._CleanName} (+2) | 2º: ${trio[1]._CleanName} (+2) <br><span style='color:#e67e22; font-weight:bold;'>(+1 minoría para ${minEq[0].EQUIPO})</span></li>`,
      );
    }
    matchPlayHtml = html.join("");
  }

  const rawEquiposData = equiposUnicosMatch
    .map((equipo) => {
      const rawJugadores = pDecorated.filter((p) => p.EQUIPO === equipo);

      const capitanNombre = TEAM_CAPTAINS[equipo.toUpperCase()] || "";
      const jugadores = [...rawJugadores].sort((a, b) => {
        const aName = (a._CleanName || a.Jugador || "").toUpperCase();
        const bName = (b._CleanName || b.Jugador || "").toUpperCase();
        const capUpper = capitanNombre.toUpperCase();
        if (capUpper && aName.includes(capUpper)) return -1;
        if (capUpper && bName.includes(capUpper)) return 1;
        return 0;
      });

      let teamR1 = 0;
      let teamR2 = 0;
      let puntosIndivTotal = 0;

      rawJugadores.forEach((p) => {
        teamR1 += p._puntosDia1;
        teamR2 += p._puntosDia2;
        puntosIndivTotal += p._puntosIndivTotal;
      });

      const puntosExtrasMatch = matchPlayPts[equipo] || 0;
      const totalPuntos = puntosIndivTotal + puntosExtrasMatch;

      return { equipo, jugadores, teamR1, teamR2, totalPuntos };
    })
    .sort((a, b) => b.totalPuntos - a.totalPuntos);

  let currentEqRank = 0;
  let lastEqScore = null;
  const equiposData = rawEquiposData.map((eq, i) => {
    if (eq.totalPuntos !== lastEqScore) {
      currentEqRank = i + 1;
    }
    lastEqScore = eq.totalPuntos;
    return { ...eq, _rank: currentEqRank };
  });

  const maxPuntosEquipos =
    equiposData.length > 0 ? equiposData[0].totalPuntos : 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="title">
            Clasificación{" "}
            <span
              style={{
                fontSize: "0.5em",
                color: "var(--gold)",
                verticalAlign: "middle",
              }}
            >
              {currentRound}
            </span>
            <span>
              <img
                src={fotoEquipos}
                alt="foto equipos"
                style={{
                  height: "100px",
                  verticalAlign: "middle",
                  marginLeft: "50px",
                  borderRadius: "10px",
                }}
              />
            </span>
          </h1>
          <p className="subtitle">
            {players.length > 0 ? `${players.length} jugadores` : "Cargando…"}
          </p>

          <div
            className="tabs-groups"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div className="tabs-container" style={{ marginTop: 0 }}>
              <button
                className={`tab-btn ${activeTab === "clasificacion" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("clasificacion");
                }}
              >
                Individuales
              </button>
              <button
                className={`tab-btn ${activeTab === "equipos" ? "active equipos" : ""}`}
                onClick={() => setActiveTab("equipos")}
              >
                Equipos
              </button>
            </div>
          </div>

          {activeTab === "clasificacion" && (
            <div className="hole-selector" style={{ marginTop: "16px" }}>
              <span className="selector-label">Ver Hoyo de:</span>
              <div className="mini-toggle">
                <button
                  className={`mini-tab-btn ${activeHoleRound === "Ronda 1" ? "active" : ""}`}
                  onClick={() => setActiveHoleRound("Ronda 1")}
                >
                  📍 R1
                </button>
                <button
                  className={`mini-tab-btn ${activeHoleRound === "Ronda 2" ? "active" : ""}`}
                  onClick={() => setActiveHoleRound("Ronda 2")}
                >
                  📍 R2
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="header-right">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Cambiar tema"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div
            className={`status-dot ${error ? "error" : "ok"} ${pulse ? "pulse" : ""}`}
          />
          <span className="status-text">
            {error
              ? "Sin conexión"
              : lastUpdate
                ? lastUpdate.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
                : "Conectando…"}
          </span>
        </div>
      </header>

      {selectedHoleInfo && (
        <div
          className="hole-preview-overlay"
          onClick={() => setSelectedHoleInfo(null)}
        >
          <div
            className="hole-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-preview"
              onClick={() => setSelectedHoleInfo(null)}
            >
              ×
            </button>
            <h3>Información Hoyo {selectedHoleInfo}</h3>
            <img
              src={`/images/hoyos/hoyo-${selectedHoleInfo}.jpg`}
              alt={`Hoyo ${selectedHoleInfo}`}
              className="hole-map-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/400x300?text=Imagen+No+Disponible";
              }}
            />
          </div>
        </div>
      )}

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
                  <span className="th-hoyo">Hoyo</span>
                  <div className="th-stats header-r1r2">
                    <span
                      className={
                        activeHoleRound === "Ronda 1" ? "active-th" : ""
                      }
                    >
                      R1
                    </span>
                    <span
                      className={
                        activeHoleRound === "Ronda 2" ? "active-th" : ""
                      }
                    >
                      R2
                    </span>
                  </div>
                  <span className="th-resultado">TOTAL</span>
                </div>
                <div className="table-body">
                  {players.map((player, i) => {
                    const playerRoundData =
                      activeHoleRound === "Ronda 1"
                        ? dbRonda1.find((p) => p.Jugador === player.Jugador)
                        : dbRonda2.find((p) => p.Jugador === player.Jugador);

                    const hoyoValue =
                      playerRoundData?.HOYO || playerRoundData?.Hoyo;
                    const tienePuntos =
                      (Number(playerRoundData?._stableResultado) || 0) > 0;
                    const hoyoActivo = hoyoValue
                      ? hoyoValue
                      : tienePuntos
                        ? "1"
                        : "-";

                    return (
                      <PlayerRow
                        key={player.Jugador}
                        player={player}
                        rank={player._rank}
                        colorIndex={i}
                        parRow={
                          dbRonda1.find((p) => p.Jugador === player._parName) ||
                          dbRonda2.find((p) => p.Jugador === player._parName)
                        }
                        onClick={() => setSelectedPlayer(player)}
                        currentRound={currentRound}
                        hoyoActivo={hoyoActivo}
                        activeHoleRound={activeHoleRound}
                      />
                    );
                  })}
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
                  <span className="th-tot">Pts</span>
                </div>
                <div className="table-body">
                  {equiposData.length > 0 ? (
                    equiposData.map((eq) => {
                      const isLeader =
                        eq.totalPuntos === maxPuntosEquipos &&
                        eq.totalPuntos > 0;
                      const logoUrl = TEAM_AVATAR_IMAGES[eq.equipo];
                      const isExpanded = expandedTeam === eq.equipo;

                      return (
                        <div
                          key={eq.equipo}
                          className={`team-accordion-wrapper ${isExpanded ? "expanded" : ""}`}
                        >
                          <div
                            className={`equipo-row ${isLeader ? "leader" : ""} ${isExpanded ? "active" : ""}`}
                            onClick={() =>
                              setExpandedTeam((prev) =>
                                prev === eq.equipo ? null : eq.equipo,
                              )
                            }
                          >
                            <div className="row-rank">
                              <RankBadge rank={eq._rank} />
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
                                const capName =
                                  TEAM_CAPTAINS[eq.equipo.toUpperCase()];
                                const esCapitan =
                                  capName &&
                                  nombre
                                    .toUpperCase()
                                    .includes(capName.toUpperCase());
                                return (
                                  <span
                                    key={idx}
                                    className={`player-mini-tag ${esCapitan ? "captain-tag" : ""}`}
                                  >
                                    {esCapitan && (
                                      <span className="cap-icon">(C)</span>
                                    )}{" "}
                                    {nombre}
                                  </span>
                                );
                              })}
                            </div>

                            <span
                              className="score-val"
                              style={{ textAlign: "center", fontWeight: "600" }}
                            >
                              {eq.teamR1}
                            </span>
                            <span
                              className="score-val"
                              style={{ textAlign: "center", fontWeight: "600" }}
                            >
                              {eq.teamR2}
                            </span>
                            <div className="score-tot">
                              <ResultadoBadge valor={eq.totalPuntos} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="equipo-desplegable">
                              <div className="desplegable-header">
                                <span className="desplegable-title">
                                  Estadísticas por hoyo
                                </span>
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
                                  {selectedHoleInfo && (
                                    <div className="hole-preview-section">
                                      <img
                                        src={`/images/hoyos/hoyo-${selectedHoleInfo}.jpg`}
                                        alt={`Hoyo ${selectedHoleInfo}`}
                                        className="hole-preview-img"
                                      />
                                    </div>
                                  )}
                                  <div className="hole-row header">
                                    <span className="hole-label">Hoyo</span>
                                    {Array.from(
                                      { length: 18 },
                                      (_, i) => i + 1,
                                    ).map((h) => (
                                      <span
                                        key={h}
                                        className="hole-num"
                                        onClick={() =>
                                          setSelectedHoleInfo(
                                            selectedHoleInfo === h ? null : h,
                                          )
                                        }
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
                                      const parRow =
                                        dbRonda1.find(
                                          (p) =>
                                            p.Jugador === anyPlayer?._parName,
                                        ) ||
                                        dbRonda2.find(
                                          (p) =>
                                            p.Jugador === anyPlayer?._parName,
                                        );
                                      let parSum = 0;
                                      return (
                                        <>
                                          {Array.from(
                                            { length: 18 },
                                            (_, i) => i + 1,
                                          ).map((h) => {
                                            const pVal =
                                              Number(parRow?.[h]) || 0;
                                            parSum += pVal;
                                            return (
                                              <span key={h}>{pVal || "-"}</span>
                                            );
                                          })}
                                          <span className="hole-total">
                                            {parSum}
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {eq.jugadores.map((player) => {
                                    const source =
                                      accordionRound === "R1"
                                        ? player._r1Data
                                        : player._r2Data;
                                    const parRow =
                                      dbRonda1.find(
                                        (p) => p.Jugador === player?._parName,
                                      ) ||
                                      dbRonda2.find(
                                        (p) => p.Jugador === player?._parName,
                                      );
                                    let totalStrokes = 0;
                                    const nombre =
                                      player._CleanName || player.Jugador;
                                    const capName =
                                      TEAM_CAPTAINS[eq.equipo.toUpperCase()];
                                    const esCapitan =
                                      capName &&
                                      nombre
                                        .toUpperCase()
                                        .includes(capName.toUpperCase());

                                    if (!source) {
                                      return (
                                        <div className="hole-row player" key={player.Jugador}>
                                          <span className="hole-label">
                                            {nombre}{" "}
                                            {esCapitan && <span className="cap-icon-mini">(C)</span>}
                                          </span>
                                          <span style={{ gridColumn: "span 19", color: "var(--text2)", fontStyle: "italic", fontSize: "11px" }}>
                                            Sin datos en esta ronda
                                          </span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        className="hole-row player"
                                        key={player.Jugador}
                                      >
                                        <span className="hole-label">
                                          {nombre}{" "}
                                          {esCapitan && (
                                            <span className="cap-icon-mini">
                                              (C)
                                            </span>
                                          )}
                                        </span>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((h) => {
                                          const strokesRaw = source[h];
                                          const strokes = Number(strokesRaw);
                                          const par = Number(parRow?.[h]);
                                          totalStrokes += strokes || 0;

                                          let scoreClass = "";
                                          if (
                                            strokesRaw !== "" &&
                                            strokes &&
                                            par
                                          ) {
                                            if (strokes < par)
                                              scoreClass = "score-under";
                                            else if (strokes > par)
                                              scoreClass = "score-over";
                                            else scoreClass = "score-par";
                                          }

                                          return (
                                            <span
                                              key={h}
                                              className={scoreClass}
                                            >
                                              {strokesRaw || "-"}
                                            </span>
                                          );
                                        })}
                                        <span className="hole-total">
                                          {totalStrokes || "-"}
                                        </span>
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
                  <div
                    className="marcador-enfrentamientos"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      padding: "15px",
                      borderRadius: "10px",
                      marginTop: "30px",
                      marginBottom: "20px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: "15px",
                        textAlign: "center",
                        color: "var(--gold)",
                        fontSize: "16px",
                      }}
                    >
                      Puntos en Juego (Match Play)
                    </h3>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        fontSize: "14px",
                        lineHeight: "1.4",
                      }}
                      dangerouslySetInnerHTML={{ __html: matchPlayHtml }}
                    />
                  </div>
                )}
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
        selectedHoleInfo={selectedHoleInfo}
        setSelectedHoleInfo={setSelectedHoleInfo}
      />

      <footer className="footer">
        <span>Actualización automática cada {POLL_INTERVAL / 1000}s</span>
      </footer>
    </div>
  );
}