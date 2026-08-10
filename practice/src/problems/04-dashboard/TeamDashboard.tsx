import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { computeTeamScore } from '../../mock/heavy';

type Member = {
  id: string;
  name: string;
  team: string;
  likes: number;
};

const MEMBERS: Member[] = [
  { id: 'm1', name: '김민수', team: '플랫폼', likes: 3 },
  { id: 'm2', name: '이서연', team: '플랫폼', likes: 5 },
  { id: 'm3', name: '박지훈', team: '프론트엔드', likes: 1 },
  { id: 'm4', name: '최유진', team: '프론트엔드', likes: 8 },
  { id: 'm5', name: '정하늘', team: '프론트엔드', likes: 2 },
  { id: 'm6', name: '강도윤', team: '백엔드', likes: 6 },
  { id: 'm7', name: '윤서아', team: '백엔드', likes: 0 },
  { id: 'm8', name: '임재현', team: '백엔드', likes: 4 },
  { id: 'm9', name: '한지우', team: '디자인', likes: 7 },
  { id: 'm10', name: '오세훈', team: '디자인', likes: 2 },
  { id: 'm11', name: '신예은', team: 'QA', likes: 5 },
  { id: 'm12', name: '배준호', team: 'QA', likes: 1 },
];

/**
 * 한 사람 줄.
 *
 * memo로 감싸서, props가 그대로면 다시 그리지 않게 했다.
 * 자기가 몇 번 다시 그려졌는지 화면에 표시한다.
 */
const MemberRow = memo(function MemberRow({
  member,
  likeCount,
  onLike,
}: {
  member: Member;
  likeCount: number;
  onLike: (id: string) => void;
}) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <li className='row' style={{ opacity: 1 }}>
      <div>
        <strong>{member.name}</strong>
        <span className='email'>
          {member.team} · 좋아요 {likeCount}
        </span>
      </div>
      <div className='actions'>
        <span className='badge'>렌더 {renderCount.current}</span>
        <button onClick={() => onLike(member.id)}>좋아요</button>
      </div>
    </li>
  );
});

/** 검색 도움말을 접었다 폈다 하는 패널. */
const FilterPanel = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className='field'>
      <button type='button' onClick={() => setExpanded((v) => !v)}>
        {expanded ? '도움말 접기' : '도움말 펼치기'}
      </button>
      {expanded && <p className='hint'>이름뿐 아니라 팀 이름으로도 검색할 수 있어요. (예: 프론트엔드)</p>}
    </div>
  );
};

const SearchInput = memo(function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className='search'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder='이름 또는 팀 검색'
    />
  );
});
/**
 * 팀 활동 대시보드.
 *
 * - 이름이나 팀으로 검색
 * - 사람마다 좋아요를 누를 수 있다
 * - 팀 점수(무거운 계산)를 위에 보여준다
 * - "보이는 사람 초기화"로 지금 화면에 있는 사람들의 좋아요만 되돌린다
 */
export function TeamDashboard() {
  const [search, setSearch] = useState('');
  const [likes, setLikes] = useState<{ [id: string]: number }>({});

  // 화면에 보여줄 목록 — 검색어로 거르고, 눌린 좋아요를 반영한다
  const visible = MEMBERS.filter((m) => m.name.includes(search) || m.team.includes(search));

  // 무거운 계산이라 useMemo로 캐싱해둔다
  const teamScore = useMemo(() => computeTeamScore(MEMBERS), [MEMBERS]);

  const handleLike = useCallback((id: string) => {
    const base = MEMBERS.find((m) => m.id === id)?.likes ?? 0;
    setLikes((prev) => ({ ...prev, [id]: (prev[id] ?? base) + 1 }));
  }, []);

  const resetVisible = () => {
    setLikes((prev) => {
      const next = { ...prev };
      visible.forEach((m) => {
        delete next[m.id];
      });
      return next;
    });
  };

  return (
    <div className='panel'>
      {/* search 디바운스 필요 */}
      <SearchInput value={search} onChange={setSearch} />

      <FilterPanel />

      <p className='hint'>
        팀 점수: <strong>{teamScore}</strong> · 보이는 사람 {visible.length}명
      </p>

      <button type='button' onClick={resetVisible}>
        보이는 사람 좋아요 초기화
      </button>

      <ul className='list'>
        {visible.map((member) => (
          <MemberRow key={member.id} member={member} likeCount={likes[member.id] ?? member.likes} onLike={handleLike} />
        ))}
      </ul>
    </div>
  );
}
