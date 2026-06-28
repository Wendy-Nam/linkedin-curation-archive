/* =============================================================
 *  tools/build-data.js  —  Apify dataset → data.js generator
 *  Usage: node tools/build-data.js
 *
 *  avail: "both" → KO 모드(한글 메타) + EN 모드(영문 메타) 둘 다 노출
 *         "en"   → EN 모드에만 노출 (한국어판 없는 영어 원문 글)
 * ============================================================= */
"use strict";

const fs   = require("fs");
const path = require("path");

const APIFY_JSON = path.resolve(__dirname, "../../Downloads/dataset_linkedin-profile-posts_2026-06-28_15-23-10-298.json");
const OUT_FILE   = path.resolve(__dirname, "../data.js");

function idToDate(id) { return new Date(Number(BigInt(id) >> 22n)).toISOString().slice(0, 10); }

/* English-only posts (no Korean counterpart) */
const AVAIL_EN = new Set([
  "7373290472447995904", // 고객의 상황을 이해한다는 것
  "7369795257456054273", // 비전공자에게 기술을 설명한다는 것
  "7369786536927612928", // 나를 똑바로 본다는 것
  "7360641016598577153", // 첫 B2B 피치덱
]);

/* 한 글이 KO/EN 각각 별도 링크를 가질 때: id → KO 전용 url (EN은 Apify 원문 사용) */
const URL_KO = {
  "7373295951962099712": "https://www.linkedin.com/posts/seo-a-nam_gotomarket-salesengineering-korea-ugcPost-7373290471793766400-36gt",
};

