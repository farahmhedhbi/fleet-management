import L from "leaflet";

function buildSvg(color: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24">
      <path
        d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"
        fill="${color}"
        stroke="white"
        stroke-width="1.4"
      />
      <circle cx="12" cy="9" r="3.1" fill="white"/>
    </svg>
  `;
}

function createMarkerIcon(color: string) {
  return L.icon({
    iconUrl:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(buildSvg(color)),
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

export const movingMarkerIcon = createMarkerIcon("#10b981");
export const completedMarkerIcon = createMarkerIcon("#3b82f6");
export const dangerMarkerIcon = createMarkerIcon("#ef4444");
export const stoppedMarkerIcon = createMarkerIcon("#f59e0b");
export const offlineMarkerIcon = createMarkerIcon("#64748b");
export const defaultMarkerIcon = createMarkerIcon("#0f172a");