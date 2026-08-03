/**
 * 가짜 서버(mock API).
 *
 * 이 파일은 "서버" 역할이라 문제 코드가 아니다. 고치지 말고, 읽어서
 * "서버가 어떻게 동작하는지" 파악하는 용도로 쓴다. 검증에 도움 되도록
 * 일부러 아래 성질을 넣어놨다.
 *
 *  - 응답이 느리다. 그리고 지연 시간이 요청마다 다르다(결정적으로).
 *    → 늦게 보낸 요청이 먼저 도착하는 상황을 재현할 수 있다.
 *  - 특정 입력에서 반드시 실패한다(랜덤 아님).
 *    → 에러/롤백 처리를 항상 같은 방법으로 재현할 수 있다.
 *  - 모든 요청을 콘솔에 찍는다.
 *    → 요청이 몇 번 갔는지, 어떤 파라미터로 갔는지 눈으로 확인할 수 있다.
 */

export type Role = "admin" | "member";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type MembersPage = {
  items: Member[];
  /** 다음 페이지 번호. 마지막 페이지면 null. */
  nextPage: number | null;
};

const PAGE_SIZE = 4;

const INITIAL_MEMBERS: Member[] = [
  { id: "u1", name: "김민수", email: "minsu@example.com", role: "admin" },
  { id: "u2", name: "이서연", email: "seoyeon@example.com", role: "member" },
  { id: "u3", name: "박지훈", email: "jihoon@example.com", role: "member" },
  { id: "u4", name: "최유진", email: "yujin@example.com", role: "member" },
  { id: "u5", name: "정하늘", email: "haneul@example.com", role: "admin" },
  { id: "u6", name: "강도윤", email: "doyun@example.com", role: "member" },
  { id: "u7", name: "윤서아", email: "seoa@example.com", role: "member" },
  { id: "u8", name: "임재현", email: "jaehyun@example.com", role: "member" },
  { id: "u9", name: "한지우", email: "jiwoo@example.com", role: "member" },
  { id: "u10", name: "오세훈", email: "sehun@example.com", role: "member" },
];

const STORAGE_KEY = "practice:members-db";

/**
 * 서버 데이터를 sessionStorage에 보관한다.
 *
 * 왜? 모듈 변수에만 들고 있으면 브라우저를 새로고침할 때 초기값으로 돌아가서,
 * "새로고침 = 서버에 다시 물어보기"라는 검증이 성립하지 않는다.
 * sessionStorage는 새로고침을 넘겨서 살아남고 탭을 닫으면 사라지므로,
 * 연습 한 세션 동안만 서버가 상태를 기억하는 셈이 된다.
 */
function loadDB(): Member[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Member[];
  } catch {
    // 저장소를 못 읽으면 그냥 초기값으로 시작한다
  }
  return INITIAL_MEMBERS.map((member) => ({ ...member }));
}

function saveDB() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch {
    // 저장 실패는 무시한다(연습장이라 이 값을 꼭 지킬 필요는 없다)
  }
}

/** 서버에 저장된 원본 데이터. mutation이 성공하면 여기가 실제로 바뀐다. */
let DB: Member[] = loadDB();

/** 서버를 초기 상태로 되돌린다. 화면의 "처음부터 다시" 버튼이 호출한다. */
export function resetServerData() {
  DB = INITIAL_MEMBERS.map((member) => ({ ...member }));
  saveDB();
  console.log("%c[api] 서버 데이터를 초기 상태로 되돌렸습니다.", "color:#f59e0b");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 검색어가 짧을수록 느리게 응답한다.
 * "김"(1글자, 900ms)을 보낸 뒤 "김민"(2글자, 600ms)을 보내면
 * 나중에 보낸 요청이 먼저 도착한다.
 */
function delayFor(search: string): number {
  const trimmed = search.trim();
  if (trimmed.length === 0) return 1000;
  return Math.max(300, 1200 - trimmed.length * 300);
}

let requestSeq = 0;

export async function fetchMembers(params: {
  search: string;
  page: number;
}): Promise<MembersPage> {
  const { search, page } = params;
  const seq = ++requestSeq;
  const delay = delayFor(search);

  console.log(
    `%c[api #${seq}] → fetchMembers  search="${search}"  page=${page}  (${delay}ms 후 응답)`,
    "color:#2563eb",
  );

  await sleep(delay);

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? DB.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          m.email.toLowerCase().includes(keyword),
      )
    : DB;

  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < filtered.length;

  const result: MembersPage = {
    // 서버는 매번 새 객체를 준다(실제 네트워크 응답과 같게).
    items: items.map((m) => ({ ...m })),
    nextPage: hasMore ? page + 1 : null,
  };

  console.log(
    `%c[api #${seq}] ← 응답  search="${search}" page=${page}  ${result.items.length}건  nextPage=${result.nextPage}`,
    "color:#16a34a",
  );

  return result;
}

/**
 * 역할을 바꾼다.
 * ⚠️ id가 "u3"(박지훈)이면 항상 실패한다. 에러/롤백 검증용 고정 케이스.
 */
export async function updateMemberRole(params: {
  id: string;
  role: Role;
}): Promise<Member> {
  const { id, role } = params;
  const seq = ++requestSeq;

  console.log(
    `%c[api #${seq}] → updateMemberRole  id=${id}  role=${role}  (800ms 후 응답)`,
    "color:#a855f7",
  );

  await sleep(800);

  if (id === "u3") {
    console.log(
      `%c[api #${seq}] ← 실패  id=${id} (권한 없음 — 항상 실패하는 계정)`,
      "color:#dc2626",
    );
    throw new Error("권한이 없어 역할을 변경할 수 없습니다.");
  }

  const target = DB.find((m) => m.id === id);
  if (!target) throw new Error("사용자를 찾을 수 없습니다.");

  target.role = role;
  saveDB();

  console.log(
    `%c[api #${seq}] ← 성공  id=${id}  role=${role} (서버 데이터 변경됨)`,
    "color:#16a34a",
  );

  return { ...target };
}
