# 남서아 (Wendy) · LinkedIn 글 큐레이션

링크드인 글을 카테고리별로 모아 보여주는 정적 큐레이션 사이트.
**백엔드 없음 / 로그인 없음 / 데이터는 코드 안에** → 친구분이 겪은 "새로고침하면 초기화" 버그가 구조적으로 발생하지 않습니다.

```
Linkedin_Curation_Website/
├─ index.html   ← 화면 뼈대 (건드릴 일 거의 없음)
├─ styles.css   ← 디자인 (색/폰트 바꿀 때만)
├─ app.js       ← 동작 로직 (건드릴 일 거의 없음)
├─ data.js      ← ⭐ 글 목록. 평소엔 여기만 수정합니다
└─ assets/
   └─ profile.jpg  ← (선택) 프로필 사진
```

---

## 1. 지금 바로 열어보기

`index.html` 파일을 **더블클릭** → 브라우저에서 바로 열립니다. (서버 불필요)

---

## 2. 새 글 추가하기  ← 가장 자주 할 일

`data.js` 를 열고, `posts:` 목록 안에 항목 하나를 **복사 → 맨 위에 붙여넣기 → 내용만 수정**합니다.

```js
{
  cat: "ai",                          // 카테고리 id (아래 표 참고)
  sub: "",                            // 소분류 (없으면 빈칸 "")
  title: "새 글 제목",
  summary: "한 줄 요약",
  url: "https://lnkd.in/xxxxxxxx",    // 링크드인 원문 주소
  reactions: 0,                       // 반응 수 (0이면 화면에 안 보임)
  comments: 0                         // 댓글 수
},
```

**카테고리 id 표**

| id        | 화면 이름        |
|-----------|------------------|
| `ai`      | 🤖 AI 활용법      |
| `sales`   | 💼 세일즈 실무    |
| `market`  | 📈 시장 이해      |
| `career`  | 💬 커리어 팁      |
| `story`   | 🌱 경험 & 스토리  |
| `network` | 🤝 네트워크 아카이브 |

> ⚠️ 따옴표 `"` 와 쉼표 `,` 위치만 그대로 지키면 깨지지 않습니다.
> 카테고리 자체를 추가/이름변경하려면 `data.js` 위쪽 `categories:` 를 수정하세요.

---

## 3. 프로필 사진 넣기 (선택)

`assets/` 폴더를 만들고 `profile.jpg` 를 넣으면 자동으로 표시됩니다.
없으면 파란 원에 이니셜(`남`)이 나옵니다. (이니셜은 `data.js`의 `initials` 에서 변경)

---

## 4. 인터넷에 배포하기 (무료)

### 가장 쉬운 방법 — Vercel 드래그앤드롭
1. [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 로그인)
2. **Add New → Project → Deploy** 에서 이 폴더를 통째로 드래그
3. 끝. `your-name.vercel.app` 주소가 발급됩니다.

### GitHub 연동 (권장 — 수정이 편함)
1. 이 폴더를 GitHub 저장소로 올림
2. Vercel에서 그 저장소를 import
3. 이후 **`data.js` 수정 → `git push` 하면 자동으로 다시 배포**됩니다.

배포가 끝나면 그 주소를 링크드인 프로필 **스페셜(Featured) 섹션**에 고정하세요.

---

## 5. 카테고리 링크 공유

주소 뒤에 `#카테고리id` 를 붙이면 해당 탭이 바로 열립니다.

```
https://your-site.vercel.app/#ai       → AI 활용법 탭
https://your-site.vercel.app/#sales    → 세일즈 실무 탭
```

---

## 6. 방문자 통계 (Google Analytics)

이 코드에는 기본으로 GA4 측정 ID가 심어져 있습니다.
**그대로 쓰면 제 계정으로 통계가 잡히니 반드시 본인 ID로 교체하세요.**

### GA4 계정 만들기

1. [analytics.google.com](https://analytics.google.com) → Google 계정으로 로그인
2. **측정 시작** 클릭
3. 계정 이름 아무거나 입력 → 속성 이름: 본인 사이트 이름
4. 플랫폼 **웹** 선택 → 사이트 URL 입력
5. 완료하면 **측정 ID** (`G-XXXXXXXXXX` 형식) 발급

### index.html에서 교체

`index.html` 상단의 아래 코드에서 `G-ZVS1SMYQVP` 부분을 본인 ID로 교체합니다.

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');  ← 여기도 교체
</script>
```

GA 없이 쓰고 싶으면 위 `<script>` 블록 전체를 삭제해도 됩니다.

---

## 7. (다음 단계) 폰에서 "공유 → 담기" 기능

지금 구조는 **읽기 전용 공개 블로그**입니다.
나중에 *링크드인 글을 폰에서 공유시트로 바로 담는* 기능을 원하면:

- **PWA `share_target`** (안드로이드) + **Supabase** (무료 DB) 를 추가하면 됩니다.
- 아이폰은 공유받기(Web Share Target)를 OS가 막아둬서, **iOS 단축어**로 우회해야 합니다.

이건 백엔드가 붙는 작업이라, 공개 블로그가 배포된 뒤 별도로 진행하는 걸 권장합니다.