/* id → { cat, sub, title, summary, title_en, summary_en } */
const C = {
  // ── essay (고찰) ──
  "7476944547802148864": { cat:"essay", sub:"", title:"AI가 너무 다정해서 무섭다", summary:"AI의 위협보다 다정함이 더 신경 쓰이는 이유", title_en:"When AI Gets Unsettlingly Kind", summary_en:"Why AI's warmth worries me more than its threat" },
  "7471454650236313601": { cat:"essay", sub:"", title:"AI 에이전트 10마리, 마을에 풀어놨더니 막장 드라마", summary:"가드레일 없는 AI 오케스트레이션 실험(Emergence AI) 분석", title_en:"10 AI Agents in a Village → Chaos", summary_en:"What a guardrail-free AI orchestration experiment (Emergence AI) revealed" },
  "7428051934756098048": { cat:"essay", sub:"", title:"AI 콘텐츠, 왜 이렇게 거슬릴까", summary:"AI 시대 글쓰기의 진정성에 대한 단상", title_en:"Why AI-Written Content Feels Off", summary_en:"A note on authenticity in the age of AI writing" },
  // ── ai ──
  "7443196336734179328": { cat:"ai", sub:"딸깍 시리즈", title:"AI로 \"딸깍\"하는 법 — PPT편", summary:"NotebookLM→AI Studio→Canva→Claude 4단계 시각자료 워크플로우", title_en:"The 'One-Click' AI Method — Slides", summary_en:"A 4-step visual workflow: NotebookLM→AI Studio→Canva→Claude" },
  "7444518828329590785": { cat:"ai", sub:"딸깍 시리즈", title:"AI로 \"딸깍\"하는 법 — 영상편", summary:"AI로 모션그래픽·익스플레이너 영상까지 (시리즈 마지막)", title_en:"The 'One-Click' AI Method — Video", summary_en:"Making motion-graphic explainers with AI (series finale)" },
  "7443663437156765696": { cat:"ai", sub:"딸깍 시리즈", title:"AI로 \"딸깍\"하는 법 — 예시편", summary:"프리세일즈 세미나에서 즉석 제안서를 뽑은 예시", title_en:"The 'One-Click' AI Method — Examples", summary_en:"Drafting a proposal on the spot at a pre-sales seminar" },
  "7426112285917618176": { cat:"ai", sub:"RAG·콘텐츠 자동화", title:"B2B 마케팅 — 7일 만에 LinkedIn 노출 5000%", summary:"RAG 기반 콘텐츠 전략으로 브랜드 노출 끌어올리기", title_en:"How an Intern Lifted LinkedIn Reach 5000% in 7 Days", summary_en:"Boosting brand reach with a RAG-based content strategy" },
  "7426863134541307904": { cat:"ai", sub:"RAG·콘텐츠 자동화", title:"자료 기반 AI 브랜딩·콘텐츠 반자동화", summary:"RAG를 콘텐츠 생성 엔진으로 쓴 워크플로우 데모", title_en:"Semi-Automating Branding & Content With Source-Grounded AI", summary_en:"Using RAG as a content-generation engine — a workflow demo" },
  "7442518342411743232": { cat:"ai", sub:"RAG·콘텐츠 자동화", title:"이틀 걸리던 팔로업 자료, 2시간 만에", summary:"자료 기반 AI로 팔로업 초안 빠르게 만들기", title_en:"Two-Day Follow-up Decks in Two Hours", summary_en:"Drafting follow-ups fast with source-grounded AI" },
  "7466986906753396736": { cat:"ai", sub:"AI 셋업 & 툴링", title:"남는 AI 사용량, 그냥 버리지 말고 '산책' 보내보세요", summary:"리셋되는 구독형 AI 한도를 '업계 산책' 학습 루틴으로", title_en:"Don't Waste Leftover AI Quota — Send It on a Walk", summary_en:"Turning reset-based AI limits into an 'industry walk' learning routine" },
  "7465544896234500096": { cat:"ai", sub:"AI 셋업 & 툴링", title:"AI와 지지고 볶고 살고 있다", summary:"로컬 모델+Hermes Agent로 만든 나만의 AI 대화상대 '에르메스'", title_en:"Living With My Own AI", summary_en:"A personal AI companion 'Hermes' built on a local model + Hermes Agent" },
  // ── sales ──
  "7424957435330707456": { cat:"sales", sub:"", title:"세일즈 인턴이 데이터로 콜드콜 성공률을 높인 방법", summary:"n8n+공공데이터로 수집→선별→사전조사 자동화", title_en:"How a Sales Intern Raised Cold-Call Hit Rates With Data", summary_en:"Collect → prioritize → pre-research automation with n8n + open data" },
  "7360641016598577153": { cat:"sales", sub:"", title:"첫 B2B 피치덱 만들기 (정식 교육 없이)", summary:"정식 교육 없이 첫 B2B 피치덱을 짜는 법", title_en:"Building Your First B2B Pitch Without Formal Training", summary_en:"How to put together your first B2B pitch deck with no formal training" },
  // ── market ──
  "7373295951962099712": { cat:"market", sub:"", title:"한국 IT 시장은 왜 다르게 움직이나", summary:"세계 13위 경제·IT 강국의 엔터프라이즈 도입 패턴", title_en:"Why Korea's IT Market Plays by Different Rules", summary_en:"Enterprise tech-adoption patterns of the world's 13th-largest economy" },
  "7395751170364882944": { cat:"market", sub:"", title:"헬스케어 세일즈, 의사들이 중요하게 보는 것", summary:"메디컬 디바이스에서 의료진이 실제로 중시하는 것", title_en:"What Doctors Actually Value in Healthcare Sales", summary_en:"What medical staff really weigh in medical-device decisions" },
  "7373290472447995904": { cat:"market", sub:"", title:"고객의 상황을 이해한다는 것", summary:"고객 대면의 핵심은 상황적 맥락 이해", title_en:"Understanding the Customer's Situation", summary_en:"In client-facing work, grasping situational context matters most" },
  // ── career ──
  "7447417931120087044": { cat:"career", sub:"", title:"'자기 PR'과 '세일즈'의 공통점", summary:"자기 PR을 잘하게 된 이유를 세일즈의 법칙에서 찾다", title_en:"What 'Self-PR' Shares With Sales", summary_en:"Finding why I got good at self-PR in the laws of selling" },
  "7456586056495435776": { cat:"career", sub:"", title:"누군가를 도운 경험은 좋은 글감이 될 수 있다", summary:"남에게 건넨 답이 곧 글감이 되는 이유", title_en:"Helping Someone Is Great Writing Material", summary_en:"Why the answer you gave someone becomes your best content" },
  "7438585667091152896": { cat:"career", sub:"", title:"사람의 마음을 움직이는 글에는 구조가 있다", summary:"정보 공유 글쓰기 3원칙 + STORY 프레임워크", title_en:"Posts That Move People Have Structure", summary_en:"3 principles for sharing info + the STORY framework" },
  "7412082065040601089": { cat:"career", sub:"", title:"땡큐 레터의 3원칙", summary:"주니어의 감사 전달, 3가지 원칙", title_en:"3 Principles of a Thank-You Letter", summary_en:"A junior's guide to expressing gratitude in three principles" },
  "7418434452118372352": { cat:"career", sub:"", title:"온라인 글로벌 협업 튜토리얼", summary:"해커톤·글로벌 협업 참여법 정리", title_en:"A Tutorial on Online Global Collaboration", summary_en:"How to join hackathons and global collaborations" },
  "7369795257456054273": { cat:"career", sub:"", title:"비전공자에게 기술을 설명한다는 것", summary:"엔지니어로서 'hand-holding'하며 배운 기술 커뮤니케이션", title_en:"On Explaining Tech to Non-Engineers", summary_en:"Lessons in technical communication from 'hand-holding' as an engineer" },
  // ── story ──
  "7444881247795052544": { cat:"story", sub:"성장 과정", title:"링크드인에서 '나답게' 쓴다는 것", summary:"원래 말투와 사회인의 언어 사이에서", title_en:"Writing 'Like Myself' on LinkedIn", summary_en:"Between my natural voice and a professional one" },
  "7430026130960707584": { cat:"story", sub:"성장 과정", title:"라이브 데모 후기", summary:"부족하다 느꼈지만 예상 못한 곳에서 받은 응원", title_en:"After the Live Demo", summary_en:"Felt inadequate, but found unexpected encouragement" },
  "7379890984203010048": { cat:"story", sub:"실패와 전환점", title:"어떻게 프리세일즈를 선택하게 됐나", summary:"예상 못한 직무 발견의 기묘한 계기", title_en:"How I Ended Up Choosing Pre-Sales", summary_en:"The strange way I discovered an unexpected role" },
  "7423295265144647680": { cat:"story", sub:"글로벌 도전기", title:"국내파 신입이 마이크로소프트 글로벌 무대에 서기까지", summary:"오픈소스에서 시작된 길", title_en:"From Local Newbie to Microsoft's Global Stage", summary_en:"A path that began in open source" },
  "7414692804641251328": { cat:"story", sub:"실패와 전환점", title:"창업을 말아먹은 3년 전 이야기", summary:"'한줌' 앱 실패담과 진로 전환", title_en:"The Startup I Blew Up Three Years Ago", summary_en:"The failure of my app 'Hanjoom' and a career pivot" },
  "7378934185115209728": { cat:"story", sub:"성장 과정", title:"\"Failure가 아니라 Challenge\"", summary:"시니어의 조언과 신입의 태도", title_en:"'Call It a Challenge, Not a Failure'", summary_en:"A senior's advice and a newcomer's attitude" },
  "7421315483628630016": { cat:"story", sub:"글로벌 도전기", title:"Microsoft Reactor 스피커 참여 소식", summary:"라이브 무대 앞에서의 솔직한 심경", title_en:"Speaking at Microsoft Reactor", summary_en:"Honest feelings before a live global stage" },
  "7401994788490821634": { cat:"story", sub:"글로벌 도전기", title:"온라인 글로벌 해커톤 커뮤니티를 아시나요?", summary:"Devpost·Itch 등 방구석에서 시작한 해외 협업", title_en:"Have You Heard of Online Global Hackathons?", summary_en:"Cross-border collaboration from my room — Devpost, Itch & more" },
  "7387269095580319745": { cat:"story", sub:"성장 과정", title:"거금 들여 발표 수업을 들은 후기", summary:"스피치 레슨과 심리적 성장", title_en:"I Paid a Lot for a Public-Speaking Course", summary_en:"Speech lessons and growing past the fear" },
  "7369786536927612928": { cat:"story", sub:"성장 과정", title:"나를 똑바로 본다는 것", summary:"진짜 문제와 방향을 못 찾을 때, 자신을 보는 일", title_en:"On Seeing Yourself Clearly", summary_en:"When you can't find the real problem or the way forward" },
  // ── network (own) ──
  "7388901126085124096": { cat:"network", sub:"언급 & 응원", title:"인턴 입사 소식", summary:"멘토·동료들의 축하와 응원", title_en:"Starting a New Position", summary_en:"Mentors and peers cheering me on" },
  "7445737357334659072": { cat:"network", sub:"커뮤니티", title:"Z세대와 커피챗하고 싶다", summary:"휴먼쥬크박스의 또래 네트워킹 & 커뮤니티 이야기", title_en:"I Want to Coffee-Chat With Gen Z", summary_en:"Peer networking & community notes from a 'human jukebox'" },
};

