import { useState, useEffect, useRef } from "react";
import "./App.css";

import appLogo from "./the-golfos-on-tour-2026-logo.ico";
import imgFlyingCarajillos from "./flying-carajillos.png";
import imgCarabassaSlice from "./carabassa-slice.jpeg";

import { API_URL, POLL_INTERVAL, TEAM_CAPTAINS, TEAM_AVATAR_IMAGES } from "./utils/constants";
import { getInitials, getScoreClass, isRealPlayer, checkIfOnFire } from "./utils/helpers";
import { RankBadge, ResultadoBadge } from "./components/UIComponents";
import PlayerRow from "./components/PlayerRow";
import PlayerModal from "./components/PlayerModal";

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

  const applyOptimisticUpdate = (jugadorName, ronda, nuevosGolpes, nuevosPares) => {
    const updateFn = (prevDb) => {
      const newDb = [...prevDb];
      const pIdx = newDb.findIndex((p) => p.Jugador === jugadorName);
      if (pIdx !== -1) {
        newDb[pIdx] = { ...newDb[pIdx], ...nuevosGolpes };

        if (nuevosPares) {
          const parName = newDb[pIdx]._parName || `PAR ${String(jugadorName).toUpperCase()}`;
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
      nuevosGolpes[hole] = scoringData[hole].golpes;
      nuevosPares[hole] = scoringData[hole].par;
    });

    const activeDb = scoringRound === "Ronda 1" ? dbRonda1 : dbRonda2;
    const roundPlayerData = activeDb.find((p) => p.Jugador === scoringPlayer.Jugador);
    const parName = roundPlayerData?._parName || `PAR ${String(scoringPlayer.Jugador).toUpperCase()}`;

    const paqueteGolpes = { jugador: scoringPlayer.Jugador, ronda: scoringRound, golpes: nuevosGolpes };
    const paquetePares = { jugador: parName, ronda: scoringRound, golpes: nuevosPares };

    applyOptimisticUpdate(scoringPlayer.Jugador, scoringRound, nuevosGolpes, nuevosPares);
    setActiveTab("clasificacion");
    setIsSaving(false);

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

    Promise.all([
      enviarDatos(paqueteGolpes),
      enviarDatos(paquetePares),
    ]).then(() => fetchData());
  };

  const resetScores = async () => {
    if (!scoringPlayer) return;
    const confirmReset = window.confirm(`⚠️ ¿Borrar todos los golpes de ${scoringPlayer._CleanName || scoringPlayer.Jugador} en ${scoringRound}?`);
    if (!confirmReset) return;

    setIsSaving(true);
    let golpesVacios = {};
    for (let i = 1; i <= 18; i++) golpesVacios[i] = "";

    const paqueteReset = { jugador: scoringPlayer.Jugador, ronda: scoringRound, golpes: golpesVacios };

    applyOptimisticUpdate(scoringPlayer.Jugador, scoringRound, golpesVacios, null);
    setActiveTab("clasificacion");
    setIsSaving(false);

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

    if (navigator.onLine) flushQueue();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
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
      const parRow = activeDb.find(r => r.Jugador === activeData?._parName);

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

  const allFinished = playersBase.length > 0 && playersBase.every(p => {
    const h = p.Hoyo || p.HOYO;
    return h === "F" || h === "18" || h === 18;
  });

  const players = playersBase.map((p, i) => ({
    ...p,
    _woodenSpoon: allFinished ? (i === playersBase.length - 1) : (i >= playersBase.length - 4)
  }));

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
              <span style='color:#e67e22; font-weight:bold;'>SLICE +${carPts}</span> 
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
                <br><span style='color:#e67e22; font-weight:bold;'>SLICE +${carPts}</span>
              </li>`,
            );
          } else {
            html.push(
              `<li>
                <b>Fly ${flyNum}:</b> <b>Empate</b> entre <span style='color:var(--blue)'>${pFly}</span> (${flyScore} pts) y <span style='color:#e67e22'>${pCar}</span> (${carScore} pts). 
                <br><span style='color:var(--text2); font-weight:bold;'>FLYING +1 | SLICE +1</span>
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
                                        className="hole-num score-box"
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
                                              <span key={h} className="score-box">{pVal || "-"}</span>
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
                                              className={`score-box ${scoreClass}`}
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