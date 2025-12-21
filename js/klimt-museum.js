document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const grid = $("#kmGrid");
  const routeList = $("#kmRouteList");

  const search = $("#kmSearch");
  const period = $("#kmPeriod");
  const type = $("#kmType");
  const sort = $("#kmSort");

  const modal = $("#kmModal");
  const modalClose = $("#kmModalClose");
  const mImg = $("#kmModalImg");
  const mTitle = $("#kmModalTitle");
  const mMeta = $("#kmModalMeta");
  const mDesc = $("#kmModalDesc");

  const tour = $("#kmTour");
  const tourClose = $("#kmTourClose");
  const tImg = $("#kmTourImg");
  const tTitle = $("#kmTourTitle");
  const tMeta = $("#kmTourMeta");
  const tDesc = $("#kmTourDesc");
  const tProgress = $("#kmTourProgress");
  const btnPrev = $("#kmPrev");
  const btnNext = $("#kmNext");

  const startTour = $("#kmStartTour");
  const clearRoute = $("#kmClearRoute");

  if(!grid || !routeList) return;

  const STORAGE_KEY = "klimt_route_v1";
  const getCards = () => $$(".km-card", grid);


  // ===== ZOOM + PAN (inside frame) =====
const modalFrame = document.getElementById("kmModalFrame");
const tourFrame  = document.getElementById("kmTourFrame");

function resetZoom(frame){
  if(!frame) return;
  frame.classList.remove("is-zoomed", "is-dragging");
  frame.style.setProperty("--x", "0px");
  frame.style.setProperty("--y", "0px");
}

function toggleZoom(frame){
  if(!frame) return;
  frame.classList.toggle("is-zoomed");
  if(!frame.classList.contains("is-zoomed")) resetZoom(frame);
}

