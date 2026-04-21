import { useState, useEffect, useRef } from "react";
import "./App.css";

import appLogo from "./the-golfos-on-tour-2026-logo.ico";
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

function getScoreClass(strokes, par) {
  if (!strokes || !par || strokes === "" || isNaN(strokes) || isNaN(par)) return "score-par";
  const s = Number(strokes);
  const p = Number(par);
  if (s <= 0) return "score-par";
  const diff = s - p;

  if (s === 1 || diff <= -2) return "score-eagle";
  if (diff === -1) return "score-under";
  if (diff === 0) return "score-par";
  if (diff === 1) return "score-bogey";
  return "score-double-bogey";
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

function RankBadge({ rank, showMedal = true }) {
  let medalClass = "standard";
  if (showMedal) {
    if (rank === 1) medalClass = "gold";
    if (rank === 2) medalClass = "silver";
    if (rank === 3) medalClass = "bronze";
  }

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

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() => JSON.parse(localStorage.getItem("sync_queue") || "[]"));
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbRonda1, setDbRonda1] = useState([]);
  const [dbRonda2, setDbRonda2] = useState([]);
  const [dbGeneral, setDbGeneral] = useState([]);
  const [marcadorInfo, setMarcadorInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pulse, setPulse] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("clasificacion");
  const [scoringTeamFilter, setScoringTeamFilter] = useState("");
  const [scoringPlayer, setScoringPlayer] = useState(null);
  const [scoringRound, setScoringRound] = useState("Ronda 1");
  const [scoringData, setScoringData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [accordionRound, setAccordionRound] = useState("R1");
  const [activeHoleRound, setActiveHoleRound] = useState("Ronda 1");
  const [currentRound] = useState("General");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    setAccordionRound(activeHoleRound === "Ronda 1" ? "R1" : "R2");
  }, [activeHoleRound]);

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

        let hcpValue = parseFloat(String(row.HCP).replace(",", ".")) || 0;

        for (let j = i + 1; j < i + 6 && j < raw.length; j++) {
          const subRow = raw[j];
          if (!subRow) continue;

          if (!foundPar && String(subRow.Jugador).startsWith("PAR ")) {
            row._parName = subRow.Jugador;

            const hcpPar = parseFloat(String(subRow.HCP).replace(",", "."));
            if (!isNaN(hcpPar)) hcpValue = hcpPar;

            foundPar = true;
          }
          if (!foundStable && subRow.Jugador === "STABLE RESULTADO") {
            row._stableResultado = subRow["RESULTADO ACTUAL"];
            foundStable = true;
          }
          if (isRealPlayer(subRow)) break;
        }

        row._hcpGuardado = hcpValue;
        row.ARQUETIPO = row.FLL || row.fll || row.ARQUETIPO || "";

        if (!foundStable) {
          row._stableResultado = row["RESULTADO ACTUAL"];
        }
      }
    }
    return raw;
  };

  const lastScoringRef = useRef("");
  useEffect(() => {
    const key = `${scoringPlayer?.Jugador}-${scoringRound}`;
    if (scoringPlayer && key !== lastScoringRef.current) {
      lastScoringRef.current = key;
      const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
      const roundPlayerData = activeDb.find((p) => p.Jugador === scoringPlayer.Jugador);
      const parRow = roundPlayerData
        ? activeDb.find((p) => p.Jugador === roundPlayerData._parName)
        : null;

      const initial = {};
      const holes = Array.from({ length: 18 }, (_, i) => i + 1);
      holes.forEach((h) => {
        initial[h] = {
          par: parRow && parRow[h] !== undefined ? parRow[h] : "",
          golpes: roundPlayerData && roundPlayerData[h] !== undefined ? roundPlayerData[h] : "",
        };
      });
      setScoringData(initial);
    }
  }, [scoringPlayer, scoringRound, dbRonda1, dbRonda2]);

  const handleScoreChange = (hole, field, value) => {
    setScoringData((prev) => ({
      ...prev,
      [hole]: { ...prev[hole], [field]: value },
    }));
  };

  const saveScores = async () => {
    if (!scoringPlayer) return;
    setIsSaving(true);
    let nuevosGolpes = {};
    let nuevosPares = {};
    Object.keys(scoringData).forEach((hole) => {
      nuevosGolpes[hole] = scoringData[hole].golpes;
      nuevosPares[hole] = scoringData[hole].par;
    });

    const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
    const roundPlayerData = activeDb.find((p) => p.Jugador === scoringPlayer.Jugador);
    const parName = roundPlayerData?._parName || `PAR ${String(scoringPlayer.Jugador).toUpperCase()}`;

    const paqueteGolpes = { jugador: scoringPlayer.Jugador, ronda: scoringRound, golpes: nuevosGolpes };
    const paquetePares = { jugador: parName, ronda: scoringRound, golpes: nuevosPares };

    if (!navigator.onLine) {
      const qs = [...syncQueue, paqueteGolpes, paquetePares];
      setSyncQueue(qs);
      localStorage.setItem("sync_queue", JSON.stringify(qs));
      setIsSaving(false);
      alert("Guardado offline. Se sincronizará en cuanto recuperes la conexión.");
      return;
    }

    const enviarDatos = async (paquete) => {
      try {
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(paquete),
          headers: { "Content-Type": "text/plain" },
        });
      } catch (e) { }
    };

    await Promise.all([
      enviarDatos(paqueteGolpes),
      enviarDatos(paquetePares),
    ]);

    setIsSaving(false);
    fetchData();
    alert("¡Puntuaciones guardadas correctamente!");
  };

  const resetScores = async () => {
    if (!scoringPlayer) return;
    const confirmReset = window.confirm(`⚠️ ¿Borrar todos los golpes de ${scoringPlayer._CleanName || scoringPlayer.Jugador} en ${scoringRound}?`);
    if (!confirmReset) return;

    setIsSaving(true);
    let golpesVacios = {};
    for (let i = 1; i <= 18; i++) golpesVacios[i] = "";

    const paqueteReset = { jugador: scoringPlayer.Jugador, ronda: scoringRound, golpes: golpesVacios };

    if (!navigator.onLine) {
      const qs = [...syncQueue, paqueteReset];
      setSyncQueue(qs);
      localStorage.setItem("sync_queue", JSON.stringify(qs));
      setIsSaving(false);
      alert("Reseteo offline. Se sincronizará en cuanto recuperes la conexión.");
      return;
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(paqueteReset),
        headers: { "Content-Type": "text/plain" },
      });
    } catch (e) { }

    setIsSaving(false);
    fetchData();
  };

  async function fetchData() {
    try {
      const t = new Date().getTime();

      const [res1, res2, resGen, resMarcador] = await Promise.all([
        fetch(`${API_URL}?ronda=Ronda 1&t=${t}`),
        fetch(`${API_URL}?ronda=Ronda 2&t=${t}`),
        fetch(`${API_URL}?ronda=General&t=${t}`),
        fetch(`${API_URL}?ronda=marcador&t=${t}`),
      ]);

      if (!res1.ok || !res2.ok || !resGen.ok) throw new Error(`HTTP Error`);

      const raw1 = await res1.json();
      const raw2 = await res2.json();
      const rawGen = await resGen.json();

      let rawMarcador = null;
      try {
        rawMarcador = await resMarcador.json();
        setMarcadorInfo(rawMarcador);
      } catch (e) { }

      const processedR1 = procesarHoja(raw1);
      const processedR2 = procesarHoja(raw2);
      const processedGen = procesarHoja(rawGen);

      const hash = JSON.stringify({ r1: raw1, r2: raw2, rg: rawGen, rm: rawMarcador });
      if (hash === prevHashRef.current) return;
      prevHashRef.current = hash;
      localStorage.setItem("last_db_cache", hash);

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
      const cached = localStorage.getItem("last_db_cache");
      if (cached) {
        try {
          const { r1, r2, rg, rm } = JSON.parse(cached);
          const processedR1 = procesarHoja(r1);
          const processedR2 = procesarHoja(r2);
          const processedGen = procesarHoja(rg);
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
          if (rm) setMarcadorInfo(rm);
          setError("Modo Offline: Usando datos locales");
          setLoading(false);
          return;
        } catch (err) {
          console.error("Error parsing cached data", err);
        }
      }

      setError(e.message);
      setDbRonda1([]);
      setDbRonda2([]);
      setDbGeneral([]);
      setMarcadorInfo(null);
      prevHashRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  const flushQueue = async () => {
    const queue = JSON.parse(localStorage.getItem("sync_queue") || "[]");
    if (queue.length === 0) return;
    
    setIsSyncing(true);
    let failed = false;
    let newQueue = [...queue];

    for (let i = 0; i < queue.length; i++) {
       try {
         await fetch(API_URL, {
           method: "POST",
           body: JSON.stringify(queue[i]),
           headers: { "Content-Type": "text/plain" },
         });
         newQueue.shift();
         localStorage.setItem("sync_queue", JSON.stringify(newQueue));
         setSyncQueue([...newQueue]);
       } catch (e) {
         failed = true;
         break;
       }
    }
    
    setIsSyncing(false);
    if (!failed) {
      fetchData();
    }
  };

  useEffect(() => {
    const goOnline = () => { setIsOffline(false); flushQueue(); };
    const goOffline = () => setIsOffline(true);
    
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Attempt initial flush in case it came online before listener
    if (navigator.onLine) flushQueue();
    
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

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
      _hcpGuardado: p._hcpGuardado,
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

      if (!existing._hcpGuardado && p._hcpGuardado) {
        existing._hcpGuardado = p._hcpGuardado;
      }

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
        _hcpGuardado: p._hcpGuardado,
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
    .sort((a, b) => {
      const scoreA = Number(a._totalScore) || 0;
      const scoreB = Number(b._totalScore) || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      const hcpA = Number(a._hcpGuardado) || 0;
      const hcpB = Number(b._hcpGuardado) || 0;
      return hcpA - hcpB;
    });

  let currentRank = 0;
  let lastScore = null;
  let lastHcp = null;
  const players = sortedPlayers.map((p, i) => {
    const score = p._totalScore;
    const hcp = p._hcpGuardado;

    if (score !== lastScore || hcp !== lastHcp) {
      currentRank = i + 1;
    }
    lastScore = score;
    lastHcp = hcp;
    return { ...p, _rank: currentRank };
  });

  const equiposUnicosMatch = [
    ...new Set(
      players.map((p) => p.EQUIPO).filter((e) => e && e.trim() !== ""),
    ),
  ];

  let matchPlayHtml = "";

  let sumaTotalFly = 0;
  let sumaTotalCar = 0;

  if (marcadorInfo && Array.isArray(marcadorInfo)) {
    let html = [];
    let isBottomSection = false;

    const dividerIdx = marcadorInfo.findIndex((r) =>
      Object.values(r).some((v) =>
        String(v).toUpperCase().includes("TOTAL FLY"),
      ),
    );

    for (let i = 0; i < marcadorInfo.length; i++) {
      const row = marcadorInfo[i];
      const stringFilaEntera = JSON.stringify(row).toUpperCase();

      if (
        stringFilaEntera.includes("SUMA TOTAL") ||
        stringFilaEntera.includes("EMPAREJAMIENTO")
      ) {
        sumaTotalFly = Number(row.STABLEFORD) || 0;
        sumaTotalCar = Number(row.POSICION) || 0;
        continue;
      }

      if (
        !row.FLY ||
        String(row.FLY).trim() === "" ||
        String(row.FLY).toUpperCase() === "FLY"
      ) {
        isBottomSection = true;
        continue;
      }

      if (isBottomSection && row.FLY && dividerIdx !== -1) {
        const pFly = String(row.FLY).trim();
        const flyPts = Number(row.STABLEFORD) || 0;
        const carPts = Number(row.POSICION) || 0;

        const upperRowIdx = marcadorInfo.findIndex(
          (r) => String(r.FLY).trim().toUpperCase() === pFly.toUpperCase(),
        );
        let pCar = "Rival";
        let pCar2 = null;

        if (upperRowIdx !== -1 && upperRowIdx < i) {
          pCar = String(marcadorInfo[upperRowIdx].CAR).trim();

          const nextUpper = marcadorInfo[upperRowIdx + 1];
          if (
            nextUpper &&
            (!nextUpper.FLY || String(nextUpper.FLY).trim() === "") &&
            nextUpper.CAR
          ) {
            pCar2 = String(nextUpper.CAR).trim();
          }
        }

        const pFlyData = players.find((p) =>
          (p._CleanName || p.Jugador).toUpperCase().includes(pFly.toUpperCase()),
        );
        const pCarData = players.find((p) =>
          (p._CleanName || p.Jugador).toUpperCase().includes(pCar.toUpperCase()),
        );
        const flyScore = pFlyData ? pFlyData._totalScore : "?";
        const carScore = pCarData ? pCarData._totalScore : "?";

        if (pCar2) {
          const pCar2Data = players.find((p) =>
            (p._CleanName || p.Jugador).toUpperCase().includes(pCar2.toUpperCase()),
          );
          const car2Score = pCar2Data ? pCar2Data._totalScore : "?";
          html.push(
            `<li class='trio' style='margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);'>
              <b>El Trío Final:</b> <span style='color:var(--blue)'>${pFly}</span> (${flyScore}) 
              vs 
              <span style='color:#e67e22'>${pCar}</span> (${carScore}) 
              y 
              <span style='color:#e67e22'>${pCar2}</span> (${car2Score}).
              <br> 
              <span style='color:var(--blue); font-weight:bold;'>FLYING +${flyPts}</span> | 
              <span style='color:#e67e22; font-weight:bold;'>CARABASSA +${carPts}</span> 
              <br><span style='color:#e67e22; font-size:11px; font-weight:bold;'>(Incluye +1 minoría FLY)</span>
            </li>`,
          );
        } else {
          const flyNum = html.filter(h => h.includes('<b>Fly ')).length + 1;

          if (flyPts > carPts) {
            html.push(
              `<li>
                <b>Fly ${flyNum}:</b> <b style='color:var(--blue)'>${pFly}</b> (${flyScore} pts) gana a <span style='color:#e67e22'>${pCar}</span> (${carScore} pts). 
                <br><span style='color:var(--blue); font-weight:bold;'>FLYING +${flyPts}</span>
              </li>`,
            );
          } else if (carPts > flyPts) {
            html.push(
              `<li>
                <b>Fly ${flyNum}:</b> <b style='color:#e67e22'>${pCar}</b> (${carScore} pts) gana a <span style='color:var(--blue)'>${pFly}</span> (${flyScore} pts). 
                <br><span style='color:#e67e22; font-weight:bold;'>CARABASSA +${carPts}</span>
              </li>`,
            );
          } else {
            html.push(
              `<li>
                <b>Fly ${flyNum}:</b> <b>Empate</b> entre <span style='color:var(--blue)'>${pFly}</span> (${flyScore} pts) y <span style='color:#e67e22'>${pCar}</span> (${carScore} pts). 
                <br><span style='color:var(--text2); font-weight:bold;'>FLY +1 | CARA +1</span>
              </li>`,
            );
          }
        }
      }
    }
    matchPlayHtml = html.join("");
  }

  const rawEquiposData = equiposUnicosMatch
    .map((equipo) => {
      const rawJugadores = players.filter((p) => p.EQUIPO === equipo);

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

      const eqNameUpper = equipo.trim().toUpperCase();
      let totalPuntos = 0;

      if (eqNameUpper.includes("FLY")) {
        totalPuntos = sumaTotalFly > 0 ? sumaTotalFly : puntosIndivTotal;
      } else if (eqNameUpper.includes("CARA")) {
        totalPuntos = sumaTotalCar > 0 ? sumaTotalCar : puntosIndivTotal;
      } else {
        totalPuntos = puntosIndivTotal;
      }

      const isFinished = jugadores.length > 0 && jugadores.every(p => {
        const h = p.Hoyo || p.HOYO;
        return h === "F" || h === "18" || h === 18;
      });

      return { equipo, jugadores, teamR1, teamR2, totalPuntos, isFinished };
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
                src={appLogo}
                alt="The Golfos On Tour 2026"
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
                onClick={() => setActiveTab("clasificacion")}
              >
                Individuales
              </button>
              <button
                className={`tab-btn ${activeTab === "equipos" ? "active equipos" : ""}`}
                onClick={() => setActiveTab("equipos")}
              >
                Equipos
              </button>
              <button
                className={`tab-btn ${activeTab === "anotar" ? "active anotar" : ""}`}
                onClick={() => setActiveTab("anotar")}
                style={{ position: 'relative' }}
              >
                Anotar <span style={{ fontSize: '10px', verticalAlign: 'top', marginLeft: '2px' }}>✎</span>
              </button>
            </div>
          </div>

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
            className={`status-dot ${isOffline ? "offline" : error ? "error" : "ok"} ${pulse ? "pulse" : ""}`}
            style={isOffline ? { backgroundColor: 'orange', boxShadow: '0 0 10px orange' } : {}}
          />
          <span className="status-text">
            {isSyncing || syncQueue.length > 0
              ? `Sincronizando cambios pendientes... (${syncQueue.length})`
              : isOffline
                ? "Modo Offline"
                : error
                  ? "Error de conexión"
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
                  <span className="th-hoyo" style={{ fontSize: "11px", lineHeight: "1.2", textAlign: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                      Hoyo
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        background: "var(--blue)",
                        color: "#1a1a2e",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        letterSpacing: "0.5px",
                      }}>
                        {activeHoleRound === "Ronda 1" ? "R1" : "R2"}
                      </span>
                    </span>
                  </span>
                  <div className="th-stats header-r1r2" style={{ gap: "4px" }}>
                    <button
                      onClick={() => setActiveHoleRound("Ronda 1")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: activeHoleRound === "Ronda 1" ? "1px solid var(--blue)" : "1px solid var(--border)",
                        background: activeHoleRound === "Ronda 1" ? "var(--blue)" : "transparent",
                        color: activeHoleRound === "Ronda 1" ? "#1a1a2e" : "var(--text2)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      R1
                    </button>
                    <button
                      onClick={() => setActiveHoleRound("Ronda 2")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: activeHoleRound === "Ronda 2" ? "1px solid var(--blue)" : "1px solid var(--border)",
                        background: activeHoleRound === "Ronda 2" ? "var(--blue)" : "transparent",
                        color: activeHoleRound === "Ronda 2" ? "#1a1a2e" : "var(--text2)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      R2
                    </button>
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
                        onClick={() => {
                          setScoringTeamFilter(player.EQUIPO || "");
                          setScoringPlayer(player);
                          setActiveTab("anotar");
                        }}
                        hoyoActivo={hoyoActivo}
                        activeHoleRound={activeHoleRound}
                        totalPlayers={players.length}
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
                          className={`team-accordion-wrapper ${isExpanded ? "expanded" : ""} ${eq.isFinished ? "finished" : ""}`}
                        >
                          <div
                            className={`equipo-row ${isLeader ? "leader" : ""} ${isExpanded ? "active" : ""} ${eq.isFinished ? "finished" : ""}`}
                            onClick={() =>
                              setExpandedTeam((prev) =>
                                prev === eq.equipo ? null : eq.equipo,
                              )
                            }
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
                                    {nombre}{" "}
                                    {esCapitan && (
                                      <span className="cap-icon">(C)</span>
                                    )}
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

                                          const scoreClass = getScoreClass(strokesRaw, par);

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
                      marginTop: "20px",
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

            {activeTab === "anotar" && (
              <div className="anotacion-tab slide-up">
                <div className="scoring-controls-wrapper" style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>

                  <div className="control-group">
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Filtrar por Equipo</label>
                    <select
                      className="scoring-select"
                      value={scoringTeamFilter}
                      onChange={(e) => {
                        setScoringTeamFilter(e.target.value);
                        setScoringPlayer(null);
                      }}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '14px', fontWeight: '600' }}
                    >
                      <option value="">— Todos los Equipos —</option>
                      {equiposUnicosMatch.map(eq => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Seleccionar Jugador</label>
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
                        .map(p => (
                          <option key={p.Jugador} value={p.Jugador}>
                            {p._CleanName || p.Jugador} ({p.ARQUETIPO || "Sin Arquetipo"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', gridColumn: 'span 1 / -1', justifyContent: 'flex-end' }}>
                    <button className="reset-btn" onClick={resetScores} disabled={!scoringPlayer || isSaving} title="Borrar ronda actual" style={{ width: '46px', height: '46px', borderRadius: '12px' }}>↺</button>
                    <button className="save-btn" onClick={saveScores} disabled={!scoringPlayer || isSaving} style={{ padding: '0 30px', borderRadius: '12px', height: '46px', fontSize: '14px', fontWeight: '800', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(91, 196, 216, 0.2)' }}>
                      {isSaving ? "PROCESANDO..." : "GUARDAR CAMBIOS"}
                    </button>
                  </div>
                </div>

                {scoringPlayer ? (
                  <div className="scoring-grid-container card-premium" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div className="card-header-scoring" style={{ padding: '25px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="avatar big" style={{ width: '50px', height: '50px', borderRadius: '12px', fontSize: '18px' }}>
                          {getInitials(scoringPlayer._CleanName || scoringPlayer.Jugador)}
                        </div>
                        <div>
                          <h2 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px', letterSpacing: '0.5px' }}>
                            {scoringPlayer.ARQUETIPO || "TARJETA INDIVIDUAL"}
                          </h2>
                          <div style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: '600' }}>
                            {scoringPlayer._CleanName || scoringPlayer.Jugador} • {scoringPlayer.EQUIPO}
                          </div>
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
                          <span>HCP</span>
                          <span>PAR</span>
                          <span>GOLPES</span>
                        </div>
                        <div className="scrollable-grid" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                          {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
                            const data = scoringData[h] || { par: "", golpes: "" };
                            const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
                            const hcpRow = activeDb.find(p => p.Jugador === "HCP HOYO");
                            const hcpVal = hcpRow?.[h] || "-";
                            const scoreClass = getScoreClass(data.golpes, data.par);

                            return (
                              <div className="stats-row" key={h} style={{ gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '12px 15px', marginBottom: '4px' }}>
                                <div className="hole-cell">
                                  <button className="hole-btn-trigger" onClick={() => setSelectedHoleInfo(h)} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: '700' }}>
                                    {h} 🗺️
                                  </button>
                                </div>
                                <span style={{ color: 'var(--text2)', alignSelf: 'center', fontWeight: '600' }}>{hcpVal}</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ color: 'var(--text2)', fontWeight: '600' }}>{data.par || "-"}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input type="number" className={`edit-input ${scoreClass}`} value={data.golpes} onChange={(e) => handleScoreChange(h, "golpes", e.target.value)} disabled={isSaving} placeholder="-" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-container" style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>📋</div>
                    <h3 style={{ color: 'var(--text)', marginBottom: '10px' }}>Sistema de Anotación</h3>
                    <p style={{ color: 'var(--text2)', maxWidth: '400px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
                      Selecciona un jugador del menú superior o haz clic en cualquier nombre de la clasificación para empezar a editar su tarjeta de puntuación.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>Actualización automática cada {POLL_INTERVAL / 1000}s</span>
      </footer>
    </div>
  );
}