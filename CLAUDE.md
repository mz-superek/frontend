# Claude Code 자동화 가이드

## 📰 Daily Dev News Curation (매일 아침 자동 실행)

### 목적
AI, 프론트엔드, 백엔드, HTML&CSS 분야의 최근 핵심 소식을 자동으로 수집, 큐레이션하여 Slack #with 채널에 발송하고 HTML 뉴스 아카이브에 기록.
(시의성 기준은 **분야별 차등** — 0️⃣ 게이트 참조: AI는 24시간~수일, 그 외 분야는 최근 1~2주.)

### 핵심 규칙

#### 1️⃣ 날짜/요일 자동 계산 (반드시 동적 계산 + KST 고정)

> ⚠️ **반드시 `TZ=Asia/Seoul`로 계산할 것.** 실행 서버 시계는 UTC라
> 아침 발송 시간대(07시 KST)엔 UTC가 아직 **전날**이다. TZ를 안 박으면
> 하루가 밀린다. **context에 주입되는 `currentDate`도 UTC 기준일 수 있으니
> 절대 그대로 믿지 말고, 아래 명령으로 직접 계산한 값만 사용한다.**
> 요일도 절대 눈으로 추측하지 말고 `date`로 계산한다.

```bash
# ❌ 절대 하드코딩하지 말 것 / ❌ 주입된 currentDate 그대로 쓰지 말 것 / ❌ 요일 추측 금지
TODAY="2026-07-08"  # 위험!
TODAY=$(date +%Y-%m-%d)  # 위험! (TZ 없으면 UTC → 하루 밀림)

# ✅ 항상 KST 시스템 시간에서 계산
TODAY=$(TZ=Asia/Seoul date +%Y-%m-%d)   # 예: 2026-07-13
DAY_NUM=$(TZ=Asia/Seoul date +%d)       # 예: 13
DAY_KOR=$(TZ=Asia/Seoul date +%w | awk '{d[0]="일"; d[1]="월"; d[2]="화"; d[3]="수"; d[4]="목"; d[5]="금"; d[6]="토"; print d[$1]}')  # 요일

# 발송 직전 눈으로 재확인 (KST 기준 날짜+요일 한 줄 출력)
TZ=Asia/Seoul date +"발송 기준일: %Y-%m-%d (%a) KST"
```

#### 2️⃣ 검증 체크리스트 (발송 전 필수)
- [ ] **모든 항목의 발행일·버전·상태를 1차 소스로 교차확인했는가** (아래 0️⃣ 팩트 검증 게이트 통과) — 이걸 못 지키면 나머지는 의미 없음
- [ ] Slack 메시지 헤더: `:newspaper: 오늘의 주요 소식 | YYYY-MM-DD (요일)` 형식 확인
- [ ] HTML 섹션: `<section class="news-day" data-date="YYYY-MM-DD">` + `<h2>📰 YYYY-MM-DD (요일)</h2>` 일치 확인
- [ ] Slack과 HTML의 날짜/요일이 동일한지 검증

#### 0️⃣ 팩트 검증 게이트 (발송 전 반드시 — 통과 못 하면 그 항목은 버린다)

> ⚠️ 이 루틴의 이름은 **news**다. 뉴스가 틀리면 존재 이유가 없다.
> **WebSearch 요약을 그대로 믿지 마라.** 검색 요약은 추측·환각·과거 버전이
> 섞인 2차 가공물이다. 날짜·버전·수치·"출시/복원/중단" 같은 상태는
> **전부 검증 가능한 팩트**이므로, 실으려면 반드시 1차 소스로 확인한다.

**검증 채널 사다리 (위에서부터 시도, 어느 하나로 확인되면 1차 소스로 인정):**
1. 공식 도메인 WebFetch (anthropic.com, openai.com, nodejs.org, devblogs.microsoft.com, webkit.org, nextjs.org, developer.chrome.com, web.dev, developer.mozilla.org, huggingface.co 등)
   - **HTML & CSS는** `web.dev`(특히 **Baseline** 페이지)·`developer.mozilla.org`(MDN)·`developer.chrome.com`·`caniuse.com`도 기능 지원/편입 여부의 **1차 소스로 인정**한다.
   - **오픈웨이트 모델은** `huggingface.co` 모델 카드가 사양·라이선스·공개일의 1차 소스다(검색 요약의 파라미터·컨텍스트·가격 수치는 믿지 말고 카드 원문으로 대조).