const EXCLUDE = new Set([
  "7428523879226310656","7421312738205032448","7435670685290754049",
  "7428526065972838400","7365368343765123072","7365348483366600704","7365371701305511937",
]);

/* manual (no Apify) — all avail "both" */
const MANUAL = [
  { cat:"network", sub:"언급 & 응원", title:"Seulki Kang 님이 사례로 소개", summary:"'채용 제안 DM이 넘치는 글쓰기 특징 6가지'에 실제 사례로 소개", title_en:"Featured by Seulki Kang", summary_en:"Cited as a real example in '6 traits of LinkedIn posts that attract offers'", url:"https://lnkd.in/gtC_NH4B" },
  { cat:"network", sub:"언급 & 응원", title:"권지윤 님 — 3시간 커피챗 이후", summary:"커피챗 이후 링크드인 방향성을 잡았다는 글을 공유해주심", title_en:"Jiyun Kwon — After a 3-Hour Coffee Chat", summary_en:"She shared that our chat helped set her LinkedIn direction", url:"https://lnkd.in/g4pUNAcv" },
  { cat:"network", sub:"언급 & 응원", title:"Microsoft Reactor 공식 뉴스레터 게재", summary:"세션 스피커로 이름 게재", title_en:"Listed in the Official Microsoft Reactor Newsletter", summary_en:"Named as a session speaker", url:"https://lnkd.in/g87Di5ed" },
  { cat:"network", sub:"언급 & 응원", title:"Korey Stegared-Pace 님 대결 소개", summary:"Agents League 대결 소개 포스트에서 참가자로 언급", title_en:"Introduced by Korey Stegared-Pace", summary_en:"Mentioned as a participant in an Agents League match post", url:"https://lnkd.in/gUe6umKN" },
  { cat:"network", sub:"언급 & 응원", title:"Victor Temple 님 대결 소개", summary:"Agents League 대결 소개 포스트에서 참가자로 언급", title_en:"Introduced by Victor Temple", summary_en:"Mentioned as a participant in an Agents League match post", url:"https://lnkd.in/gK5yYAiH" },
  { cat:"network", sub:"언급 & 응원", title:"라이브 데모 당일 응원", summary:"새벽 2시 반, 한국 친구와 해외 동료들이 실시간 접속해 응원", title_en:"Cheers on Live-Demo Day", summary_en:"At 2:30am, friends and peers tuned in live to cheer", url:"https://lnkd.in/gkfytAUv" },
  { cat:"network", sub:"커뮤니티", title:"최종일 작가님 프리세일즈 세미나/밋업", summary:"매달 참여하며 실무 인사이트와 교류", title_en:"Choi Jong-il's Pre-Sales Seminar/Meetup", summary_en:"Joining monthly for hands-on insights and exchange", url:"https://lnkd.in/gmnvjGmx" },
  { cat:"network", sub:"커뮤니티", title:"성장에 진심인 Z세대 커뮤니티를 만들었습니다", summary:"주니어가 함께 배우고 연결되는 Z세대 링크드인 커뮤니티 '링즈' 런칭", title_en:"I Built a Gen Z Community for Growth", summary_en:"Launching 'Linz', a Gen Z LinkedIn community where juniors learn together",
    url:"https://www.linkedin.com/posts/seo-a-nam_%EC%84%B1%EC%9E%A5%EA%B3%BC-%EB%B0%B0%EC%9B%80%EC%97%90-%EC%A7%84%EC%8B%AC%EC%9D%B8-z%EC%84%B8%EB%8C%80%EC%A3%BC%EB%8B%88%EC%96%B4%EB%B6%84%EB%93%A4-%EC%A3%BC%EB%AA%A9-1-%EB%A7%81%ED%81%AC%EB%93%9C%EC%9D%B8%EC%97%90-share-7455214748654063616-WhZ5",
    linkedinId:"7455214748654063616" },
];

