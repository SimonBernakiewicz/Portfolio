// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s),
        cats      = $('#cats'),
        subs      = $('#subs'),
        photos    = $('#photos'),
        gear      = $('#gear'),
        introMain = $('#intro-main'),
        introSub  = $('#intro-sub'),
        back      = $('#back'),
        rand      = $('#random'),
        theme     = $('#theme'),
        logo      = $('.logo'),
        burger    = $('#burger'),
        side      = $('#side'),
        sideClose = $('#side-close'),
        overlay   = $('#overlay'),
        navPhotos = $('#nav-photos'),
        navGear   = $('#nav-gear'),
        lb        = $('#lightbox'),
        zoomCt    = $('#zoom'),
        lbImg     = $('#lb-img'),
        lbClose   = $('#lb-close'),
        html      = document.documentElement,
        main      = document.querySelector('main');

  let manifest = { categories: {} }, current = [], stack = [];

  /* SIDE MENU */
  function openSide() {
    side.classList.add('show');
    overlay.classList.add('show');
    document.body.classList.add('menu-open');
  }
  function closeSide() {
    side.classList.remove('show');
    overlay.classList.remove('show');
    document.body.classList.remove('menu-open');
  }

  /* REVEAL ON SCROLL */
  const ioReveal = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
  }, { threshold: 0.12 });

  /* MAKE A CARD */
  function makeCard(label, thumb, cb) {
    const d = document.createElement('div');
    d.className = 'card reveal';
    d.innerHTML = `<img src="${thumb}" loading="lazy"><div class="label">${label}</div>`;
    d.onclick = () => { closeSide(); cb(); };
    ioReveal.observe(d);
    return d;
  }

  /* MAKE A THUMB */
  function makeThumb(item) {
    const wrap = document.createElement('div'),
          sk   = document.createElement('div'),
          img  = new Image();
    wrap.className = 'thumb reveal';
    sk.className   = 'skeleton';
    wrap.append(sk);

    img.src     = item.thumb;
    img.loading = 'lazy';
    img.alt     = '';
    img.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .4s ease,transform .4s ease';
    wrap.append(img);

    let loaded = false, inView = false;
    function unveil() {
      if (loaded && inView) {
        sk.classList.add('hide');
        img.style.opacity = '1';
      }
    }
    img.onload  = () => { loaded = true; unveil(); };
    img.onerror = () => { loaded = true; unveil(); };

    const ioTile = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          inView = true; unveil(); ioTile.disconnect();
        }
      });
    }, { rootMargin: '120px' });
    ioTile.observe(wrap);

    wrap.onclick = () => openLB(item.full);
    ioReveal.observe(wrap);
    return wrap;
  }

  /* PANEL ACTIVATION */
  function setActive(panel) {
    [cats, subs, photos, gear].forEach(p => p.classList.remove('active'));
    panel.classList.add('active');
    if (panel === photos) main.style.minHeight = `${panel.offsetHeight + 160}px`;
    else main.style.minHeight = '';
  }

  /* RENDER VIEWS */
  function renderHome() {
    cats.innerHTML = ''; current = [];
    Object.values(manifest.categories).forEach(arr => current.push(...arr));
    if (current.length) {
      const p = current[Math.floor(Math.random() * current.length)];
      cats.append(makeCard('All', p.thumb, () => push({view:'gallery', items:current, label:'All'})));
    }
    for (const [k, arr] of Object.entries(manifest.categories)) {
      const p = arr[Math.floor(Math.random() * arr.length)];
      cats.append(makeCard(
        k[0].toUpperCase() + k.slice(1),
        p.thumb,
        () => push({view:'sub', key:k, label:k})
      ));
    }
    introMain.textContent = 'Select a category to begin.';
    rand.disabled = !current.length;
    setActive(cats);
  }

  function renderSub(st) {
    subs.innerHTML = '';
    const items = manifest.categories[st.key] || [], groups = {};
    items.forEach(i => {
      const parts = i.full.split('/'),
            idx   = parts.indexOf(st.key),
            lbl   = idx>=0 ? parts[idx+1] : 'All';
      (groups[lbl] = groups[lbl]||[]).push(i);
    });
    for (const [lbl, arr] of Object.entries(groups)) {
      const p = arr[Math.floor(Math.random() * arr.length)];
      subs.append(makeCard(lbl, p.thumb, () => 
        push({view:'gallery', items:arr, label:lbl})
      ));
    }
    introMain.textContent = `Explore ${st.label}`;
    rand.disabled = false;
    setActive(subs);
  }

  function renderGallery(st) {
    photos.innerHTML = ''; current = st.items.slice();
    st.items.forEach(i => photos.append(makeThumb(i)));
    introMain.textContent = `Explore ${st.label}`;
    introSub.style.display = 'block';
    rand.disabled = false;
    setActive(photos);
  }

  function renderGear() {
    introMain.textContent = '';
    introSub.style.display = 'none';
    rand.disabled = true;
    setActive(gear);
  }

  function render(state) {
    back.hidden = !(state.lightbox || state.view !== 'home');
    if (!state.lightbox) lb.classList.remove('show');
    switch (state.view) {
      case 'home':    renderHome();    break;
      case 'sub':     renderSub(state);  break;
      case 'gallery': renderGallery(state); break;
      case 'gear':    renderGear();    break;
    }
    if (state.lightbox) openLB(state.src, false);
    else window.scrollTo({top:0, behavior:'auto'});
  }

  /* HISTORY */
  function push(s) {
    history.pushState({...s, lightbox:false}, '');
    render(s);
  }
  window.addEventListener('popstate', e => {
    if (e.state) render(e.state);
  });

  /* PAN & ZOOM STATE */
  let scale = 1, tx = 0, ty = 0;
  function update() {
    lbImg.style.transform = `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale})`;
  }

  /* OPEN LIGHTBOX */
  function openLB(src /* no history here */) {
    scale = 1; tx = 0; ty = 0;
    lbImg.classList.remove('loaded');
    lbImg.style.transform = 'translate(-50%,-50%) scale(1)';
    const pre = new Image();
    pre.onload = () => {
      lbImg.src = src;
      lbImg.classList.add('loaded');
      lb.classList.add('show');
    };
    pre.src = src;
  }

  /* CLOSE LIGHTBOX */
  function closeLB() {
    lb.classList.remove('show');
  }

  // 1) Back button
  back.onclick = () =>
    lb.classList.contains('show') ? closeLB() : history.back();

  // 2) “×” button
  lbClose.onclick = e => {
    e.stopPropagation();
    closeLB();
  };

  // 4) Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLB();
  });

  /* WHEEL ZOOM – cursor-centric */
  lb.addEventListener('wheel', e => {
    if (!lb.classList.contains('show')) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 0.8,
          oldS   = scale,
          newS   = Math.min(Math.max(1, oldS * factor), 5),
          rect   = zoomCt.getBoundingClientRect(),
          cx     = e.clientX - (rect.left + rect.width/2),
          cy     = e.clientY - (rect.top  + rect.height/2);
    tx = tx * (newS/oldS) + cx * (1 - newS/oldS);
    ty = ty * (newS/oldS) + cy * (1 - newS/oldS);
    scale = newS;
    update();
  }, { passive: false });

  /* POINTER PAN/PINCH */
  const ptrs = new Map();
  let base = 1, start = 1;
  zoomCt.addEventListener('pointerdown', e => {
    e.preventDefault();
    zoomCt.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptrs.size === 2) {
      const [a,b] = Array.from(ptrs.values());
      start = Math.hypot(b.x - a.x, b.y - a.y);
      base  = scale;
    }
  });
  zoomCt.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    e.preventDefault();
    const prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptrs.size === 2) {
      const [a,b] = Array.from(ptrs.values()),
            d      = Math.hypot(b.x - a.x, b.y - a.y),
            n      = Math.min(Math.max(1, base * (d/start)), 5);
      scale = n; update();
    } else {
      tx += e.clientX - prev.x;
      ty += e.clientY - prev.y;
      update();
    }
  });
  ['pointerup','pointercancel'].forEach(evt => {
    zoomCt.addEventListener(evt, e => {
      zoomCt.releasePointerCapture(e.pointerId);
      ptrs.delete(e.pointerId);
    });
  });

  /* NAV & THEME */
  burger.onclick    = openSide;
  sideClose.onclick = overlay.onclick = closeSide;
  logo.onclick      = () => { closeSide(); push({view:'home'}); };
  navPhotos.onclick = e => { e.preventDefault(); closeSide(); push({view:'home'}); };
  navGear.onclick   = e => { e.preventDefault(); closeSide(); push({view:'gear'}); };
  rand.onclick      = () => current.length && openLB(current[Math.floor(Math.random()*current.length)].full);
  theme.onclick     = () => {
    const t = html.dataset.theme==='dark' ? 'light' : 'dark';
    html.dataset.theme = t;
    localStorage.setItem('theme', t);
    theme.textContent = t==='dark' ? '☀️' : '🌙';
  };

  /* INIT */
  fetch('manifest.json')
    .then(r => r.json())
    .then(m => { manifest = m; })
    .catch(() => console.warn('manifest load failed'))
    .finally(() => {
      history.replaceState({view:'home', lightbox:false}, '');
      render({view:'home', lightbox:false});
    });
});
