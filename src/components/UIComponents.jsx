import React from "react";

export function RankBadge({ rank, showMedal = true }) {
  let medalClass = "standard";
  if (showMedal) {
    if (rank === 1) medalClass = "gold";
    if (rank === 2) medalClass = "silver";
    if (rank === 3) medalClass = "bronze";
  }

  return <span className={`golf-ball-badge ${medalClass}`}>{rank}</span>;
}

export function ResultadoBadge({ valor }) {
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
