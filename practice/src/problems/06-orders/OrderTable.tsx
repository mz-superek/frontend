import { useState } from 'react';

type OrderStatus = 'pending' | 'processing' | 'done';

type Order = {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: OrderStatus;
};

/** 서버에서 받아온 주문 목록이라고 치자. 화면에서 바꾸지 않는다. */
const ORDERS: Order[] = [
  { id: 'o1', customer: '김민수', amount: 128000, date: '2026-08-01', status: 'pending' },
  { id: 'o2', customer: '이서연', amount: 45000, date: '2026-07-28', status: 'done' },
  { id: 'o3', customer: '박지훈', amount: 320000, date: '2026-08-05', status: 'processing' },
  { id: 'o4', customer: '최유진', amount: 89000, date: '2026-07-30', status: 'pending' },
  { id: 'o5', customer: '정하늘', amount: 15000, date: '2026-08-03', status: 'done' },
  { id: 'o6', customer: '강도윤', amount: 267000, date: '2026-07-25', status: 'pending' },
  { id: 'o7', customer: '윤서아', amount: 73000, date: '2026-08-06', status: 'processing' },
  { id: 'o8', customer: '임재현', amount: 51000, date: '2026-07-27', status: 'pending' },
  { id: 'o9', customer: '한지우', amount: 198000, date: '2026-08-02', status: 'pending' },
  { id: 'o10', customer: '오세훈', amount: 34000, date: '2026-07-29', status: 'processing' },
  { id: 'o11', customer: '신예은', amount: 412000, date: '2026-08-04', status: 'pending' },
  { id: 'o12', customer: '배준호', amount: 62000, date: '2026-07-26', status: 'done' },
];

const PAGE_SIZE = 5;

const STATUS_LABEL: { [key in OrderStatus]: string } = {
  pending: '대기',
  processing: '처리중',
  done: '완료',
};

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/**
 * 주문 관리 테이블.
 *
 * - 상태로 거르기 / 정렬 바꾸기
 * - 체크박스로 여러 건 고르고, 골라둔 것을 한 번에 완료 처리
 * - 5건씩 페이지 나누기
 */
export function OrderTable() {
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [sortBy, setSortBy] = useState<'none' | 'amount' | 'date'>('none');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const selectedOrders = ORDERS.filter((o) => selected.includes(o.id));

  const statusOf = (order: Order): OrderStatus => (completed.includes(order.id) ? 'done' : order.status);

  // 정렬 → 거르기 순서로 목록을 만든다
  const sorted =
    sortBy === 'none'
      ? [...ORDERS]
      : [...ORDERS].sort((a, b) => (sortBy === 'amount' ? b.amount - a.amount : a.date.localeCompare(b.date)));

  const filtered = sorted.filter((order) => status === 'all' || statusOf(order) === status);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const bulkComplete = () => {
    console.log(`%c[bulk] 완료 처리 ${selected.length}건 →`, 'color:#16a34a', selected.join(', '));
    setCompleted((prev) => [...prev, ...selected]);
    setSelected([]);
  };

  return (
    <div className='panel'>
      <div className='field'>
        <label htmlFor='status'>상태</label>
        <select
          id='status'
          className='search'
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | OrderStatus);
            setPage(1);
            setSelected([]);
          }}
        >
          <option value='all'>전체</option>
          <option value='pending'>대기</option>
          <option value='processing'>처리중</option>
          <option value='done'>완료</option>
        </select>
      </div>

      <div className='field'>
        <label htmlFor='sort'>정렬</label>
        <select
          id='sort'
          className='search'
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'none' | 'amount' | 'date');
            setPage(1);
          }}
        >
          <option value='none'>기본순</option>
          <option value='amount'>금액 높은순</option>
          <option value='date'>날짜 오래된순</option>
        </select>
      </div>

      <p className='hint'>
        {filtered.length}건 중 {pageItems.length}건 표시 ·{' '}
        <strong>
          {selected.length}건 선택됨{' '}
          {selected.length > 0 ? `- ${selectedOrders.map((o) => o.customer).join(', ')}` : ''}
        </strong>
      </p>

      <button type='button' onClick={bulkComplete} disabled={selected.length === 0}>
        선택한 주문 완료 처리
      </button>

      <ul className='list'>
        {pageItems.map((order) => (
          <li key={order.id} className='row'>
            <div>
              <label className='checkline'>
                <input
                  type='checkbox'
                  checked={selected.includes(order.id)}
                  onChange={() => toggleOne(order.id)}
                  disabled={statusOf(order) === 'done'}
                />
                <strong>{order.customer}</strong>
              </label>
              <span className='email'>
                {order.date} · {won(order.amount)}
              </span>
            </div>
            <span className={`badge ${statusOf(order) === 'done' ? 'admin' : ''}`}>
              {STATUS_LABEL[statusOf(order)]}
            </span>
          </li>
        ))}
      </ul>

      <div className='tabs'>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} className={`tab ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
