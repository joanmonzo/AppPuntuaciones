import imgFlyingCarajillos from "../flying-carajillos.jpeg";
import imgCarabassaSlice from "../carabassa-slice.jpeg";

export const API_URL = "https://script.google.com/macros/s/AKfycbx0hO-6xi53Siyr86zYkBPSVF2hKaYEgRw0Y-IjvjS5I1EOpegSj498XHQZr0xEqhXcfA/exec";
export const POLL_INTERVAL = 5000;

export const TEAM_CAPTAINS = {
  "FLYING CARAJILLOS": "Paco",
  "CARABASSA SLICE FOCKERS": "Quique",
  "CARABASSA SLICE": "Quique",
};

export const AVATAR_COLORS = [
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

export const TEAM_AVATAR_IMAGES = {
  "FLYING CARAJILLOS": imgFlyingCarajillos,
  "CARABASSA SLICE FOCKERS": imgCarabassaSlice,
};
