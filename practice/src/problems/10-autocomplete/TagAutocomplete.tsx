import { useEffect, useRef, useState } from 'react';
import { searchTags } from '../../mock/api';

/**
 * 태그 자동완성.
 *
 * - 입력하면 후보를 검색해서 아래에 띄운다
 * - 후보를 클릭하면 태그로 추가된다
 * - 위/아래 키로 후보를 옮겨 다니고 Enter로 고를 수 있다
 * - 바깥을 클릭하면 후보 목록이 닫힌다
 */
export function TagAutocomplete() {
  const [query, setQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);

  // 입력이 바뀌면 후보를 검색한다
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    if (!debounceQuery.trim()) {
      setSuggestions([]);
      return;
    }

    searchTags(debounceQuery).then((result) => {
      if (cancelled) return;
      setSuggestions(result);
      setOpen(true);
      setActiveIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [debounceQuery]);

  // 바깥을 클릭하면 닫는다
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const addTag = (tag: string) => {
    setTags((prev) => [...prev, tag]);
    setQuery('');
    setOpen(false);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  useEffect(() => {
    const activeItem = boxRef.current?.querySelector('.suggestion.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className='panel'>
      <div className='field' ref={boxRef} style={{ position: 'relative' }}>
        <label htmlFor='tag-input'>태그 검색</label>
        <input
          id='tag-input'
          className='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='예: react, type, doc'
          autoComplete='off'
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions[activeIndex]) {
                addTag(suggestions[activeIndex]);
              }
            }
          }}
        />

        {open && suggestions.length > 0 && (
          <ul className='suggestions'>
            {suggestions.map((tag, i) => (
              <li key={tag} className={`suggestion ${i === activeIndex ? 'active' : ''}`}>
                <button
                  onClick={() => addTag(tag)}
                  disabled={tags.includes(tag)}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'left',
                    padding: '4px 8px',
                    border: 'none',
                    background: 'none',
                  }}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className='hint'>
        선택한 태그 {tags.length}개{suggestions.length > 0 && ` · 후보 ${suggestions.length}건`}
      </p>

      <ul className='list'>
        {tags.map((tag) => (
          <li key={tag} className='row'>
            <span className='badge admin'>{tag}</span>
            <button type='button' onClick={() => removeTag(tag)}>
              제거
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
