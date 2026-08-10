import { useRef, useState } from 'react';

type Frequency = 'daily' | 'weekly';

type Settings = {
  enabled: boolean;
  email: string;
  frequency: Frequency;
};

type Project = {
  id: string;
  name: string;
};

const PROJECTS: Project[] = [
  { id: 'p1', name: 'SaaSOps 웹' },
  { id: 'p2', name: '관리자 콘솔' },
];

/** 서버에 저장돼 있는 설정. "저장"을 누르면 여기가 바뀐다. */
const SAVED: { [projectId: string]: Settings } = {
  p1: { enabled: true, email: 'ops@example.com', frequency: 'daily' },
  p2: { enabled: false, email: 'admin@example.com', frequency: 'weekly' },
};

let saveSeq = 0;

function saveSettings(projectId: string, settings: Settings) {
  const seq = ++saveSeq;
  SAVED[projectId] = settings;
  console.log(`%c[save #${seq}] ${projectId} ←`, 'color:#16a34a', JSON.stringify(settings));
}

/**
 * 알림 설정 폼.
 *
 * - 부모가 넘겨준 저장값(initial)으로 시작한다
 * - 값을 바꾸면 "저장 안 됨"이 뜬다
 * - 알림이 켜져 있는데 이메일이 이상하면 경고를 띄운다
 * - 저장을 누르면 서버에 반영한다
 */
function NotificationForm({
  projectId,
  initial,
  onSave,
}: {
  projectId: string;
  initial: Settings;
  onSave: (projectId: string, settings: Settings) => void;
}) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  const [settings, setSettings] = useState<Settings>(initial);

  // 저장값과 달라졌는지 계속 지켜본다
  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  // 바뀐 게 있을 때만 이메일 형식을 따진다
  const warning = dirty && settings.enabled && !settings.email.includes('@') ? '이메일 형식이 올바르지 않습니다.' : '';

  return (
    <div>
      <p className='hint'>
        렌더 {renderCount.current}회 · {dirty ? '저장 안 됨' : '저장됨'}
      </p>

      <div className='field'>
        <label className='checkline'>
          <input
            type='checkbox'
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          알림 받기
        </label>
      </div>

      <div className='field'>
        <label htmlFor='email'>알림 받을 이메일</label>
        <input
          id='email'
          className='search'
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
        />
        {warning && <p className='error'>{warning}</p>}
      </div>

      <div className='field'>
        <label htmlFor='frequency'>보내는 주기</label>
        <select
          id='frequency'
          className='search'
          value={settings.frequency}
          onChange={(e) => setSettings({ ...settings, frequency: e.target.value as Frequency })}
        >
          <option value='daily'>매일</option>
          <option value='weekly'>매주</option>
        </select>
      </div>

      <button type='button' className='more' onClick={() => onSave(projectId, settings)}>
        저장
      </button>
    </div>
  );
}

/** 프로젝트를 골라서 그 프로젝트의 알림 설정을 편집한다. */
export function SettingsPanel() {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [saved, setSaved] = useState(SAVED);

  const handleSave = (projectId: string, settings: Settings) => {
    saveSettings(projectId, settings);
    setSaved((prev) => ({ ...prev, [projectId]: settings }));
  };

  return (
    <div className='panel'>
      <div className='tabs'>
        {PROJECTS.map((project) => (
          <button
            key={project.id}
            className={`tab ${project.id === projectId ? 'active' : ''}`}
            onClick={() => setProjectId(project.id)}
          >
            {project.name}
          </button>
        ))}
      </div>

      <NotificationForm projectId={projectId} initial={saved[projectId]} onSave={handleSave} key={projectId} />
    </div>
  );
}
