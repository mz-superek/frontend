import { useEffect, useState } from 'react';

const STORAGE_KEY = 'practice:favorites';

function loadFavorites(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * 즐겨찾기 목록.
 * localStorage에 저장해서 새로고침해도 남아 있게 한다.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  // 즐겨찾기가 바뀌면 저장한다
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addMany = (ids: string[]) => {
    setFavorites((prev) => [...new Set([...prev, ...ids])]);
  };

  return {
    favorites,
    isFavorite: (id: string) => favorites.includes(id),
    addMany,
  };
}
