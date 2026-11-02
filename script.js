/* помощники */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const BASE=document.body.dataset.base||'';
const pad=n=>String(n).padStart(2,'0');

/* татарский орнамент «гюль» */
const SPRITE=`<symbol id="gul" viewBox="0 0 120 120"><g fill="currentColor"><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(45 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(90 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(135 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(180 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(225 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(270 60 60)"/><path d="M60 4c9 14 13 26 0 44C47 30 51 18 60 4Z" transform="rotate(315 60 60)"/><circle cx="60" cy="60" r="9"/></g><circle cx="60" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 8" opacity=".45"/></symbol>`;
function ensureSprite(){if(document.getElementById('gul'))return;const w=document.createElement('div');w.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true">${SPRITE}</svg>`;document.body.prepend(w.firstChild);}

async function getPlaces(){const r=await fetch(BASE+'places.json');return r.json();}
function photoMarkup(src,alt,cls=''){return src?`<img class="${cls}" src="${BASE+src}" alt="${alt}" loading="lazy">`:`<div class="placeholder">${alt}</div>`;}

/* плавное появление при скролле */
const io=('IntersectionObserver'in window)?new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'}):null;
function observeReveals(root=document){const els=$$('.reveal:not(.in)',root);if(!io){els.forEach(el=>el.classList.add('in'));return;}els.forEach(el=>io.observe(el));}

/* обложка: если фото нет — аккуратная заглушка */
function initCover(){
  const img=$('.cover-img');if(!img)return;
  const fail=()=>{img.onerror=null;img.classList.add('is-placeholder');
    img.src='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="470"><rect width="1200" height="470" fill="#dfe5d6"/><text x="600" y="228" font-family="Georgia,serif" font-size="30" fill="#89917f" text-anchor="middle">ФОТО ГОРОДА</text><text x="600" y="268" font-family="Arial,sans-serif" font-size="16" fill="#9aa08c" text-anchor="middle">положи файл в assets/city.webp</text></svg>');};
  if(img.complete&&img.naturalWidth===0)fail();else img.addEventListener('error',fail);
}

/* главная */
async function renderHome(){
  const list=await getPlaces(),grid=$('#places-grid');
  grid.innerHTML=list.map((p,i)=>`
    <a class="place-card reveal" style="transition-delay:${Math.min(i,8)*70}ms" href="${BASE}places/${p.slug}/">
      <div class="thumb">${photoMarkup(p.photo,p.title)}</div>
      <div class="card-meta"><span>${p.category}</span><span>№ ${pad(p.id)}</span></div>
      <h3>${p.title}</h3><p>${p.address}</p>
    </a>`).join('');
  observeReveals(grid);
  renderMap(list);
}

/* ===== КАРТА: реальные координаты всех 15 точек (сняты с твоей Яндекс-карты и геокодера) =====
   Хочешь подвинуть пин — поменяй числа здесь или добавь объекту в places.json поле
   "coords": [широта, долгота] — оно имеет приоритет над этой таблицей. */
const COORDS={
  1:[54.8964348,52.2974126],  // Художественная школа, Мусы Джалиля 9
  2:[54.9131839,52.3186023],  // ВШН, Советская 186А
  3:[54.8977455,52.2539063],  // «Мирас», Шевченко 55
  4:[54.9045657,52.2509700],  // «Яблоня», сквер «Яшьлек»
  5:[54.8993551,52.2775942],  // ДК «Нефтьче», Ленина 98
  6:[54.8981230,52.2665780],  // Парк Здоровья
  7:[54.8985807,52.2679330],  // Планетарий «СФЕРА», Строителей 30/1
  8:[54.9076628,52.3246165],  // «Фабрика креативных процессов», Тельмана 57
  9:[54.9127000,52.3176000],  // «Радиолярии», кампус ВШН
  10:[54.9122235,52.3103897], // Комсомольский парк
  11:[54.9002490,52.2719300], // Казанский собор, Соборная пл. 1
  12:[54.8996500,52.2693580], // Памятник «Нефть», мкр 4В
  13:[54.9088434,52.2736525], // Школа анимации, Строителей 39
  14:[54.9165100,52.2893930], // Парк «Побережье»
  15:[54.9010450,52.2973850]  // Памятник Ленину
};
let cityMap=null;
function renderMap(list){
  const el=document.getElementById('city-map');if(!el)return;
  if(!window.L){el.innerHTML='<p class="map-fallback">Карта не загрузилась — проверь соединение с интернетом.</p>';return;}
  if(cityMap)return;
  cityMap=L.map('city-map',{scrollWheelZoom:false});
  /* подложка OpenStreetMap — работает БЕЗ API-ключей */
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{className:'tiles-tint',maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(cityMap);
  const pts=[];
  list.forEach((p,i)=>{
    const c=p.coords||COORDS[p.id]||[54.9008+ (i%5)*0.004-0.008, 52.3000+(i%7)*0.004-0.010];
    pts.push(c);
    const icon=L.divIcon({className:'map-pin-div',html:`<span class="pin">${pad(p.id)}</span>`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-20]});
    L.marker(c,{icon,title:p.title}).addTo(cityMap)
      .bindPopup(`<p class="popup-title">${p.title}</p><a class="popup-link" href="${BASE}places/${p.slug}/">Открыть объект →</a>`);
  });
  cityMap.fitBounds(L.latLngBounds(pts),{padding:[46,46]});
}

/* страница объекта */
async function renderPlace(){
  const id=Number(document.body.dataset.place),list=await getPlaces(),p=list.find(x=>x.id===id);
  if(!p){$('#detail').innerHTML='<p>Объект не найден.</p>';return;}
  document.title=p.title+' — ӘЛМӘТ';
  $('#detail').innerHTML=`
    <div class="detail-hero reveal"><a class="back" href="${BASE}">← КО ВСЕМ МЕСТАМ</a><div class="eyebrow">ФОТОПУТЕВОДИТЕЛЬ · ОБЪЕКТ ${pad(p.id)}</div><h1>${p.title}</h1><div class="address">Адрес: ${p.address}</div></div>
    <div class="detail-photo reveal">${photoMarkup(p.photo,p.title,'detail-main-image')}</div>
    <div class="tatar-line reveal"><svg aria-hidden="true"><use href="#gul"/></svg></div>
    <div class="detail-content reveal"><article class="story"><div class="eyebrow">${p.category}</div><h2>Об этом месте</h2><p>${p.description}</p><h2>Интересные детали</h2><ul class="facts">${p.facts.map(f=>`<li>${f}</li>`).join('')}</ul><div class="note">Этот материал — часть авторского фотопутеводителя по Альметьевску (Әлмәт). Текст и фотографии подготовлены для школьного проекта.</div></article></div>`;
  observeReveals($('#detail'));
}

ensureSprite();
observeReveals();
initCover();
if(document.body.dataset.page==='home')renderHome();
if(document.body.dataset.page==='place')renderPlace();