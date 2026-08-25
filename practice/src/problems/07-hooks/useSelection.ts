import { useState, useCallback } from 'react';

/**
 * 목록에서 여러 항목을 고르는 로직.
 * 어느 목록에서든 갖다 쓸 수 있게 훅으로 뽑았다.
 */
export function useSelection() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const clear = () => {
    setSelected([]);
  };

  return {
    selected,
    isSelected: (id: string) => selected.includes(id),
    toggle,
    clear,
  };
}
