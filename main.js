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
let currentAmount = 0;
const goalAmount = 12000;

function updateProgress() {
  const progressBar = document.getElementById("progress-bar");
  const amountText = document.getElementById("amount");
  const goalText = document.getElementById("goal");
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (amountText) amountText.textContent = Math.round(currentAmount);
  if (goalText) goalText.textContent = goalAmount;
}

updateProgress();

// ===============================
// 🗺️ MAPBOX CONFIG
// ===============================

// 👉 Pega tu token real aquí
mapboxgl.accessToken = "pk.eyJ1IjoiZ2lzZWFyZXMiLCJhIjoiY21oYXU5OG04MDZvNDJqb2E0cXFidXlucSJ9.erbNCAu8XPNxP_jndhJmmQ";

const startPoint = [-96.13208487843347, 19.206145084180147]; // Veracruz
let routeMeta = null;
let lastDonorCoord = null; // Guardar última donación

const map = new mapboxgl.Map({
  container: "map",
  // style: "mapbox://styles/mapbox/light-v11",
  style: "mapbox://styles/mapbox/outdoors-v12",
  center: startPoint,
  zoom: 3,
  pitch: 40,
  bearing: -10,
});

map.setProjection('mercator');

// ===============================
// 🧭 FUNCIONES AUXILIARES
// ===============================

function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const R = 6371; // km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildRouteMeta(routeCoords) {
  const segmentKm = [];
  const cumulativeKm = [0];
  let totalKm = 0;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const km = haversineDistance(routeCoords[i], routeCoords[i + 1]);
    segmentKm.push(km);
    totalKm += km;
    cumulativeKm.push(totalKm);
  }

  return {
    coords: routeCoords,
    segmentKm,
    cumulativeKm,
    totalKm,
  };
}

function interpolateOnRoute(meta, targetKm) {
  if (!meta || meta.coords.length === 0) return null;
  if (targetKm <= 0) return meta.coords[0];
  if (targetKm >= meta.totalKm) return meta.coords[meta.coords.length - 1];

  const { coords, segmentKm, cumulativeKm } = meta;

  let index = 0;
  for (let i = 0; i < segmentKm.length; i++) {
    if (targetKm <= cumulativeKm[i + 1]) {
      index = i;
      break;
    }
  }

  const spanKm = segmentKm[index];
  if (spanKm === 0) return coords[index + 1];

  const kmIntoSegment = targetKm - cumulativeKm[index];
  const t = kmIntoSegment / spanKm;
  const [lon1, lat1] = coords[index];
  const [lon2, lat2] = coords[index + 1];

  const lon = lon1 + (lon2 - lon1) * t;
  const lat = lat1 + (lat2 - lat1) * t;

  return [lon, lat];
}


// ===============================
// 🗺️ CARGAR RUTA BASE DESDE route.json
// ===============================
async function loadRoute() {
  try {
    const res = await fetch("./route.json");
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

    routeMeta = buildRouteMeta(data.geometry.coordinates);
    console.log(`🛰️ Ruta cargada: ${(routeMeta.totalKm).toFixed(0)} km totales`);

    return routeMeta;
  } catch (err) {
    console.error("⚠️ Error al cargar la ruta:", err);
    return null;
  }
}

