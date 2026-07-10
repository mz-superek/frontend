# Claude Code 자동화 가이드

## 📰 Daily Dev News Curation (매일 아침 자동 실행)

### 목적
AI, 프론트엔드, 백엔드, HTML&CSS 분야의 최근 24시간 핵심 소식을 자동으로 수집, 큐레이션하여 Slack #with 채널에 발송하고 HTML 뉴스 아카이브에 기록.

### 핵심 규칙

#### 1️⃣ 날짜/요일 자동 계산 (반드시 동적 계산)
```bash
# ❌ 절대 하드코딩하지 말 것
TODAY="2026-07-08"  # 위험!

# ✅ 항상 시스템 시간에서 계산
TODAY=$(date +%Y-%m-%d)              # 예: 2026-07-09
DAY_NUM=$(date +%d)                  # 예: 09
DAY_KOR=$(date +%w | awk '{d[0]="일"; d[1]="월"; d[2]="화"; d[3]="수"; d[4]="목"; d[5]="금"; d[6]="토"; print d[$1]}')  # 요일
```

#### 2️⃣ 검증 체크리스트 (발송 전 필수)
- [ ] Slack 메시지 헤더: `:newspaper: 오늘의 주요 소식 | YYYY-MM-DD (요일)` 형식 확인
- [ ] HTML 섹션: `<section class="news-day" data-date="YYYY-MM-DD">` + `<h2>📰 YYYY-MM-DD (요일)</h2>` 일치 확인
- [ ] Slack과 HTML의 날짜/요일이 동일한지 검증

#### 3️⃣ 뉴스 검색 팁
- **AI**: 개발 도구뿐 아니라 프론티어 모델, 규제, 수출통제, 기업 동향 포함
- **영어/한국어 균형**: GeekNews(news.hada.io) 등 한국 IT 소스도 확인
- **큰 주장 검증**: 모델 출시 등 주요 뉴스는 1차 소스로 확인 후 반영
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

#### 6️⃣ Git 규칙 (중요 — 콘텐츠 작업은 git 금지)
- **콘텐츠 작업(daily-news / daily-terms / daily-study)은 git 명령을 절대 실행하지 않는다.**
  HTML 파일 저장까지만. 커밋·푸시는 평일 8:30 `daily-commit` 스케줄이 단독으로 처리한다.
  (동시 커밋으로 인한 `.git/index.lock` 충돌 방지)
- **브랜치 생성 금지.** 모든 작업은 `main`에서만 한다. `claude/*` 등 작업 브랜치를 만들어 푸시하지 말 것.
  main에 직접 푸시할 수 없는 환경이라면 파일 저장까지만 하고 종료한다.
- 커밋이 필요한 유일한 작업(daily-commit)의 커밋 메시지 형식:
  `chore(daily): 데일리 콘텐츠 자동 갱신 (YYYY-MM-DD)`

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
