import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { resetServerData } from "./mock/api";
import { TeamMemberList } from "./problems/01-team-members/TeamMemberList";
import { Cart } from "./problems/02-cart/Cart";
import { InviteForm } from "./problems/03-invite-form/InviteForm";
import { TeamDashboard } from "./problems/04-dashboard/TeamDashboard";
import { SettingsPanel } from "./problems/05-settings/SettingsPanel";
import { OrderTable } from "./problems/06-orders/OrderTable";

/** 문제 목록. 새 문제가 추가되면 여기에 한 줄 늘린다. */
const PROBLEMS = [
  {
    id: "01-team-members",
    title: "01. 팀 멤버 관리 목록",
    stack: "TanStack Query v5 · useInfiniteQuery · 낙관적 업데이트",
    Component: TeamMemberList,
  },
  {
    id: "02-cart",
    title: "02. 장바구니 주문 요약",
    stack: "순수 React 상태 · useState · useEffect · 파생 상태",
    Component: Cart,
  },
  {
    id: "03-invite-form",
    title: "03. 팀원 초대 폼",
    stack: "폼 · 유효성 검사 · 제출 상태 · 브라우저 기본 동작",
    Component: InviteForm,
  },
  {
    id: "04-dashboard",
    title: "04. 팀 활동 대시보드",
    stack: "렌더링 성능 · memo · useMemo · useCallback",
    Component: TeamDashboard,
  },
  {
    id: "05-settings",
    title: "05. 알림 설정 패널",
    stack: "useEffect 오남용 · 파생 상태 · 이벤트 처리",
    Component: SettingsPanel,
  },
  {
    id: "06-orders",
    title: "06. 주문 관리 테이블",
    stack: "필터 · 정렬 · 다중 선택 · 페이지네이션 조합",
    Component: OrderTable,
  },
] as const;

/**
 * 렌더링 중 터진 에러를 잡아서 화면에 보여준다.
 * 이게 없으면 크래시할 때 흰 화면만 남아서 "뭐가 터졌는지" 알기 어렵다.
 * (에러 경계는 클래스 컴포넌트로만 만들 수 있다 — 훅 버전이 아직 없다.)
 */
class ErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] 렌더링이 깨졌습니다:", error.message, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <h3>💥 렌더링이 깨졌습니다</h3>
          <pre>{this.state.error.message}</pre>
          <p className="hint">
            콘솔의 스택 트레이스를 보면 어느 줄에서 터졌는지 나옵니다.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [selected, setSelected] = useState<(typeof PROBLEMS)[number]["id"]>(
    PROBLEMS[0].id,
  );
  // 값이 바뀌면 문제 컴포넌트를 완전히 새로 마운트한다(초기 상태부터 다시 재현하려고)
  const [resetKey, setResetKey] = useState(0);
  const queryClient = useQueryClient();

  /** 서버 데이터·캐시·컴포넌트를 모두 초기 상태로 되돌린다. */
  const handleReset = () => {
    resetServerData(); // 가짜 서버를 초기값으로
    queryClient.clear(); // 캐시를 통째로 비우기
    setResetKey((n) => n + 1); // 문제 컴포넌트 재마운트
  };

  const problem = PROBLEMS.find((p) => p.id === selected) ?? PROBLEMS[0];
  const Problem = problem.Component;

  return (
    <div className="app">
      <header>
        <h1>코테 연습장</h1>
        <p className="sub">AI가 쓴 코드를 검증하는 연습. 나는 리뷰어다.</p>
      </header>

      <nav className="tabs">
        {PROBLEMS.map((p) => (
          <button
            key={p.id}
            className={p.id === selected ? "tab active" : "tab"}
            onClick={() => setSelected(p.id)}
          >
            {p.title}
          </button>
        ))}
        <button className="tab reset" onClick={handleReset}>
          ↻ 처음부터 다시 (서버·캐시 초기화)
        </button>
      </nav>

      <p className="stack">{problem.stack}</p>

      <ErrorBoundary key={resetKey} onReset={handleReset}>
        <Problem />
      </ErrorBoundary>
    </div>
  );
}
