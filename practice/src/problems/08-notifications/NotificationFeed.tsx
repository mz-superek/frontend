import { useState, useEffect } from 'react';

type Notification = {
  id: string;
  text: string;
  createdAt: string; // ISO 문자열
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** 화면을 처음 불러온 시각을 기준으로 알림 시각을 만든다. */
const base = Date.now();
const ago = (ms: number) => new Date(base - ms).toISOString();

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', text: '박지훈님이 회고 문서에 댓글을 달았습니다', createdAt: ago(-10 * MINUTE) },
  { id: 'n2', text: '배포가 완료되었습니다 (v2.4.1)', createdAt: ago(30 * 1000) },
  { id: 'n3', text: '김민수님이 초대를 수락했습니다', createdAt: ago(3 * MINUTE) },
  { id: 'n4', text: '주간 리포트가 준비되었습니다', createdAt: ago(2 * HOUR) },
  { id: 'n5', text: '이서연님이 문서를 공유했습니다', createdAt: ago(9 * HOUR) },
  { id: 'n6', text: '결제 수단이 곧 만료됩니다', createdAt: ago(20 * HOUR) },
  { id: 'n7', text: '최유진님이 팀에 참여했습니다', createdAt: ago(30 * HOUR) },
  { id: 'n8', text: '월간 사용량 리포트', createdAt: ago(5 * 24 * HOUR) },
];

/** 보관 정책 기준일. 알림은 이 날짜로부터 30일 뒤에 삭제된다. */
const RETENTION_BASE = new Date('2026-08-01T00:00:00+09:00');

/** 날짜에 일수를 더한다. */
function addDays(date: Date, days: number): Date {
  const copy = new Date(date); // 같은 시각을 가진 새 Date 객체

  copy.setDate(copy.getDate() + days);

  return copy;
}

/** "3분 전" 같은 상대 시간 문자열을 만든다. */
function formatRelative(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const minutes = Math.floor(diff / MINUTE);
  if (diff < 0) return '예정됨';
  if (minutes === 0) return '방금';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

/**
 * 알림 피드.
 *
 * - 알림마다 "몇 분 전"인지 보여준다
 * - 오늘 온 것만 걸러 볼 수 있다
 * - 아래에 보관 만료일을 안내한다
 */
export function NotificationFeed() {
  const [onlyToday, setOnlyToday] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, []);

  const arrived = NOTIFICATIONS.filter((n) => new Date(n.createdAt).getTime() <= now);

  const visible = onlyToday ? arrived.filter((n) => now - new Date(n.createdAt).getTime() < 24 * HOUR) : arrived;

  const expiry = addDays(RETENTION_BASE, 30);

  return (
    <div className='panel'>
      <div className='field'>
        <label className='checkline'>
          <input type='checkbox' checked={onlyToday} onChange={(e) => setOnlyToday(e.target.checked)} />
          오늘 온 알림만 보기
        </label>
      </div>

      <p className='hint'>{visible.length}건</p>

      <ul className='list'>
        {visible.map((n) => (
          <li key={n.id} className='row'>
            <div>
              <strong>{n.text}</strong>
              <span className='email'>{new Date(n.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <span className='badge'>{formatRelative(n.createdAt, now)}</span>
          </li>
        ))}
      </ul>

      <p className='hint'>보관 만료일: {expiry.toLocaleDateString('ko-KR')}</p>
    </div>
  );
}
