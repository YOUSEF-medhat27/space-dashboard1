
const NASA_API_KEY = "DEMO_KEY"; 
const APOD_URL = "https://api.nasa.gov/planetary/apod";
const LAUNCHES_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=detailed";
const PLANET_URL_BASE = "https://api.le-systeme-solaire.net/rest.php/bodies/";

const PLANET_IDS = ["mercury", "venus", "terre", "mars", "jupiter", "saturne", "uranus", "neptune"];
const PLANET_ID_MAP = {
  mercury: "mercury",
  venus: "venus",
  earth: "terre",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturne",
  uranus: "uranus",
  neptune: "neptune",
};

function todayISO() {

    let date = new Date();

    let isoDate = date.toISOString();

    let today = isoDate.split("T")[0];

    return today;
}
// =========================================================
// Sidebar / Navigation
// =========================================================
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".app-section");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;

      sections.forEach((s) => s.classList.toggle("hidden", s.dataset.section !== target));

      navLinks.forEach((l) => {
        l.classList.remove("bg-blue-500/10", "text-blue-400");
        l.classList.add("text-slate-300");
      });
      link.classList.add("bg-blue-500/10", "text-blue-400");
      link.classList.remove("text-slate-300");

      // close sidebar on mobile after navigating
      document.getElementById("sidebar")?.classList.remove("sidebar-open");
      document.getElementById("sidebar-overlay")?.remove();

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("sidebar-open");

    if (isOpen) {
      const overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.className = "sidebar-overlay lg:hidden";
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("sidebar-open");
        overlay.remove();
      });
      document.body.appendChild(overlay);
    } else {
      document.getElementById("sidebar-overlay")?.remove();
    }
  });
}

// =========================================================
// APOD - Today in Space
// =========================================================
function setApodLoading(isLoading) {
  const loadingEl = document.getElementById("apod-loading");
  const imgEl = document.getElementById("apod-image");
  if (!loadingEl || !imgEl) return;
  loadingEl.classList.toggle("hidden", !isLoading);
  imgEl.classList.toggle("hidden", isLoading);
}