2. 1이 403 등으로 막히면 → **그 프로젝트의 공식 GitHub 저장소**(github.com은 이 환경에서 fetch 가능)의
   Releases/Tags/CHANGELOG로 확인. 이것도 1차 소스다.
   (예: vercel/next.js, microsoft/TypeScript, nodejs/node, WebKit/WebKit, facebook/react, denoland/deno, oven-sh/bun)
3. 둘 다 불가 → `[접근 실패]`로 드롭. 규제·기업 동향처럼 GitHub 저장소가 없는 소식은
   공식 도메인이 열려야만 통과 가능 — 반복되면 환경 네트워크 정책에 도메인 추가가 근본 해결.
   - ⚠️ **`openai.com`은 현재 403으로 반복 차단되어 OpenAI 소식(학술연구자용 ChatGPT·GPT-5.6 등)이 매번 `[접근 실패]`로 드롭되고 있다. 근본 해결책은 환경(Claude Code on the web) 네트워크 허용목록에 `openai.com` 추가 — 이는 env 설정 변경 사항으로 프롬프트/코드로는 해결 불가하다.**

각 항목마다 다음을 확인하고, **하나라도 확인 안 되면 그 항목은 싣지 않는다(fail-closed):**
- [ ] **발행일 (분야별 시의성 차등)**: 공식 블로그/릴리스 노트/1차 소스 URL로 날짜 확인. **1년 전 버전을 새 소식으로 싣지 않는다** (예: `vX.Y.Z` 릴리스는 연도까지 확인).
  - **AI**: "최근 24시간~수일" 기준 — 모델·규제 소식이 거의 매일 나오므로 빡빡하게.
  - **프론트엔드·백엔드·HTML & CSS**: "최근 **1~2주**" 기준 — 안정 릴리스·스펙 소식이 주 단위 주기라 하루 기준이면 매번 빈다. 단 1~2주를 넘긴 건 드롭.
- [ ] **버전·수치**: "N배 빨라짐", "N조 파라미터", "N점" 같은 수치는 **공식 발표 수치**를 쓴다. 블로그마다 다른 값이 돌면 공식(제조사/저자) 값 우선, 없으면 수치를 빼고 정성적으로만 쓴다.
- [ ] **상태**: "출시됨 / 중단됨 / 복원됨 / 예정" 같은 상태는 가장 최신 1차 소스 기준으로 확인. 상태는 며칠 만에 뒤집힐 수 있으니 반드시 최신 확인.
- [ ] 검증에 쓴 1차 소스 URL을 항목 meta의 `<a>`에 실제로 반영.

#### 3️⃣ 뉴스 검색 팁
- **AI**: 개발 도구뿐 아니라 프론티어 모델, 규제, 수출통제, 기업 동향 포함
- **분야 균형 — "뉴스"의 정의를 넓게 잡는다 (AI 편중 방지):** 프론트엔드·백엔드·HTML & CSS는 *신규 안정 릴리스*에만 묶지 말고 다음도 후보로 본다 — 주요 **RFC·스펙 제안**, 대형 **공식 블로그 발표**, Web Platform **Baseline 편입**, 표준/명세 변경, 그리고 **RC·베타·프리뷰(canary)**(반드시 "RC/베타/canary"라고 라벨을 붙여 안정판과 구분). 이들도 0️⃣ 게이트(1차 소스 확인)는 안정판과 **동일하게** 통과해야 한다.
  - 왜: AI는 오픈웨이트·프론티어 모델이 거의 매일 쏟아지지만 프레임워크 안정판은 수 주 주기여서, "신규 안정 릴리스"만 고집하면 매일 AI만 남는다. 정확성 기준은 그대로 두되 **커버리지 정의만** 넓혀 균형을 맞춘다.
