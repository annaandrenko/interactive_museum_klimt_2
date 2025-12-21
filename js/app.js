// Header year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Burger menu
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");
burger?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(isOpen));
});


// Lightbox 
const lightbox = document.getElementById("lightbox");
const lbImg = document.querySelector(".lightbox__img");
const lbClose = document.querySelector(".lightbox__close");
const lbPrev = document.querySelector(".lightbox__prev");
const lbNext = document.querySelector(".lightbox__next");
const lbCounter = document.getElementById("lightboxCounter");

let lbList = [];   // картинки поточного слайдера
let lbIndex = 0;

function updateCounter(){
  if (!lbCounter) return;
  lbCounter.textContent = `${lbIndex + 1} / ${lbList.length || 1}`;
}

function openAt(index){
  if (!lightbox || !lbImg || !lbList.length) return;
  lbIndex = (index + lbList.length) % lbList.length;
  lbImg.src = lbList[lbIndex];
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  updateCounter();
}

function closeLightbox() {
  if (!lightbox || !lbImg) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lbImg.src = "";
  lbList = [];
  lbIndex = 0;
  updateCounter();
}

document.addEventListener("click", (e) => {
  // відкриття тільки для слайдів у slider__track
  const slideBtn = e.target.closest(".slider__track [data-lightbox]");
  if (slideBtn) {
    const track = slideBtn.closest(".slider__track");
    const buttons = [...track.querySelectorAll("[data-lightbox]")];
    lbList = buttons.map(b => b.getAttribute("data-lightbox"));
    lbIndex = buttons.indexOf(slideBtn);
    openAt(lbIndex);
    return;
  }

  if (e.target === lightbox) closeLightbox();
});

lbClose?.addEventListener("click", closeLightbox);
lbPrev?.addEventListener("click", () => openAt(lbIndex - 1));
lbNext?.addEventListener("click", () => openAt(lbIndex + 1));

document.addEventListener("keydown", (e) => {
  if (!lightbox?.classList.contains("open")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") openAt(lbIndex - 1);
  if (e.key === "ArrowRight") openAt(lbIndex + 1);
});


// Sliders
document.querySelectorAll("[data-slider]").forEach((slider) => {
  const track = slider.querySelector("[data-track]");
  const prev = slider.querySelector("[data-prev]");
  const next = slider.querySelector("[data-next]");
  const dotsWrap = slider.parentElement.querySelector("[data-dots]") 
             || slider.nextElementSibling?.matches("[data-dots]") && slider.nextElementSibling
             || slider.closest(".topic")?.querySelector("[data-dots]");


  if (!track) return;

  const slides = [...track.querySelectorAll(".slide")];
  track.addEventListener("scroll", () => window.requestAnimationFrame(setActiveDot));

  prev?.addEventListener("click", () => {
    track.scrollBy({ left: -320, behavior: "smooth" });
  });
  next?.addEventListener("click", () => {
    track.scrollBy({ left: 320, behavior: "smooth" });
  });  
});