// ===============================
// 👥 RENDERIZAR DONANTES SOBRE LA RUTA
// ===============================
function renderDonors(donors, meta) {
  if (!meta) return;

  let coveredKm = 0;

  donors.forEach((d, index) => {
    const startKm = coveredKm;
    coveredKm = Math.min(meta.totalKm, coveredKm + d.km);
    const endKm = coveredKm;

    const coordStart = interpolateOnRoute(meta, startKm);
    const coordEnd = interpolateOnRoute(meta, endKm);
    if (!coordStart || !coordEnd) return;

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
            💬 "${d.comentario || ""}"<br>
            <small>${d.instagram || ""}</small>
          </div>
        `)
      )
      .addTo(map);

    // Guardar última donación para el botón "your location"
    lastDonorCoord = coordEnd;
  });

  // PIN final (meta Alaska)
  new mapboxgl.Marker({ color: "#00A1B2", scale: 1.5 })
    .setLngLat(meta.coords[meta.coords.length - 1])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; text-align:center;">
          <strong>🎯 ¡Meta a cumplir!</strong><br>
          <small>Alaska, destino final 🚐❄️</small>
        </div>
      `)
    )
    .addTo(map);

  // PIN inicial (Veracruz)
  new mapboxgl.Marker({ color: "#81e145", scale: 1.3 })
    .setLngLat(meta.coords[0])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; text-align:center;">
          <strong>🚀 Punto de partida</strong><br>
          <small>Puerto de México</small>
        </div>
      `)
    )
    .addTo(map);
}

// ===============================
// 📦 CARGAR DONANTES DESDE donors.json
// ===============================

// ===============================
// 📦 CARGAR DONANTES DESDE GOOGLE SHEETS (CSV PUBLICADO)
// ===============================
async function loadDonors(meta) {
  try {
    // 🔗 tu hoja publicada como CSV
    const csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRs1Uaxst3FPVy-fes1NZrdXSP6SxZYIc-dLNBw2w3Ijh0YPyJON0WfnOimogZcMXDesyAKCgrcsm64/pub?output=csv";

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("No se pudo cargar el CSV de donantes");

    const csvText = await response.text();

    // 🧩 parsear CSV con PapaParse (debe estar cargado en index.html antes de main.js)
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    let donors = parsed.data;

    // 🧮 limpiar y convertir campos
    donors = donors
      .filter((d) => d.nombre && d.km) // solo filas válidas
      .map((d) => ({
        ...d,
        km: parseFloat(d.km) || 0,
        fecha_donacion: d.fecha_donacion ? new Date(d.fecha_donacion) : new Date(),
      }));

    // 🗓️ ordenar por fecha de donación
    donors.sort((a, b) => a.fecha_donacion - b.fecha_donacion);

    console.log(`✅ ${donors.length} donantes cargados desde Google Sheets`);
    console.table(donors.slice(0, 5));

    renderDonors(donors, meta);

    const totalKm = donors.reduce((sum, donor) => sum + donor.km, 0);
    currentAmount = totalKm;
    updateProgress();
  } catch (err) {
    console.error("⚠️ Error al cargar donantes:", err);
  }
}



// ===============================
// 📍 BOTÓN "YOUR LOCATION" (última donación)
// ===============================
function addLocationButton() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  // Crear contenedor del botón
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 10;
  `;

  // Crear botón
  const btn = document.createElement("button");
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"></circle>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6M12 17v6M23 12h-6M1 12h6"></path>
    </svg>
  `;
  btn.style.cssText = `
    width: 44px;
    height: 44px;
    border: 2px solid #FB8500;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    color: #FB8500;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#FB8500";
    btn.style.color = "white";
    btn.style.boxShadow = "0 4px 12px rgba(251, 133, 0, 0.3)";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.background = "white";
    btn.style.color = "#FB8500";
  });

  // Click: centrar en última donación
  btn.addEventListener("click", () => {
    if (lastDonorCoord) {
      map.flyTo({
        center: lastDonorCoord,
        zoom: 6,
        duration: 1000,
        pitch: 40,
        bearing: -10,
      });
    } else {
      alert("Aún no hay donaciones registradas en el mapa 🚐");
    }
  });

  buttonContainer.appendChild(btn);
  mapContainer.appendChild(buttonContainer);
}

// ===============================
// 🗺️ CUANDO EL MAPA ESTÉ LISTO
// ===============================
map.on("load", async () => {
  updateProgress(); // estado inicial
  const meta = await loadRoute(); // Carga la ruta real
  if (meta && meta.coords.length > 0) {
    await loadDonors(meta); // Carga los donantes sobre esa ruta
  }
  addLocationButton(); // Agregar botón de ubicación
});
