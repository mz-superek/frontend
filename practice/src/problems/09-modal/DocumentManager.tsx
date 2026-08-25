import { useEffect, useRef, useState } from 'react';

type Doc = {
  id: string;
  title: string;
  size: string;
};

const DOCS: Doc[] = [
  { id: 'f1', title: '2026년 예산안 최종.xlsx', size: '2.4MB' },
  { id: 'f2', title: '온보딩 가이드.pdf', size: '880KB' },
  { id: 'f3', title: '장애 대응 매뉴얼.md', size: '31KB' },
  { id: 'f4', title: '브랜드 로고 모음.zip', size: '14MB' },
  { id: 'f5', title: '고객 인터뷰 녹취.txt', size: '126KB' },
  { id: 'f6', title: 'API 명세서 v3.pdf', size: '1.2MB' },
  { id: 'f7', title: '회고 템플릿.docx', size: '48KB' },
  { id: 'f8', title: '배포 스크립트.sh', size: '6KB' },
  { id: 'f9', title: '디자인 시스템 토큰.json', size: '92KB' },
  { id: 'f10', title: '분기 실적 보고.pptx', size: '8.1MB' },
];

/**
 * 삭제 확인 다이얼로그.
 *
 * - 배경을 어둡게 덮고 가운데에 뜬다
 * - ESC를 누르거나 바깥을 클릭하면 닫힌다
 * - 열려 있는 동안 뒤쪽 목록은 스크롤되지 않는다
 */
function ConfirmDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  // ESC로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  // 뒤쪽 스크롤 잠그기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector('button')?.focus(); // 다이얼로그가 열리면 포커스를 가져간다
    return () => {
      previouslyFocused?.focus(); // 다이얼로그가 닫히면 이전 포커스를 복원한다
    };
  }, []);

  return (
    <div className='overlay' onClick={onCancel}>
      <div ref={dialogRef} className='dialog' role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <h3>문서를 삭제할까요?</h3>
        <p className='hint'>
          <strong>{title}</strong> 을(를) 삭제합니다. 되돌릴 수 없습니다.
        </p>
        <div className='dialog-actions'>
          <button type='button' onClick={onCancel}>
            취소
          </button>
          <button type='button' className='danger' onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

/** 문서 목록. 각 줄의 삭제 버튼으로 확인 다이얼로그를 띄운다. */
export function DocumentManager() {
  const [docs, setDocs] = useState<Doc[]>(DOCS);
  const [target, setTarget] = useState<Doc | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const handleConfirm = () => {
    if (!target) return;
    console.log(`%c[delete] ${target.id} — ${target.title}`, 'color:#dc2626');
    setDocs((prev) => prev.filter((d) => d.id !== target.id));
    setLog((prev) => [`${target.title} 삭제됨`, ...prev]);
    setTarget(null);
  };

  return (
    <div className='panel'>
      <p className='hint'>
        문서 {docs.length}개 · 삭제 기록 {log.length}건
      </p>

      <ul className='list'>
        {docs.map((doc) => (
          <li key={doc.id} className='row'>
            <div>
              <strong>{doc.title}</strong>
              <span className='email'>{doc.size}</span>
            </div>
            <button type='button' onClick={() => setTarget(doc)}>
              삭제
            </button>
          </li>
        ))}
      </ul>

      {log.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p className='hint'>최근 삭제</p>
          <ul className='list'>
            {log.map((line, i) => (
              <li key={i} className='row'>
                <span className='email'>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {target && <ConfirmDialog title={target.title} onConfirm={handleConfirm} onCancel={() => setTarget(null)} />}
    </div>
  );
}
