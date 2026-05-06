import { useState, useEffect, useRef } from "react";
import "./App.css";

import appLogo from "./the-golfos-on-tour-2026-logo.ico";

import {
  API_URL,
  POLL_INTERVAL,
  TEAM_CAPTAINS,
  TEAM_AVATAR_IMAGES,
} from "./utils/constants";
import {
  getInitials,
  getScoreClass,
  isRealPlayer,
  checkIfOnFire,
} from "./utils/helpers";
import { RankBadge, ResultadoBadge } from "./components/UIComponents";
import PlayerRow from "./components/PlayerRow";
import PlayerModal from "./components/PlayerModal";
import IndividualStandings from "./components/IndividualStandings";
import TeamStandings from "./components/TeamStandings";
import AppHeader from "./components/AppHeader";

export default function App() {
  // ESTADO: Sincronización
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() =>
    JSON.parse(localStorage.getItem("sync_queue") || "[]"),
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbRonda1, setDbRonda1] = useState([]);
  const [dbRonda2, setDbRonda2] = useState([]);
  const [dbGeneral, setDbGeneral] = useState([]);
  const [marcadorInfo, setMarcadorInfo] = useState(null);

  // ESTADO UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pulse, setPulse] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("clasificacion");
  const [showIndividualNotice, setShowIndividualNotice] = useState(true);
  const [scoringTeamFilter, setScoringTeamFilter] = useState("");
  const [scoringPlayer, setScoringPlayer] = useState(null);

  useEffect(() => {
    if (activeTab !== "clasificacion" || scoringPlayer !== null) {
      setShowIndividualNotice(false);
    }
  }, [activeTab, scoringPlayer]);
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

  // DATOS
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

  // PUNTUACIONES
  const lastScoringRef = useRef("");
  useEffect(() => {
    const key = `${scoringPlayer?.Jugador}-${scoringRound}`;
    if (scoringPlayer && key !== lastScoringRef.current) {
      lastScoringRef.current = key;
      const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
      const roundPlayerData = activeDb.find(
        (p) => p.Jugador === scoringPlayer.Jugador,
      );
      const parRow = roundPlayerData
        ? activeDb.find((p) => p.Jugador === roundPlayerData._parName)
        : null;

      const initial = {};
      const holes = Array.from({ length: 18 }, (_, i) => i + 1);
      holes.forEach((h) => {
        initial[h] = {
          par: parRow && parRow[h] !== undefined ? parRow[h] : "",
          golpes:
            roundPlayerData && roundPlayerData[h] !== undefined
              ? roundPlayerData[h]
              : "",
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

  const applyOptimisticUpdate = (
    jugadorName,
    ronda,
    nuevosGolpes,
    nuevosPares,
  ) => {
    const updateFn = (prevDb) => {
      const newDb = [...prevDb];
      const pIdx = newDb.findIndex((p) => p.Jugador === jugadorName);
      if (pIdx !== -1) {
        newDb[pIdx] = { ...newDb[pIdx], ...nuevosGolpes };

        if (nuevosPares) {
          const parName =
            newDb[pIdx]._parName || `PAR ${String(jugadorName).toUpperCase()}`;
          const parIdx = newDb.findIndex((p) => p.Jugador === parName);
          if (parIdx !== -1) {
            newDb[parIdx] = { ...newDb[parIdx], ...nuevosPares };
          }
        }
      }
      return newDb;
    };

    if (ronda === "Ronda 1") {
      setDbRonda1(updateFn);
    } else {
      setDbRonda2(updateFn);
    }
  };

  const saveScores = async () => {
    if (!scoringPlayer) return;
    setIsSaving(true);
    let nuevosGolpes = {};
    let nuevosPares = {};
    Object.keys(scoringData).forEach((hole) => {
      let val = scoringData[hole].golpes;
      if (val === "0" || val === 0) val = "R";
      nuevosGolpes[hole] = val;
      nuevosPares[hole] = scoringData[hole].par;
    });

    const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
    const roundPlayerData = activeDb.find(
      (p) => p.Jugador === scoringPlayer.Jugador,
    );
    const parName =
      roundPlayerData?._parName ||
      `PAR ${String(scoringPlayer.Jugador).toUpperCase()}`;

    const paqueteGolpes = {
      jugador: scoringPlayer.Jugador,
      ronda: scoringRound,
      golpes: nuevosGolpes,
    };
    const paquetePares = {
      jugador: parName,
      ronda: scoringRound,
      golpes: nuevosPares,
    };

    applyOptimisticUpdate(
      scoringPlayer.Jugador,
      scoringRound,
      nuevosGolpes,
      nuevosPares,
    );
    setActiveTab("clasificacion");
    setIsSaving(false);
    lastScoringRef.current = "";

    if (!navigator.onLine) {
      const qs = [...syncQueue, paqueteGolpes, paquetePares];
      setSyncQueue(qs);
      localStorage.setItem("sync_queue", JSON.stringify(qs));
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

    Promise.all([enviarDatos(paqueteGolpes), enviarDatos(paquetePares)]).then(
      () => fetchData(),
    );
  };

  const resetScores = async () => {
    if (!scoringPlayer) return;
    const confirmReset = window.confirm(
      `⚠️ ¿Borrar todos los golpes de ${scoringPlayer._CleanName || scoringPlayer.Jugador} en ${scoringRound}?`,
    );
    if (!confirmReset) return;

    setIsSaving(true);
    let golpesVacios = {};
    for (let i = 1; i <= 18; i++) golpesVacios[i] = "";

    const paqueteReset = {
      jugador: scoringPlayer.Jugador,
      ronda: scoringRound,
      golpes: golpesVacios,
    };

    applyOptimisticUpdate(
      scoringPlayer.Jugador,
      scoringRound,
      golpesVacios,
      null,
    );
    setActiveTab("clasificacion");
    setIsSaving(false);
    lastScoringRef.current = "";

    if (!navigator.onLine) {
      const qs = [...syncQueue, paqueteReset];
      setSyncQueue(qs);
      localStorage.setItem("sync_queue", JSON.stringify(qs));
      return;
    }

    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(paqueteReset),
      headers: { "Content-Type": "text/plain" },
    })
      .then(() => fetchData())
      .catch(() => { });
  };

  // SINCRONIZACIÓN (API)
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

      const hash = JSON.stringify({
        r1: raw1,
        r2: raw2,
        rg: rawGen,
        rm: rawMarcador,
      });
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
          setError(null);
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
    const goOnline = () => {
      setIsOffline(false);
      flushQueue();
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if (navigator.onLine) flushQueue();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    let intervalId;

    const startPolling = () => {
      fetchData();
      intervalId = setInterval(fetchData, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // CLASIFICACIONES
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

      let isOnFire = false;
      const r2Played = p._cleanR2 !== "-" && p._r2Data;
      const activeData = r2Played ? p._r2Data : p._r1Data;
      const activeDb = r2Played ? dbRonda2 : dbRonda1;
      const parRow = activeDb.find((r) => r.Jugador === activeData?._parName);

      if (activeData && parRow) {
        isOnFire = checkIfOnFire(activeData, parRow);
      }

      return {
        ...p,
        _puntosDia1: ptsR1,
        _puntosDia2: ptsR2,
        _puntosIndivTotal: ptsTot,
        _onFire: isOnFire,
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
  const playersBase = sortedPlayers.map((p, i) => {
    const score = p._totalScore;
    const hcp = p._hcpGuardado;

    if (score !== lastScore || hcp !== lastHcp) {
      currentRank = i + 1;
    }
    lastScore = score;
    lastHcp = hcp;
    return { ...p, _rank: currentRank };
  });

  const allFinished =
    playersBase.length > 0 &&
    playersBase.every((p) => {
      const h = p.Hoyo || p.HOYO;
      return h === "F" || h === "18" || h === 18;
    });

  const players = playersBase.map((p, i) => ({
    ...p,
    _woodenSpoon: allFinished
      ? i === playersBase.length - 1
      : i >= playersBase.length - 4,
  }));

  const equiposUnicosMatch = [
    ...new Set(
      players.map((p) => p.EQUIPO).filter((e) => e && e.trim() !== ""),
    ),
  ];

  let matchPlayHtml = "";

  let sumaTotalFly = 0;
  let sumaTotalCar = 0;
  let matchPlayPuntosFly = 0;
  let matchPlayPuntosCar = 0;

  if (marcadorInfo && Array.isArray(marcadorInfo)) {
    let html = [];
    const seenMatches = new Set();

    for (let i = 0; i < marcadorInfo.length; i++) {
      const row = marcadorInfo[i];

      const pFly = String(row.FLYING || row.FLY || "").trim();
      const pCar = String(row.SLICE || row.CAR || "").trim();

      if (!pFly || !pCar) continue;
      const pFlyUpper = pFly.toUpperCase();
      const pCarUpper = pCar.toUpperCase();
      if (pFlyUpper.includes("FLYING") || pFlyUpper.includes("TOTAL")) continue;
      if (pCarUpper.includes("SLICE") || pCarUpper.includes("TOTAL")) continue;

      const matchKey = [pFlyUpper, pCarUpper].sort().join("-");
      if (seenMatches.has(matchKey)) continue;

      if (html.length >= 5) break;

      seenMatches.add(matchKey);
      const flyPts = Number(row["TOTAL FLY"]) || 0;
      const carPts = Number(row["TOTAL CAR"] || row["TOTAL SLICE"]) || 0;
      const flyStableford =
        row["STABLEFOR FLYING"] ||
        row["STABLEFOR"] ||
        row["STABLEFORD FLYING"] ||
        row["STABLEFORD"];
      const carStableford =
        row["STABLEFOR SLICE"] ||
        row["STABLEFOR_1"] ||
        row["STABLEFORD SLICE"] ||
        row["STABLEFORD_1"];
      const pFlyData = players.find((p) =>
        (p._CleanName || p.Jugador || "").toUpperCase().includes(pFlyUpper),
      );
      const pCarData = players.find((p) =>
        (p._CleanName || p.Jugador || "").toUpperCase().includes(pCarUpper),
      );
      const flyDisplayScore =
        flyStableford !== undefined && flyStableford !== ""
          ? flyStableford
          : pFlyData
            ? pFlyData._totalScore
            : "?";
      const carDisplayScore =
        carStableford !== undefined && carStableford !== ""
          ? carStableford
          : pCarData
            ? pCarData._totalScore
            : "?";

      const flyNum = html.length + 1;
      const winner = flyPts > carPts ? "fly" : carPts > flyPts ? "car" : "draw";

      if (winner === "fly") {
        matchPlayPuntosFly += 2;
      } else if (winner === "car") {
        matchPlayPuntosCar += 2;
      } else {
        matchPlayPuntosFly += 1;
        matchPlayPuntosCar += 1;
      }

      html.push(
        `<div class='match-card' style='margin-bottom: 6px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.2);'>
          <div style='display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;'>
            <span style='font-size: 9px; color: var(--text2); font-weight: 800; letter-spacing: 0.05em;'>FLY ${flyNum}</span>
            <span style='font-size: 11px; font-weight: 900; text-align: center; color: ${winner === "draw" ? "var(--text2)" : winner === "fly" ? "var(--blue)" : "#e67e22"}; text-transform: uppercase; letter-spacing: 0.5px;'>
              ${winner === "draw" ? "— EMPATE —" : "🏆 GANADOR " + (winner === "fly" ? "FLY" : "SLICE")}
            </span>
            <span></span>
          </div>
          <div style='display: flex; align-items: center; justify-content: space-between; gap: 10px;'>
            <div style='flex: 1; display: flex; flex-direction: column; align-items: flex-start;'>
              <span style='color:${winner === "fly" ? "var(--blue)" : "var(--text)"}; font-weight: ${winner === "fly" ? "800" : "600"}; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;'>${pFly}</span>
              <span style='font-size: 11px; color: var(--text2); font-weight: 500;'>${flyDisplayScore} pts</span>
            </div>
            <div style='font-weight: 900; color: var(--text2); font-size: 12px; opacity: 0.3; font-style: italic;'>VS</div>
            <div style='flex: 1; display: flex; flex-direction: column; align-items: flex-end;'>
              <span style='color:${winner === "car" ? "#e67e22" : "var(--text)"}; font-weight: ${winner === "car" ? "800" : "600"}; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;'>${pCar}</span>
              <span style='font-size: 11px; color: var(--text2); font-weight: 500;'>${carDisplayScore} pts</span>
            </div>
          </div>
          <div style='margin-top: 10px; display: flex; justify-content: center; gap: 15px;'>
            ${winner === "draw"
          ? `
              <div style='display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; background: rgba(91, 196, 216, 0.1); border: 1px solid rgba(91, 196, 216, 0.2);'>
                <span style='font-size: 10px; color: var(--blue); font-weight: 800;'>FLYING +1</span>
              </div>
              <div style='display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; background: rgba(230, 126, 34, 0.1); border: 1px solid rgba(230, 126, 34, 0.2);'>
                <span style='font-size: 10px; color: #e67e22; font-weight: 800;'>SLICE +1</span>
              </div>
            `
          : winner === "fly"
            ? `
              <div style='display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; background: rgba(91, 196, 216, 0.1); border: 1px solid rgba(91, 196, 216, 0.2);'>
                <span style='font-size: 11px; color: var(--blue); font-weight: 900;'>FLYING +2</span>
              </div>
            `
            : `
              <div style='display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; background: rgba(230, 126, 34, 0.1); border: 1px solid rgba(230, 126, 34, 0.2);'>
                <span style='font-size: 11px; color: #e67e22; font-weight: 900;'>SLICE +2</span>
              </div>
            `
        }
          </div>
        </div>`,
      );
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

      const isFlyingTeam = eqNameUpper.includes("FLYING") || eqNameUpper.includes("CARAJILLOS");
      const isCarabassaTeam = eqNameUpper.includes("SLICE") || eqNameUpper.includes("CARABASSA");

      if (isFlyingTeam) {
        teamR2 += matchPlayPuntosFly;
        totalPuntos = (sumaTotalFly > 0)
          ? sumaTotalFly
          : (puntosIndivTotal + matchPlayPuntosFly);
      } else if (isCarabassaTeam) {
        teamR2 += matchPlayPuntosCar;
        totalPuntos = (sumaTotalCar > 0)
          ? sumaTotalCar
          : (puntosIndivTotal + matchPlayPuntosCar);
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

  // RENDERIZADO
  return (
    <div className="app">
      <AppHeader
        appLogo={appLogo}
        currentRound={currentRound}
        players={players}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isOffline={isOffline}
        error={error}
        pulse={pulse}
        isSyncing={isSyncing}
        syncQueue={syncQueue}
        lastUpdate={lastUpdate}
      />

      {/* MODAL DE IMAGEN DEL HOYO */}
      {selectedHoleInfo &&
        (() => {
          const currentRoundView =
            activeTab === "anotar" ? scoringRound : activeHoleRound;
          const isRonda1 = currentRoundView === "Ronda 1";
          const imagePath = isRonda1
            ? `/images/hoyos/ronda1/hoyo${selectedHoleInfo}.png`
            : `/images/hoyos/ronda2/hoyo${selectedHoleInfo}.jpg`;

          return (
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

                {/* Título actualizado para indicar la ronda */}
                <h3>
                  Información Hoyo {selectedHoleInfo} - {isRonda1 ? "R1" : "R2"}
                </h3>

                <img
                  src={imagePath}
                  alt={`Mapa del Hoyo ${selectedHoleInfo}`}
                  className="hole-map-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Imagen+No+Disponible";
                  }}
                />
              </div>
            </div>
          );
        })()}

      <main className="main">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Cargando datos…</span>
          </div>
        ) : error && dbGeneral.length === 0 ? (
          <div className="error-box">
            <span className="error-icon">!</span>
            <div>
              <p className="error-title">Error al cargar</p>
              <p className="error-msg">{error}</p>
              <button
                onClick={() => fetchData()}
                className="tab-btn"
                style={{ marginTop: "10px" }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {isOffline && (
              <div
                style={{
                  background: "rgba(255, 165, 0, 0.1)",
                  border: "1px solid orange",
                  color: "orange",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                ⚠️ Estás en modo sin conexión. Los datos mostrados pueden no
                estar actualizados.
              </div>
            )}
            {activeTab === "clasificacion" && (
              <IndividualStandings
                players={players}
                activeHoleRound={activeHoleRound}
                setActiveHoleRound={setActiveHoleRound}
                dbRonda1={dbRonda1}
                dbRonda2={dbRonda2}
                showIndividualNotice={showIndividualNotice}
                setSelectedPlayer={(jugador) => {
                  setScoringPlayer(jugador);
                  setActiveTab("anotar");
                }}
              />
            )}

            {activeTab === "equipos" && (
              <TeamStandings
                equiposData={equiposData}
                maxPuntosEquipos={maxPuntosEquipos}
                expandedTeam={expandedTeam}
                setExpandedTeam={setExpandedTeam}
                accordionRound={accordionRound}
                setAccordionRound={setAccordionRound}
                selectedHoleInfo={selectedHoleInfo}
                setSelectedHoleInfo={setSelectedHoleInfo}
                dbRonda1={dbRonda1}
                dbRonda2={dbRonda2}
                matchPlayHtml={matchPlayHtml}
              />
            )}

            {activeTab === "anotar" && (
              <PlayerModal
                equiposUnicosMatch={equiposUnicosMatch}
                scoringTeamFilter={scoringTeamFilter}
                setScoringTeamFilter={setScoringTeamFilter}
                scoringPlayer={scoringPlayer}
                setScoringPlayer={setScoringPlayer}
                players={players}
                resetScores={resetScores}
                saveScores={saveScores}
                isSaving={isSaving}
                scoringRound={scoringRound}
                setScoringRound={setScoringRound}
                scoringData={scoringData}
                dbRonda1={dbRonda1}
                dbRonda2={dbRonda2}
                setSelectedHoleInfo={setSelectedHoleInfo}
                handleScoreChange={handleScoreChange}
              />
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
