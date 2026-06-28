/* =============================================================
 *  Wendy's LinkedIn Curation — app.js
 *  Home · BUILD/GROW/CONNECT · KO/EN (EN = full archive) · sort · resume
 * ============================================================= */
(function () {
  "use strict";

  const { profile, worlds, categories, posts, resume } = window.SITE;
  const catMap   = Object.fromEntries(categories.map((c) => [c.id, c]));
  const worldMap = Object.fromEntries(worlds.map((w) => [w.id, w]));
  const HOT = 100;

  const EXT = '<svg class="ic-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  const CHEV = '<svg class="tree-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const wic = (p) => `<svg class="tree-world-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const WORLD_ICONS = {
    build:   wic('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
    grow:    wic('<path d="M7 20h10"/><path d="M12 20c0-7 2-9 7-9-1 5-3 7-7 7z"/><path d="M12 16C12 10 9 8 4 8c1 5 3 7 8 7z"/>'),
    connect: wic('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>'),
  };
  const SUB_EN = {
    "딸깍 시리즈": "One-Click Series", "RAG·콘텐츠 자동화": "RAG & Content", "AI 셋업 & 툴링": "AI Setup & Tooling",
    "성장 과정": "Growth", "글로벌 도전기": "Going Global", "실패와 전환점": "Failures & Pivots",
    "언급 & 응원": "Mentions & Cheers", "커뮤니티": "Community",
  };

  /* state */
  let view     = { kind: "home", world: "", cat: "", sub: "" };
  let query    = "";
  let lang     = localStorage.getItem("lang") || "ko";
  let sortMode = localStorage.getItem("sort") || "popular";

  const $ = (id) => document.getElementById(id);
  const els = {
    sidebar: $("sidebar"), overlay: $("sidebar-overlay"), menuBtn: $("mobile-menu-btn"),
    catTree: $("cat-tree"),
    year: $("sidebar-year"),
    mainControls: document.querySelector(".main-controls"),
    sectionTitle: $("section-title"), postCount: $("post-count"),
    postList: $("post-list"), empty: $("empty-state"), emptyMsg: $("empty-msg"),
    clearSearch: $("clear-search"), search: $("search"), sortToggle: $("sort-toggle"),
    themeD: $("theme-toggle"), themeM: $("theme-toggle-m"), langD: $("lang-toggle"), langM: $("lang-toggle-m"),
    modal: $("resume-modal"), modalClose: $("resume-close"), resumeLang: $("resume-lang"),
    resumeVer: $("resume-version"), resumePreview: $("resume-preview"),
    resumeDl: $("resume-download"),
  };

  /* helpers */
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const isEn = () => lang === "en";
  const isHot = (p) => (p.reactions || 0) >= HOT;
  const visiblePosts = () => (isEn() ? posts : posts.filter((p) => p.avail !== "en"));
  const pTitle = (p) => (isEn() ? p.title_en || p.title : p.title);
  const pSum = (p) => (isEn() ? p.summary_en || p.summary : p.summary);
  const catLabel = (c) => (isEn() ? c.label_en || c.label : c.label);
  const worldLabel = (w) => (isEn() ? w.label_en || w.label : w.label);
  const worldTag = (w) => (isEn() ? w.tagline_en || w.tagline : w.tagline);
  const subLabel = (s) => (isEn() ? (SUB_EN[s] || s) : s);

  const T = {
    home: () => (isEn() ? "Home" : "홈"),
    all: () => (isEn() ? "All posts" : "전체 글"),
    popular: () => (isEn() ? "Popular" : "인기 글"),
    search: () => (isEn() ? "Search…" : "글 검색…"),
    read: () => (isEn() ? "Open" : "원문"),
    empty: () => (isEn() ? "No results." : "검색 결과가 없습니다."),
    showAll: () => (isEn() ? "Show all" : "전체 보기"),
    hot: () => (isEn() ? "Hot" : "인기"),
    resume: () => (isEn() ? "Resume" : "이력서"),
    posts: (n) => (isEn() ? `${n} posts` : `${n}개`),
    sortPop: () => (isEn() ? "Popular" : "인기순"),
    sortNew: () => (isEn() ? "Recent" : "최신순"),
    curated: () => (isEn() ? "Featured" : "대표 글"),
    browse: () => (isEn() ? "Browse all posts" : "전체 글 둘러보기"),
  };

  const countAll = () => visiblePosts().length;
  const countPopular = () => visiblePosts().filter(isHot).length;
  const countWorld = (w) => visiblePosts().filter((p) => w.cats.includes(p.cat)).length;
  const countCat = (id) => visiblePosts().filter((p) => p.cat === id).length;
  const countSub = (id, s) => visiblePosts().filter((p) => p.cat === id && p.sub === s).length;
  const subsOf = (id) => [...new Set(visiblePosts().filter((p) => p.cat === id && p.sub).map((p) => p.sub))];

  /* theme / lang */
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
  function applyTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
    [els.themeD, els.themeM].forEach((b) => { if (!b) return; b.querySelector(".icon-sun").style.display = dark ? "" : "none"; b.querySelector(".icon-moon").style.display = dark ? "none" : ""; });
  }
  function applyLang(l) {
    lang = l; localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("data-lang", lang);
    [els.langD, els.langM].forEach((c) => { if (c) c.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang)); });
    els.search.placeholder = T.search();
    els.clearSearch.textContent = T.showAll();
    els.emptyMsg.textContent = T.empty();
    els.sortToggle.querySelector('[data-sort="popular"]').textContent = T.sortPop();
    els.sortToggle.querySelector('[data-sort="recent"]').textContent = T.sortNew();
    view = { kind: "home", world: "", cat: "", sub: "" };
    query = ""; els.search.value = "";
    renderTree(); render();
  }

  /* ── sidebar tree (text only, minimal) ── */
  function row(opts) {
    const b = document.createElement("button");
    b.className = "tree-row " + (opts.cls || "") + (opts.active ? " active" : "");
    b.innerHTML = `<span class="tree-label">${esc(opts.label)}</span>` + (opts.count != null ? `<span class="tree-count">${opts.count}</span>` : "");
    if (opts.onClick) b.addEventListener("click", opts.onClick);
    return b;
  }
  function renderTree() {
    const t = els.catTree; t.innerHTML = "";
    t.appendChild(row({ cls: "tree-top", label: T.home(), active: view.kind === "home", onClick: () => navigate({ kind: "home" }) }));
    t.appendChild(row({ cls: "tree-top", label: T.all(), count: countAll(), active: view.kind === "all", onClick: () => navigate({ kind: "all" }) }));
    if (countPopular() > 0) t.appendChild(row({ cls: "tree-top tree-hot", label: T.popular(), count: countPopular(), active: view.kind === "popular", onClick: () => navigate({ kind: "popular" }) }));

    worlds.forEach((w) => {
      if (countWorld(w) === 0) return;
      const wActive = view.kind === "world" && view.world === w.id;
      const open = wActive || (view.kind === "cat" && w.cats.includes(view.cat));
      const wrap = document.createElement("div"); wrap.className = "tree-world-wrap" + (open ? " open" : "");
      const head = document.createElement("button");
      head.className = "tree-world" + (open ? " open" : "") + (wActive ? " active" : "");
      head.innerHTML = `${WORLD_ICONS[w.id] || ""}<span class="tree-world-text"><span class="tree-world-label">${esc(worldLabel(w))}</span><span class="tree-world-tag">${esc(worldTag(w))}</span></span>${CHEV}`;
      head.addEventListener("click", () => navigate({ kind: "world", world: w.id }));
      wrap.appendChild(head);

      if (open) w.cats.forEach((cid) => {
        const cat = catMap[cid]; if (!cat || countCat(cid) === 0) return;
        const subs = subsOf(cid);
        const catActive = view.kind === "cat" && view.cat === cid;
        const cb = row({ cls: "tree-cat" + (subs.length ? " has-subs" : ""), label: catLabel(cat), count: countCat(cid), active: catActive && !view.sub, onClick: () => navigate({ kind: "cat", cat: cid, sub: "" }) });
        if (subs.length) cb.classList.toggle("expanded", catActive);
        wrap.appendChild(cb);
        if (subs.length && catActive) {
          const sw = document.createElement("div"); sw.className = "tree-subs open";
          subs.forEach((s) => {
            const sb = document.createElement("button");
            sb.className = "tree-sub" + (view.sub === s ? " active" : "");
            sb.innerHTML = `<span class="tree-label">${esc(subLabel(s))}</span><span class="tree-count">${countSub(cid, s)}</span>`;
            sb.addEventListener("click", (e) => { e.stopPropagation(); navigate({ kind: "cat", cat: cid, sub: s }); });
            sw.appendChild(sb);
          });
          wrap.appendChild(sw);
        }
      });
      t.appendChild(wrap);
    });
  }

  function navigate(v) {
    view = { kind: v.kind, world: v.world || "", cat: v.cat || "", sub: v.sub || "" };
    query = ""; els.search.value = "";
    closeSidebar(); renderTree(); render();
  }

  /* ── filtering + sort ── */
  function currentList() {
    let list = visiblePosts();
    if (view.kind === "popular") list = list.filter(isHot);
    else if (view.kind === "world") { const w = worldMap[view.world]; if (w) list = list.filter((p) => w.cats.includes(p.cat)); }
    else if (view.kind === "cat") { list = list.filter((p) => p.cat === view.cat); if (view.sub) list = list.filter((p) => p.sub === view.sub); }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => [p.title, p.title_en, p.summary, p.summary_en, p.sub].filter(Boolean).some((t) => t.toLowerCase().includes(q)));
    return sortList(list);
  }
  function sortList(list) {
    const byDate = (a, b) => (b.date || "").localeCompare(a.date || "");
    return sortMode === "popular"
      ? [...list].sort((a, b) => (b.reactions || 0) - (a.reactions || 0) || byDate(a, b))
      : [...list].sort(byDate);
  }

  /* ── row ── */
  function rowHTML(p, opt) {
    const cat = catMap[p.cat] || { label: p.cat };
    const tags = [];
    if (opt.showCat) tags.push(`<span class="row-tag">${esc(catLabel(cat))}</span>`);
    if (opt.showSub && p.sub) tags.push(`<span class="row-tag row-tag-sub">${esc(subLabel(p.sub))}</span>`);
    return `
      <a class="post-row" href="${esc((isEn() && p.url_en) ? p.url_en : p.url)}" target="_blank" rel="noopener noreferrer" role="listitem">
        <div class="post-row-main">
          ${tags.length ? `<div class="post-row-tags">${tags.join("")}</div>` : ""}
          <div class="post-row-title">${esc(pTitle(p))}${isHot(p) ? `<span class="row-hot">${esc(T.hot())}</span>` : ""}</div>
          <div class="post-row-summary">${esc(pSum(p))}</div>
        </div>
        <div class="post-row-side">
          ${p.date ? `<span class="row-date">${esc(p.date)}</span>` : ""}
          <span class="row-read">${esc(T.read())}${EXT}</span>
        </div>
      </a>`;
  }

  /* ── home ── */
  function homeHTML() {
    const hot = sortList(visiblePosts().filter(isHot)).slice(0, 6);
    const ava = profile.photo;
    return `
      <section class="home">
        <div class="home-hero">
          <div class="home-avatar" id="home-avatar">${esc(profile.initials || "·")}</div>
          <h1 class="home-name">${esc(isEn() ? (profile.name_en || profile.name) : profile.name)}</h1>
          <p class="home-headline">${esc(profile.headline)}</p>
          ${(isEn() ? profile.bio_en : profile.bio) ? `<p class="home-bio">${esc(isEn() ? profile.bio_en : profile.bio)}</p>` : ""}
          <div class="home-actions">
            <a class="hbtn hbtn-primary" href="${esc(profile.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn${EXT}</a>
            <a class="hbtn" href="${esc(profile.github || "#")}" target="_blank" rel="noopener noreferrer">GitHub${EXT}</a>
            <button class="hbtn" id="home-resume" type="button">${esc(T.resume())}</button>
          </div>
        </div>
        <div class="home-section-head">
          <span class="home-section-title">${esc(T.curated())}</span>
          <button class="home-browse" id="home-browse" type="button">${esc(T.browse())} ${EXT}</button>
        </div>
        <div class="home-list">${hot.map((p) => rowHTML(p, { showCat: true, showSub: false })).join("")}</div>
      </section>`;
  }

  /* ── render ── */
  function render() {
    const home = view.kind === "home";
    els.mainControls.style.display = home ? "none" : "";
    els.sectionTitle.style.display = home ? "none" : "";
    els.postCount.style.display = home ? "none" : "";

    if (home) {
      els.empty.hidden = true;
      els.postList.hidden = false;
      els.postList.innerHTML = homeHTML();
      const av = els.postList.querySelector("#home-avatar");
      if (av) { const img = new Image(); img.onload = () => { av.textContent = ""; av.appendChild(img); }; img.src = profile.photo; }
      const rb = els.postList.querySelector("#home-resume"); if (rb) rb.addEventListener("click", openResume);
      const bb = els.postList.querySelector("#home-browse"); if (bb) bb.addEventListener("click", () => navigate({ kind: "all" }));
      return;
    }

    const list = currentList();
    const q = query.trim();
    let title = T.all();
    if (q) title = `"${q}"`;
    else if (view.kind === "popular") title = T.popular();
    else if (view.kind === "world") { const w = worldMap[view.world]; title = w ? worldLabel(w) : ""; }
    else if (view.kind === "cat") { const c = catMap[view.cat]; title = c ? catLabel(c) : view.cat; if (view.sub) title += " · " + subLabel(view.sub); }
    els.sectionTitle.textContent = title;
    els.postCount.textContent = T.posts(list.length);

    const empty = list.length === 0;
    els.empty.hidden = !empty; els.postList.hidden = empty;
    if (empty) { els.postList.innerHTML = ""; return; }

    if (view.kind === "all" && !q) {
      let html = "";
      worlds.forEach((w) => {
        const wp = list.filter((p) => w.cats.includes(p.cat)); if (!wp.length) return;
        html += `<div class="group-world"><span class="group-world-label">${esc(worldLabel(w))}</span><span class="group-world-tag">${esc(worldTag(w))}</span></div>`;
        w.cats.forEach((cid) => {
          const cp = wp.filter((p) => p.cat === cid); if (!cp.length) return;
          html += `<div class="group-cat"><span>${esc(catLabel(catMap[cid]))}</span><span class="group-cat-count">${cp.length}</span></div>`;
          html += cp.map((p) => rowHTML(p, { showCat: false, showSub: false })).join("");
        });
      });
      els.postList.innerHTML = html; return;
    }
    const inCat = view.kind === "cat";
    els.postList.innerHTML = list.map((p) => rowHTML(p, { showCat: !inCat, showSub: !(inCat && view.sub) })).join("");
  }

  /* ── mobile sidebar ── */
  function openSidebar() { els.sidebar.classList.add("open"); els.overlay.classList.add("visible"); els.overlay.style.display = "block"; els.menuBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
  function closeSidebar() { els.sidebar.classList.remove("open"); els.overlay.classList.remove("visible"); document.body.style.overflow = ""; if (els.menuBtn) els.menuBtn.setAttribute("aria-expanded", "false"); setTimeout(() => { els.overlay.style.display = ""; }, 220); }

  /* ── resume modal ── */
  let rLang = "ko";
  const resumeFilesFor = (l) => (resume.files || []).filter((f) => f.lang === l);
  function populateResumeVersions() {
    const files = resumeFilesFor(rLang);
    els.resumeVer.innerHTML = files.length
      ? files.map((f) => `<option value="${esc(f.path)}">${esc(isEn() ? f.label_en || f.label : f.label)}</option>`).join("")
      : `<option value="">${isEn() ? "(no resume)" : "(이력서 없음)"}</option>`;
    els.resumeVer.disabled = !files.length;
  }
  function openResume() {
    rLang = resumeFilesFor(lang).length ? lang : ((resume.files[0] && resume.files[0].lang) || "ko");
    els.resumeLang.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.rlang === rLang));
    populateResumeVersions();
    els.resumeDl.textContent = isEn() ? "Download" : "다운로드";
    els.modal.hidden = false; document.body.style.overflow = "hidden"; updateResume();
  }
  function closeResume() { els.modal.hidden = true; document.body.style.overflow = ""; }
  function updateResume() {
    const pathPdf = els.resumeVer.value;
    const box = (msg) => { els.resumePreview.innerHTML = `<div class="resume-empty"><p>${msg}</p>${pathPdf ? `<p class="resume-empty-path">${esc(pathPdf)}</p>` : ""}</div>`; };
    if (!pathPdf) { els.resumeDl.removeAttribute("href"); ph_disable(true); box(isEn() ? "No resume for this language yet." : "이 언어의 이력서가 아직 없습니다."); return; }
    els.resumeDl.href = pathPdf; ph_disable(false);
    const miss = () => box(isEn() ? "File not found. Add it under /assets/resume." : "파일을 찾지 못했어요. /assets/resume 에 넣어주세요.");
    fetch(pathPdf, { method: "HEAD" }).then((r) => { if (r.ok) els.resumePreview.innerHTML = `<iframe src="${esc(pathPdf)}" title="resume"></iframe>`; else miss(); }).catch(miss);
  }
  function ph_disable(d) { els.resumeDl.style.pointerEvents = d ? "none" : ""; els.resumeDl.style.opacity = d ? ".5" : ""; }

  /* ── init ── */
  function syncSort() { els.sortToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.sort === sortMode)); }
  function init() {
    els.year.textContent = new Date().getFullYear();
    applyTheme(isDark());
    [els.themeD, els.themeM].forEach((b) => b && b.addEventListener("click", () => applyTheme(!isDark())));
    [els.langD, els.langM].forEach((c) => c && c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang))));
    applyLang(lang);
    syncSort();
    els.sortToggle.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { sortMode = b.dataset.sort; localStorage.setItem("sort", sortMode); syncSort(); render(); }));
    els.search.addEventListener("input", (e) => { query = e.target.value; if (view.kind === "home") view = { kind: "all", world: "", cat: "", sub: "" }; render(); renderTree(); });
    els.clearSearch.addEventListener("click", () => navigate({ kind: "all" }));
    if (els.menuBtn) els.menuBtn.addEventListener("click", () => els.sidebar.classList.contains("open") ? closeSidebar() : openSidebar());
    els.overlay.addEventListener("click", closeSidebar);
    els.modalClose.addEventListener("click", closeResume);
    els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeResume(); });
    els.resumeVer.addEventListener("change", updateResume);
    els.resumeLang.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { rLang = b.dataset.rlang; els.resumeLang.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); populateResumeVersions(); updateResume(); }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !els.modal.hidden) closeResume(); });
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "").slice(1);
      if (!h || h === "home") navigate({ kind: "home" });
      else if (h === "all") navigate({ kind: "all" });
      else if (h === "popular") navigate({ kind: "popular" });
      else if (worldMap[h]) navigate({ kind: "world", world: h });
      else if (catMap[h]) navigate({ kind: "cat", cat: h });
    });
  }
  init();
})();