- **영어/한국어 균형**: GeekNews(news.hada.io) 등 한국 IT 소스도 확인
- **큰 주장 검증**: 모델 출시·버전·날짜·수치·상태는 0️⃣ 팩트 검증 게이트를 반드시 통과 (검증 안 되면 버린다)
- **중복 회피**: Slack #with 최근 2주 메시지 확인 후 이미 다룬 주제 제외

#### 4️⃣ Slack 발송 형식
```
:newspaper: 오늘의 주요 소식 | YYYY-MM-DD (요일)

:robot_face: *AI*
• [제목] | [발행일] - [한 줄 요약]
• ...

:art: *프론트엔드 (React · Next.js · TypeScript)*
• ...

:gear: *백엔드*
• ...

:lipstick: *HTML & CSS*
• ...

<https://mz-superek.github.io/frontend/news/index.html|더 자세한 내용을 보려면 여기로 이동하세요>
```

#### 5️⃣ HTML 아카이브 업데이트
- 파일: `news/index.html`
- 삽입 위치: `<!-- NEWS:INSERT-AFTER` 주석 직후
- 구조: 최신 날짜가 항상 맨 위
- 이미 같은 날짜 섹션이 있으면 **교체** (추가 아님)
- HTML 특수문자 이스케이프: `< → &lt;`, `> → &gt;`, `& → &amp;`

#### 6️⃣ Git 규칙 (실행 환경별로 다름 — 중요)
- **code 루틴 (daily-news / daily-terms — 격리 컨테이너에서 실행)**:
  저장만 하면 세션 종료와 함께 편집분이 증발한다. 반드시 **자기 아카이브 파일 하나만** 커밋·푸시한다:
  `git add news/index.html`(또는 `terms/index.html`) → commit → `git pull --rebase origin main` → `git push origin main`
  (push 실패 시 2s/4s/8s 재시도. 다른 파일은 절대 커밋하지 않는다.)
  커밋 메시지: `chore(daily-news): 뉴스 아카이브 (YYYY-MM-DD)` / `chore(daily-terms): 용어 아카이브 (YYYY-MM-DD)`
- **Cowork/마운트 세션 (daily-study, daily-commit)**:
  마운트 폴더(/sessions/*/mnt/*)에서는 git 명령 금지(unlink 불가 → 락파일 축적).
  daily-study는 마운트에 파일 저장까지만, 커밋·푸시는 daily-commit이 /tmp clone에서 처리.
- **daily-commit의 동기화 방향 (충돌 방지의 핵심)**:
  `news/` `terms/`는 **repo가 정본** → repo에서 마운트로 내려받기(rsync, 마운트는 unlink 불가이므로 --delete 금지).
  `index.html` `study/`는 **마운트가 정본** → repo로 올려 커밋. 메시지: `chore(daily): 데일리 콘텐츠 자동 갱신 (YYYY-MM-DD)`
- **브랜치 생성 금지.** 모든 작업은 `main`에서만. `claude/*` 등 작업 브랜치를 만들어 푸시하지 말 것.

#### 7️⃣ 자동 루틴 체크사항
발송 전 반드시 확인:
```bash
# 날짜 일치 검증
SLACK_DATE=$(grep "오늘의 주요 소식" /tmp/slack_news.txt | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}")
HTML_DATE=$(grep "data-date=" /tmp/frontend-news/news/index.html | head -1 | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}")

if [[ "$SLACK_DATE" != "$HTML_DATE" ]]; then
  echo "❌ 날짜 불일치: Slack=$SLACK_DATE, HTML=$HTML_DATE"
  exit 1
fi
echo "✅ 날짜 검증 완료: $SLACK_DATE"
```

---

## 참고
- Slack #with 채널 ID: `C0B98E8CKMF`
- News 저장소: `github.com/mz-superek/frontend`
- 사용자 이메일: `superek@mz.co.kr`
