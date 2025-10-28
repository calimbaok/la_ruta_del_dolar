/********************************************
 * 🚐 La Ruta del Dólar — main.js
 * ------------------------------------------
 * - Barra de progreso
 * - Donar (modo demo)
 * - Mapa Mapbox (Ushuaia → Alaska)
 * - Ruta real desde route.json
 * - Donantes dinámicos desde donors.json
 ********************************************/

// ===============================
// 💰 PROGRESO DE DONACIONES
// ===============================
let currentAmount = 2300;
const goalAmount = 10000;

function updateProgress() {
  const progressBar = document.getElementById("progress-bar");
  const amountText = document.getElementById("amount");
  const percentage = (currentAmount / goalAmount) * 100;
  progressBar.style.width = `${percentage}%`;
  amountText.textContent = currentAmount;
}

document.getElementById("donateBtn")?.addEventListener("click", () => {
  currentAmount += 10;
  if (currentAmount > goalAmount) currentAmount = goalAmount;
  updateProgress();
  alert("Gracias por tu aporte 💚 (modo demo)");
});

updateProgress();

// ===============================
// 🗺️ MAPBOX CONFIG
// ===============================

// 👉 Pega tu token real aquí
mapboxgl.accessToken = "pk.eyJ1IjoiZ2lzZWFyZXMiLCJhIjoiY21oYXU5OG04MDZvNDJqb2E0cXFidXlucSJ9.erbNCAu8XPNxP_jndhJmmQ";

const startPoint = [-89.05357708098363, 17.13327079139753]; // Guatemala
const endPoint = [-140.80787664081618, 62.45233739158741]; // Alaska

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: startPoint,
  zoom: 3,
  pitch: 40,
  bearing: -10,
});

// ===============================
// 🧭 FUNCIONES AUXILIARES
// ===============================

// Interpolación simple sobre la ruta (avanza punto a punto)
function interpolateOnRoute(routeCoords, fraction) {
  const totalSegments = routeCoords.length - 1;
  const segmentIndex = Math.min(
    Math.floor(fraction * totalSegments),
    totalSegments - 1
  );
  return routeCoords[segmentIndex];
}

// ===============================
// 🗺️ CARGAR RUTA BASE DESDE route.json
// ===============================
async function loadRoute() {
  try {
    const res = await fetch("route.json");
    if (!res.ok) throw new Error("No se pudo cargar route.json");
    const data = await res.json();

    map.addSource("ruta-completa", { type: "geojson", data });
    map.addLayer({
      id: "ruta-completa",
      type: "line",
      source: "ruta-completa",
      paint: {
        "line-color": "rgba(0,0,0,0.25)",
        "line-width": 2,
        "line-dasharray": [3, 2],
      },
    });

    return data.geometry.coordinates;
  } catch (err) {
    console.error("⚠️ Error al cargar la ruta:", err);
    return [];
  }
}

// ===============================
// 👥 RENDERIZAR DONANTES SOBRE LA RUTA
// ===============================
function renderDonors(donors, routeCoords) {
  let totalKm = 0;

  donors.forEach((d, index) => {
    const fractionStart = totalKm / goalAmount;
    totalKm += d.km;
    const fractionEnd = totalKm / goalAmount;

    const coordStart = interpolateOnRoute(routeCoords, fractionStart);
    const coordEnd = interpolateOnRoute(routeCoords, fractionEnd);

    const route = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [coordStart, coordEnd] },
      properties: { nombre: d.nombre },
    };

    // Línea del tramo
    map.addSource(`route-${index}`, { type: "geojson", data: route });
    map.addLayer({
      id: `route-${index}`,
      type: "line",
      source: `route-${index}`,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#FB8500",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    // Marcador con popup
    new mapboxgl.Marker({ color: "#FFB703", scale: 1.2 })
      .setLngLat(coordEnd)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: sans-serif; line-height:1.4;">
            <strong>${d.nombre}</strong><br>
            🚐 ${d.km} km donados<br>
            💬 “${d.comentario || ""}”<br>
            <small>${d.instagram || ""}</small>
          </div>
        `)
      )
      .addTo(map);
  });

  // PIN final (meta Alaska)
  new mapboxgl.Marker({ color: "#00A1B2", scale: 1.5 })
    .setLngLat(endPoint)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; text-align:center;">
          <strong>🎯 ¡Meta a cumplir!</strong><br>
          <small>Alaska, destino final 🚐❄️</small>
        </div>
      `)
    )
    .addTo(map);

  // PIN inicial (Guatemala)
  new mapboxgl.Marker({ color: "#81e145", scale: 1.3 })
    .setLngLat(startPoint)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; text-align:center;">
          <strong>🚀 Punto de partida</strong><br>
          <small>Petén, Guatemala</small>
        </div>
      `)
    )
    .addTo(map);
}

// ===============================
// 📦 CARGAR DONANTES DESDE donors.json
// ===============================
async function loadDonors(routeCoords) {
  try {
    const response = await fetch("donors.json");
    if (!response.ok) throw new Error("No se pudo cargar donors.json");
    const donors = await response.json();
    renderDonors(donors, routeCoords);
  } catch (err) {
    console.error("⚠️ Error al cargar donantes:", err);
  }
}

// ===============================
// 🗺️ CUANDO EL MAPA ESTÉ LISTO
// ===============================
map.on("load", async () => {
  const routeCoords = await loadRoute(); // Carga la ruta real
  if (routeCoords.length > 0) {
    await loadDonors(routeCoords); // Carga los donantes sobre esa ruta
  }
});
