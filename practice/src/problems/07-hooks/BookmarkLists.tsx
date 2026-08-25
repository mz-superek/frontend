import { memo, useRef } from 'react';
import { useSelection } from './useSelection';
import { useFavorites } from './useFavorites';

type Doc = {
  id: string;
  title: string;
  author: string;
};

const RECOMMENDED: Doc[] = [
  { id: 'd1', title: 'React 렌더링 최적화 가이드', author: '김민수' },
  { id: 'd2', title: 'TanStack Query 캐시 전략', author: '이서연' },
  { id: 'd3', title: '폼 유효성 검사 패턴', author: '박지훈' },
  { id: 'd4', title: '타입스크립트 제네릭 입문', author: '최유진' },
];

const MINE: Doc[] = [
  { id: 'm1', title: '주간 회고 2026-08-03', author: '나' },
  { id: 'm2', title: '배포 체크리스트', author: '나' },
  { id: 'm3', title: '온보딩 메모', author: '나' },
  { id: 'm4', title: '장애 대응 기록', author: '나' },
];

/** 문서 한 줄. props가 그대로면 다시 그리지 않는다. */
const DocRow = memo(function DocRow({
  doc,
  checked,
  favorite,
  onToggle,
}: {
  doc: Doc;
  checked: boolean;
  favorite: boolean;
  onToggle: (id: string) => void;
}) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <li className='row'>
      <div>
        <label className='checkline'>
          <input type='checkbox' checked={checked} onChange={() => onToggle(doc.id)} />
          <strong>
            {favorite ? '★ ' : ''}
            {doc.title}
          </strong>
        </label>
        <span className='email'>{doc.author}</span>
      </div>
      <span className='badge'>렌더 {renderCount.current}</span>
    </li>
  );
});

/** 문서 목록 하나. 선택과 즐겨찾기 로직은 훅에서 가져다 쓴다. */
function DocList({
  title,
  docs,
  favorites,
  isFavorite,
  addMany,
}: {
  title: string;
  docs: Doc[];
  favorites: string[];
  isFavorite: (id: string) => boolean;
  addMany: (ids: string[]) => void;
}) {
  const { selected, isSelected, toggle, clear } = useSelection();

  const handleBookmark = () => {
    addMany(selected);
    clear();
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{title}</h3>
      <p className='hint'>
        {selected.length}건 선택됨 · 즐겨찾기 {favorites.length}개
      </p>

      <button type='button' onClick={handleBookmark} disabled={selected.length === 0}>
        선택한 문서 즐겨찾기
      </button>

      <ul className='list'>
        {docs.map((doc) => (
          <DocRow key={doc.id} doc={doc} checked={isSelected(doc.id)} favorite={isFavorite(doc.id)} onToggle={toggle} />
        ))}
      </ul>
    </section>
  );
}

/** 두 목록이 같은 훅을 가져다 쓴다. */
export function BookmarkLists() {
  const { favorites, isFavorite, addMany } = useFavorites();
  return (
    <div className='panel'>
      <DocList title='추천 문서' docs={RECOMMENDED} favorites={favorites} isFavorite={isFavorite} addMany={addMany} />
      <DocList title='내 문서' docs={MINE} favorites={favorites} isFavorite={isFavorite} addMany={addMany} />
    </div>
  );
}
