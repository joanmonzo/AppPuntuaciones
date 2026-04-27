/** Iniciales */
export function getInitials(name) {
  if (!name) return "?";
  return String(name)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Diferencia de golpes respecto al par */
export function getScoreClass(strokes, par) {
  if (!strokes || !par || strokes === "" || strokes === "R") return "";
  const s = Number(strokes);
  const p = Number(par);
  if (isNaN(s) || isNaN(p) || s <= 0) return "";

  const diff = s - p;

  if (s === 1 || diff <= -3) return "score-albatross";
  if (diff === -2) return "score-eagle";
  if (diff === -1) return "score-birdie";
  if (diff === 0) return "score-par";
  if (diff === 1) return "score-bogey";
  if (diff === 2) return "score-double";
  return "score-triple";
}

/** Birdies o mejor en los últimos 2 hoyos */
export function checkIfOnFire(playerData, parData) {
  if (!playerData || !parData) return false;

  let completedHoles = [];
  for (let i = 1; i <= 18; i++) {
    const strokes = playerData[i];
    if (strokes !== undefined && strokes !== null && strokes !== "") {
      completedHoles.push({ strokes: Number(strokes), par: Number(parData[i]) });
    }
  }

  if (completedHoles.length < 2) return false;

  const lastTwo = completedHoles.slice(-2);
  return lastTwo.every((h) => !isNaN(h.strokes) && !isNaN(h.par) && h.strokes < h.par);
}

/** Jugadores reales */
export function isRealPlayer(p) {
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