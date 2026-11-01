
const $ = (s,root=document)=>root.querySelector(s);
const root = document.documentElement;
async function getPlaces(){const r=await fetch((document.body.dataset.base||'')+'places.json');return r.json()}
function basePath(){return document.body.dataset.base||''}
function photoMarkup(src,alt,cls=''){
 const imagePath = src && src.startsWith('http') ? src : (basePath() + src);
 return src ? `<img class="${cls}" src="${imagePath}" alt="${alt}">` : `<span class="placeholder">ФОТОГРАФИЯ ОБЪЕКТА</span>`;
}
async function renderHome(){
 const list=await getPlaces(), grid=$('#places-grid');
 grid.innerHTML=list.map(p=>`<a class="place-card" href="places/${p.slug}/"><div class="thumb">${photoMarkup(p.photo,p.title)}</div><div class="card-meta"><span>${p.category}</span><span>№ ${String(p.id).padStart(2,'0')}</span></div><h3>${p.title}</h3><p>${p.address}</p></a>`).join('');
}
async function renderPlace(){
 const id=Number(document.body.dataset.place), list=await getPlaces(), p=list.find(x=>x.id===id);
 if(!p){$('#detail').innerHTML='<p>Объект не найден.</p>';return}
 document.title=p.title+' — ӘЛМӘТ';
 $('#detail').innerHTML=`
 <div class="detail-hero"><a class="back" href="../../">← КО ВСЕМ МЕСТАМ</a><div class="eyebrow">ФОТОПУТЕВОДИТЕЛЬ · ОБЪЕКТ ${String(p.id).padStart(2,'0')}</div><h1>${p.title}</h1><div class="address">Адрес: ${p.address}</div></div>
 <div class="detail-photo">${photoMarkup(p.photo,p.title)}</div>
 <div class="detail-content"><article class="story"><div class="eyebrow">${p.category}</div><h2>Об этом месте</h2><p>${p.description}</p><h2>Интересные детали</h2><ul class="facts">${p.facts.map(f=>`<li>${f}</li>`).join('')}</ul><div class="note">Этот материал — часть авторского фотопутеводителя по Альметьевску (Әлмәт). Текст и фотографии подготовлены для школьного проекта.</div></article>
 <aside class="qr-panel"><div class="eyebrow">БЫСТРЫЙ ПЕРЕХОД</div><h2>Открой страницу</h2><p>Наведите камеру телефона на QR-код, чтобы перейти именно к этому объекту.</p><div class="qr-holder" id="qr">QR-код</div><div class="qr-url" id="qr-url"></div><button class="print-btn" onclick="window.print()">РАСПЕЧАТАТЬ СТРАНИЦУ</button></aside></div>`;
 const url=location.href; $('#qr-url').textContent=url;
 const q=new URL('https://api.qrserver.com/v1/create-qr-code/');q.searchParams.set('size','240x240');q.searchParams.set('data',url);
 $('#qr').innerHTML=`<img src="${q.toString()}" alt="QR-код страницы ${p.title}">`;
}
if(document.body.dataset.page==='home')renderHome();
if(document.body.dataset.page==='place')renderPlace();