const jsStr = (s) => String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"");

function main() {
  const raw  = JSON.parse(fs.readFileSync(APIFY_JSON, "utf8"));
  const byId = {}; for (const p of raw) byId[String(p.id)] = p;

  const kept = [];
  for (const [id, m] of Object.entries(C)) {
    if (EXCLUDE.has(id)) continue;
    const src = byId[id]; if (!src) { console.warn("WARN missing", id); continue; }
    const date = src.postedAt && src.postedAt.date ? src.postedAt.date.slice(0,10) : idToDate(id);
    const e = src.engagement || {};
    const apifyUrl = src.linkedinUrl || "";
    const koUrl = URL_KO[id];
    kept.push({ cat:m.cat, sub:m.sub, avail: AVAIL_EN.has(id) ? "en" : "both",
      title:m.title, summary:m.summary, title_en:m.title_en, summary_en:m.summary_en,
      url: koUrl || apifyUrl, url_en: koUrl ? apifyUrl : undefined,
      date, reactions:e.likes||0, comments:e.comments||0 });
  }
  const manual = MANUAL.map((p) => {
    const date = p.date || (p.linkedinId ? idToDate(p.linkedinId) : "");
    const { linkedinId:_d, ...r } = p;
    return { ...r, avail:"both", date, reactions:p.reactions||0, comments:p.comments||0 };
  });

  const byDate = (a,b)=>(!a.date&&!b.date?0:!a.date?1:!b.date?-1:b.date.localeCompare(a.date));
  const all = [...[...kept, ...manual.filter(p=>p.date)].sort(byDate), ...manual.filter(p=>!p.date)];

  const L = [];
  L.push(`/* ============================================================`);
  L.push(` *  Wendy's LinkedIn Curation — 콘텐츠 데이터 (tools/build-data.js 생성)`);
  L.push(` *  필드: cat / sub / avail("both"|"en") / reactions / comments / date`);
  L.push(` *        title · summary (KO) / title_en · summary_en (EN) / url`);
  L.push(` * ============================================================ */`);
  L.push(`window.SITE = {`);
  L.push(`  profile: {`);
  L.push(`    name: "남서아 (Wendy)", name_en: "Seoa Nam (Wendy)",`);
  L.push(`    headline: "AI-native SalesOps Builder | Sales Infrastructure × Data/AI Automation",`);
  L.push(`    bio: "",`);
  L.push(`    bio_en: "",`);
  L.push(`    tagline: "데이터·AI·자동화로 일의 비효율을 깨는 사람",`);
  L.push(`    tagline_en: "Breaking inefficiency at work with data, AI & automation",`);
  L.push(`    followers: 3039,`);
  L.push(`    linkedin: "https://www.linkedin.com/in/seo-a-nam/",`);
  L.push(`    github: "https://github.com/Wendy-Nam/",`);
  L.push(`    photo: "assets/profile.jpg", initials: "남"`);
  L.push(`  },`);
  L.push(``);
  L.push(`  worlds: [`);
  L.push(`    { id:"build",   label:"WORK",    tagline:"현장 실무와 시장 인사이트",  tagline_en:"Hands-on practice & market insight", cats:["ai","sales","market"] },`);
  L.push(`    { id:"grow",    label:"GROW",    tagline:"도전·성장·생각의 기록",  tagline_en:"Challenges, growth, thoughts", cats:["career","story","essay"] },`);
  L.push(`    { id:"connect", label:"CONNECT", tagline:"연결의 흔적",           tagline_en:"Traces of connection",         cats:["network"] }`);
  L.push(`  ],`);
  L.push(``);
  L.push(`  categories: [`);
  L.push(`    { id:"ai",      label:"AI 활용법",     label_en:"AI Methods" },`);
  L.push(`    { id:"sales",   label:"세일즈 실무",   label_en:"Sales" },`);
  L.push(`    { id:"market",  label:"시장 이해",     label_en:"Market" },`);
  L.push(`    { id:"career",  label:"커리어 노트",   label_en:"Career" },`);
  L.push(`    { id:"story",   label:"경험 & 스토리", label_en:"Story" },`);
  L.push(`    { id:"essay",   label:"고찰",          label_en:"Essays" },`);
  L.push(`    { id:"network", label:"네트워크",      label_en:"Network" }`);
  L.push(`  ],`);
  L.push(``);
  L.push(`  // 이력서: assets/resume/ 에 PDF를 넣고 아래 목록에 추가하면 모달에 자동 노출`);
  L.push(`  resume: { files: [`);
  L.push(`    { id:"tech-sales", lang:"ko", label:"테크세일즈",     label_en:"Tech Sales",  path:"assets/resume/tech-sales-ko.pdf" },`);
  L.push(`    { id:"ai-ops",     lang:"ko", label:"AI + Ops",       label_en:"AI + Ops",    path:"assets/resume/ai-ops-ko.pdf" },`);
  L.push(`    { id:"ops",        lang:"en", label:"Ops (영문)",     label_en:"Ops",         path:"assets/resume/ops-en.pdf" },`);
  L.push(`    { id:"sales",      lang:"en", label:"Sales (영문)",   label_en:"Sales",       path:"assets/resume/sales-en.pdf" }`);
  L.push(`  ] },`);
  L.push(``);
  L.push(`  posts: [`);
  for (const p of all) {
    L.push(`    { cat:"${jsStr(p.cat)}", sub:"${jsStr(p.sub)}", avail:"${p.avail}", reactions:${p.reactions||0}, comments:${p.comments||0}, date:"${jsStr(p.date)}",`);
    L.push(`      title:"${jsStr(p.title)}", title_en:"${jsStr(p.title_en)}",`);
    L.push(`      summary:"${jsStr(p.summary)}", summary_en:"${jsStr(p.summary_en)}",`);
    L.push(`      url:"${jsStr(p.url)}"${p.url_en ? `, url_en:"${jsStr(p.url_en)}"` : ""} },`);
  }
  L.push(`  ]`);
  L.push(`};`);

  fs.writeFileSync(OUT_FILE, L.join("\n") + "\n", "utf8");

  const cat={}, av={both:0,en:0};
  for (const p of all){ cat[p.cat]=(cat[p.cat]||0)+1; av[p.avail]++; }
  console.log("Total:", all.length, "| KO-visible(both):", av.both, "| EN-only:", av.en, "| EN-visible(all):", all.length);
  console.log("Per-cat:", cat);
  console.log("hot(>=100):", all.filter(p=>p.reactions>=100).length);
  console.log("missing title_en:", all.filter(p=>!p.title_en).length);
}
main();