function enableZoomAndPan(frame){
  if(!frame) return;

  // 1) Click -> zoom in/out
  frame.addEventListener("click", (e) => {
    // якщо щойно тягнули — не перемикаємо зум кліком
    if(frame.classList.contains("is-dragging")) return;
    toggleZoom(frame);
  });

  // 2) Drag -> pan (лише коли zoom активний)
  let dragging = false;
  let startX = 0, startY = 0;
  let baseX = 0, baseY = 0;

  frame.addEventListener("pointerdown", (e) => {
    if(!frame.classList.contains("is-zoomed")) return;

    dragging = true;
    frame.classList.add("is-dragging");
    frame.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;

    baseX = parseFloat(getComputedStyle(frame).getPropertyValue("--x")) || 0;
    baseY = parseFloat(getComputedStyle(frame).getPropertyValue("--y")) || 0;
  });

  frame.addEventListener("pointermove", (e) => {
    if(!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    frame.style.setProperty("--x", `${baseX + dx}px`);
    frame.style.setProperty("--y", `${baseY + dy}px`);
  });

  frame.addEventListener("pointerup", () => {
    dragging = false;
    frame.classList.remove("is-dragging");
    // маленька пауза, щоб клік після drag не перемикав зум
    setTimeout(() => frame.classList.remove("is-dragging"), 0);
  });

  frame.addEventListener("pointercancel", () => {
    dragging = false;
    frame.classList.remove("is-dragging");
  });
}

enableZoomAndPan(modalFrame);
enableZoomAndPan(tourFrame);


  function cardToItem(card){
    return {
      id: card.dataset.id,
      name: card.dataset.name,
      year: Number(card.dataset.year || 0),
      period: card.dataset.period,
      type: card.dataset.type,
      desc: card.dataset.desc || "",
      img: card.dataset.img || card.querySelector("img")?.src || ""
    };
  }

  function loadRoute(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    }catch{ return []; }
  }

  function saveRoute(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function labelPeriod(p){
    return ({early:"Ранній", secession:"Сецесіон", gold:"Золотий", late:"Пізній"}[p] || "Період");
  }

  function labelType(t){
    return ({portrait:"Портрет", allegory:"Алегорія", landscape:"Пейзаж", sketch:"Ескіз", poster:"Плакат"}[t] || "Тип");
  }

  function renderRoute(){
    const route = loadRoute();
    routeList.innerHTML = "";

    if(route.length === 0){
      const li = document.createElement("li");
      li.className = "km-muted";
      li.textContent = "Маршрут порожній. Додай експонати з галереї (⭐).";
      routeList.appendChild(li);
      return;
    }

    route.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "km-routeItem";
      li.draggable = true;
      li.dataset.index = String(idx);

      li.innerHTML = `
        <img class="km-routeThumb" src="${it.img}" alt="${it.name}">
        <div style="flex:1">
          <div><strong>${it.name}</strong></div>
          <div class="km-grab">${it.year} • ${labelPeriod(it.period)} • ${labelType(it.type)} • перетягни щоб змінити порядок</div>
        </div>
        <button class="km-btn km-btn--small km-btn--ghost" data-remove="${it.id}" aria-label="Прибрати">✕</button>
      `;
      routeList.appendChild(li);
    });
  }

  // Add/View from gallery
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".km-card");
    if(!card) return;

    if(e.target.closest("[data-add]")){
      const route = loadRoute();
      const item = cardToItem(card);
      if(!route.some(x => x.id === item.id)){
        route.push(item);
        saveRoute(route);
        renderRoute();
      }
    }

    if(e.target.closest("[data-view]")){
      openModal(cardToItem(card));
    }
  });

  // Remove from route
  routeList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if(!btn) return;
    const id = btn.getAttribute("data-remove");
    const route = loadRoute().filter(x => x.id !== id);
    saveRoute(route);
    renderRoute();
  });

  // Search/filter/sort
  function applyControls(){
    const q = (search?.value || "").trim().toLowerCase();
    const p = period?.value || "all";
    const t = type?.value || "all";
    const s = sort?.value || "name";

    const cards = getCards();

    cards.forEach(card => {
      const name = (card.dataset.name || "").toLowerCase();
      const okQ = !q || name.includes(q);
      const okP = p === "all" || card.dataset.period === p;
      const okT = t === "all" || card.dataset.type === t;
      card.style.display = (okQ && okP && okT) ? "" : "none";
    });

    const visible = cards.filter(c => c.style.display !== "none");
    visible.sort((a,b) => {
      if(s === "year") return Number(a.dataset.year||0) - Number(b.dataset.year||0);
      return (a.dataset.name||"").localeCompare((b.dataset.name||""), "uk");
    });
    visible.forEach(c => grid.appendChild(c));
  }

  [search, period, type, sort].forEach(el => el && el.addEventListener("input", applyControls));

  // Modal (view)
  function openModal(it){
    mImg.src = it.img;
    resetZoom(modalFrame);
    mImg.alt = it.name;
    mTitle.textContent = it.name;
    mMeta.textContent = `${it.year} • ${labelPeriod(it.period)} • ${labelType(it.type)}`;
    mDesc.textContent = it.desc;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  mImg.src = "";
  resetZoom(modalFrame);
  }


  modalClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });

  // Direct manipulation: reorder route
  let dragIndex = null;
  routeList.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".km-routeItem");
    if(!li) return;
    dragIndex = Number(li.dataset.index);
    e.dataTransfer.effectAllowed = "move";
  });
  routeList.addEventListener("dragover", (e) => {
    if(dragIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });
  routeList.addEventListener("drop", (e) => {
    const li = e.target.closest(".km-routeItem");
    if(!li || dragIndex === null) return;
    const dropIndex = Number(li.dataset.index);

    const route = loadRoute();
    const [moved] = route.splice(dragIndex, 1);
    route.splice(dropIndex, 0, moved);
    saveRoute(route);
    dragIndex = null;
    renderRoute();
  });
  routeList.addEventListener("dragend", () => { dragIndex = null; });

  // Tour mode
  let tourIndex = 0;

  function openTour(idx){
    const route = loadRoute();
    if(route.length === 0) return;

    tourIndex = Math.max(0, Math.min(idx, route.length - 1));
    const it = route[tourIndex];

    tImg.src = it.img;
    tImg.alt = it.name;
    tTitle.textContent = it.name;
    tMeta.textContent = `${it.year} • ${labelPeriod(it.period)} • ${labelType(it.type)}`;
    tDesc.textContent = it.desc;
    tProgress.textContent = `Експонат ${tourIndex + 1}/${route.length}`;
    // блокування стрілок на краях
    btnPrev && (btnPrev.disabled = (tourIndex === 0));
    btnNext && (btnNext.disabled = (tourIndex === route.length - 1));


    tour.classList.add("open");
    tour.setAttribute("aria-hidden","false");
  }

  function goTour(delta){
  const route = loadRoute();
  if(route.length === 0) return;

  openTour(tourIndex + delta);
}



  function closeTour(){
  tour.classList.remove("open");
  tour.setAttribute("aria-hidden","true");
  tImg.src = "";
  resetZoom(tourFrame);
}

  startTour?.addEventListener("click", () => openTour(0));
  tourClose?.addEventListener("click", closeTour);
  tour?.addEventListener("click", (e) => { if(e.target === tour) closeTour(); });

btnPrev?.addEventListener("click", () => goTour(-1));
btnNext?.addEventListener("click", () => goTour(1));


  clearRoute?.addEventListener("click", () => {
    saveRoute([]);
    renderRoute();
  });

  // Esc: закрити модалки
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeTour(); }
    if (!tour?.classList.contains("open")) return;
    if (e.key === "ArrowLeft") goTour(-1);
    if (e.key === "ArrowRight") goTour(1);

  });

  // init
  renderRoute();
  applyControls();
});