async function fetchApod(dateStr) {
  setApodLoading(true);
  try {
    const url = `${APOD_URL}?api_key=${NASA_API_KEY}&date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`APOD request failed: ${res.status}`);
    const data = await res.json();
    renderApod(data);
  } catch (err) {
    console.error("Failed to load APOD:", err);
    const explanation = document.getElementById("apod-explanation");
    if (explanation) {
      explanation.textContent = "Couldn't load today's picture. Please try another date.";
    }
  } finally {
    setApodLoading(false);
  }
}

function renderApod(data) {
  const dateFormatted = new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.getElementById("apod-date").textContent = `Astronomy Picture of the Day - ${dateFormatted}`;
  document.getElementById("apod-title").textContent = data.title || "Untitled";
  document.getElementById("apod-explanation").textContent = data.explanation || "";
  document.getElementById("apod-copyright").textContent = data.copyright ? `© ${data.copyright}` : "© Public Domain";

  ["apod-date-detail", "apod-date-info"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = id === "apod-date-detail" ? `<i class="far fa-calendar mr-2"></i>${data.date}` : data.date;
  });

  const mediaTypeEl = document.getElementById("apod-media-type");
  if (mediaTypeEl) mediaTypeEl.textContent = data.media_type === "video" ? "Video" : "Image";

  const imgEl = document.getElementById("apod-image");
  if (imgEl) {
    // for videos, fall back to the thumbnail if provided, else the hd/standard url
    imgEl.src = data.media_type === "image" ? (data.hdurl || data.url) : (data.thumbnail_url || data.url);
    imgEl.alt = data.title || "Astronomy Picture of the Day";
  }

  const fullResBtn = document.querySelector("#apod-image-container button");
  if (fullResBtn) {
    fullResBtn.onclick = () => window.open(data.hdurl || data.url, "_blank");
  }
}

function initApod() {
  const dateInput = document.getElementById("apod-date-input");
  const loadBtn = document.getElementById("load-date-btn");
  const todayBtn = document.getElementById("today-apod-btn");

  if (dateInput) {
    dateInput.max = todayISO();
    dateInput.value = todayISO();
    updateDateWrapperLabel(dateInput);
    dateInput.addEventListener("change", () => updateDateWrapperLabel(dateInput));
  }

  loadBtn?.addEventListener("click", () => {
    const chosen = dateInput?.value || todayISO();
    fetchApod(chosen);
  });

  todayBtn?.addEventListener("click", () => {
    if (dateInput) {
      dateInput.value = todayISO();
      updateDateWrapperLabel(dateInput);
    }
    fetchApod(todayISO());
  });
}

function updateDateWrapperLabel(dateInput) {
  const label = dateInput.closest(".date-input-wrapper");
  const span = label?.querySelector("span");
  if (!span || !dateInput.value) return;
  const formatted = new Date(dateInput.value + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  span.textContent = formatted;
}

// =========================================================
// LAUNCHES
// =========================================================
function statusBadgeClasses(statusAbbrev) {
  switch (statusAbbrev) {
    case "Go":
      return "bg-green-500/90 text-white";
    case "TBC":
      return "bg-yellow-500/90 text-white";
    case "TBD":
      return "bg-blue-500/90 text-white";
    case "Failure":
      return "bg-red-500/90 text-white";
    default:
      return "bg-slate-500/90 text-white";
  }
}

function formatLaunchDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatLaunchTime(iso) {
  return (
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
  );
}
function daysUntil(iso) {
  const diff = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function fetchLaunches() {
  try {
    const res = await fetch(LAUNCHES_URL);
    if (!res.ok) throw new Error(`Launches request failed: ${res.status}`);
    const data = await res.json();
    const launches = data.results || [];

    updateLaunchesCount(launches.length);
    if (launches.length) {
      renderFeaturedLaunch(launches[0]);
      renderLaunchesGrid(launches.slice(1));
    }
  } catch (err) {
    console.error("Failed to load launches:", err);
  }
}

function updateLaunchesCount(count) {
  const desktop = document.getElementById("launches-count");
  const mobile = document.getElementById("launches-count-mobile");
  if (desktop) desktop.textContent = `${count} Launches`;
  if (mobile) mobile.textContent = count;
}

function renderFeaturedLaunch(launch) {
  const container = document.getElementById("featured-launch");
  if (!container) return;

  const status = launch.status?.abbrev || "TBD";
  const pad = launch.pad || {};
  const location = pad.location || {};
  const image = launch.image || "";

  container.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i> Featured Launch
              </span>
              <span class="px-4 py-1.5 ${statusBadgeClasses(status)} rounded-full text-sm font-semibold">${status}</span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${launch.name || "TBD"}</h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2"><i class="fas fa-building"></i><span>${launch.launch_service_provider?.name || "Unknown"}</span></div>
              <div class="flex items-center gap-2"><i class="fas fa-rocket"></i><span>${launch.rocket?.configuration?.name || "Unknown"}</span></div>
            </div>
            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i>
              <div>
                <p class="text-2xl font-bold text-blue-400">${daysUntil(launch.net)}</p>
                <p class="text-xs text-slate-400">Days Until Launch</p>
              </div>
            </div>
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-calendar"></i>Launch Date</p>
                <p class="font-semibold">${formatLaunchDate(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-clock"></i>Launch Time</p>
                <p class="font-semibold">${formatLaunchTime(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-map-marker-alt"></i>Location</p>
                <p class="font-semibold text-sm">${pad.name || "Unknown"}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-globe"></i>Country</p>
                <p class="font-semibold">${location.country_code || "N/A"}</p>
              </div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${launch.mission?.description || "No description available for this mission yet."}</p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <a href="${launch.url || "#"}" target="_blank" class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i> View Full Details
            </a>
            <div class="icons self-end md:self-center flex gap-2">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="fas fa-bell"></i></button>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            ${
              image
                ? `<img src="${image}" alt="${launch.name}" class="w-full h-full object-cover" />`
                : `<div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800"><i class="fas fa-rocket text-9xl text-slate-700/50"></i></div>`
            }
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLaunchesGrid(launches) {
  const grid = document.getElementById("launches-grid");
  if (!grid) return;

  if (!launches.length) {
    grid.innerHTML = `<p class="text-slate-400 col-span-full text-center py-8">No more upcoming launches right now.</p>`;
    return;
  }

  grid.innerHTML = launches
    .map((launch) => {
      const status = launch.status?.abbrev || "TBD";
      const image = launch.image || "";
      return `
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
        <div class="relative h-48 bg-slate-900/50 flex items-center justify-center overflow-hidden">
          ${
            image
              ? `<img src="${image}" alt="${launch.name}" class="w-full h-full object-cover" />`
              : `<i class="fas fa-rocket text-5xl text-slate-700"></i>`
          }
          <div class="absolute top-3 right-3">
            <span class="px-3 py-1 ${statusBadgeClasses(status)} backdrop-blur-sm rounded-full text-xs font-semibold">${status}</span>
          </div>
        </div>
        <div class="p-5">
          <div class="mb-3">
            <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${launch.name || "TBD"}</h4>
            <p class="text-sm text-slate-400 flex items-center gap-2">
              <i class="fas fa-building text-xs"></i>${launch.launch_service_provider?.name || "Unknown"}
            </p>
          </div>
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4"></i><span class="text-slate-300">${formatLaunchDate(launch.net)}</span></div>
            <div class="flex items-center gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4"></i><span class="text-slate-300">${formatLaunchTime(launch.net)}</span></div>
            <div class="flex items-center gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4"></i><span class="text-slate-300">${launch.rocket?.configuration?.name || "Unknown"}</span></div>
            <div class="flex items-center gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4"></i><span class="text-slate-300 line-clamp-1">${launch.pad?.name || "Unknown"}</span></div>
          </div>
          <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
            <a href="${launch.url || "#"}" target="_blank" class="flex-1 text-center px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">Details</a>
            <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// =========================================================
// PLANETS
// =========================================================
function initPlanetCards() {
  const cards = document.querySelectorAll(".planet-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("ring", "ring-2"));
      card.style.borderColor = "var(--planet-color)";
      const planetId = card.dataset.planetId;
      loadPlanetDetails(planetId);
    });
  });
}

async function loadPlanetDetails(planetId) {
  const apiId = PLANET_ID_MAP[planetId];
  if (!apiId) return;

  try {
    const res = await fetch(`${PLANET_URL_BASE}${apiId}`);
    if (!res.ok) throw new Error(`Planet request failed: ${res.status}`);
    const p = await res.json();
    renderPlanetDetails(p, planetId);
  } catch (err) {
    console.error(`Failed to load data for ${planetId}:`, err);
  }
}

function renderPlanetDetails(p, planetId) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const displayName = p.englishName || p.name;

  set("planet-detail-name", displayName);
  const img = document.getElementById("planet-detail-image");
  if (img) {
    img.src = `./assets/images/${planetId}.png`;
    img.alt = `${displayName} planet`;
  }

  set(
    "planet-detail-description",
    `${displayName} is located ${p.semimajorAxis ? (p.semimajorAxis / 149597870.7).toFixed(2) : "?"} AU from the Sun, with a mean radius of ${p.meanRadius ?? "?"} km and a gravity of ${p.gravity ?? "?"} m/s².`
  );

  set("planet-distance", p.semimajorAxis ? `${(p.semimajorAxis / 1e6).toFixed(1)}M km` : "N/A");
  set("planet-radius", p.meanRadius ? `${p.meanRadius.toLocaleString()} km` : "N/A");
  set("planet-mass", p.mass ? `${p.mass.massValue} × 10^${p.mass.massExponent} kg` : "N/A");
  set("planet-density", p.density ? `${p.density} g/cm³` : "N/A");
  set("planet-orbital-period", p.sideralOrbit ? `${p.sideralOrbit.toFixed(2)} days` : "N/A");
  set("planet-rotation", p.sideralRotation ? `${Math.abs(p.sideralRotation).toFixed(1)} hours` : "N/A");
  set("planet-moons", p.moons ? p.moons.length : 0);
  set("planet-gravity", p.gravity ? `${p.gravity} m/s²` : "N/A");

  set("planet-discoverer", p.discoveredBy || "Known since antiquity");
  set("planet-discovery-date", p.discoveryDate || "Ancient");
  set("planet-body-type", p.bodyType || "Planet");
  set("planet-volume", p.vol?.volValue ? `${p.vol.volValue} × 10^${p.vol.volExponent} km³` : "N/A");

  set("planet-perihelion", p.perihelion ? `${(p.perihelion / 1e6).toFixed(1)}M km` : "N/A");
  set("planet-aphelion", p.aphelion ? `${(p.aphelion / 1e6).toFixed(1)}M km` : "N/A");
  set("planet-eccentricity", p.eccentricity ?? "N/A");
  set("planet-inclination", p.inclination !== undefined ? `${p.inclination}°` : "N/A");
  set("planet-axial-tilt", p.axialTilt !== undefined ? `${p.axialTilt}°` : "N/A");
  set("planet-temp", p.avgTemp ? `${(p.avgTemp - 273.15).toFixed(0)}°C` : "N/A");
  set("planet-escape", p.escape ? `${(p.escape / 1000).toFixed(1)} km/s` : "N/A");
}

// =========================================================
// DATA ORCHESTRATION - one entry point, all requests in parallel
// =========================================================
async function loadAllData() {
  const results = await Promise.allSettled([
    fetchApod(todayISO()),
    fetchLaunches(),
    loadPlanetDetails("earth"), // default detail panel, matches static markup
  ]);

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const labels = ["APOD", "Launches", "Planets"];
      console.error(`${labels[i]} failed to load:`, result.reason);
    }
  });
}

// =========================================================
// INIT
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initSidebarToggle();
  initApod();
  initPlanetCards();
  loadAllData();
});