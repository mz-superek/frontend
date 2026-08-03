import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { fetchMembers, updateMemberRole, type MembersPage, type Role } from '../../mock/api';

/**
 * 팀 멤버 관리 목록.
 *
 * - 이름/이메일로 검색
 * - "더 보기"로 다음 페이지 이어붙이기
 * - 각 멤버의 역할(admin/member) 변경 — 낙관적 업데이트로 즉시 반영
 */
export function TeamMemberList() {
  const [search, setSearch] = useState('');
  const [debounceSearch, setDebounceSearch] = useState(search);
  const queryClient = useQueryClient();

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['members', debounceSearch],
    queryFn: ({ pageParam }) => fetchMembers({ search: debounceSearch, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateMemberRole({ id, role }),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ['members', debounceSearch] });

      // 실패했을 때 되돌릴 수 있도록 현재 캐시를 미리 확보해둔다
      const previous = queryClient.getQueryData<InfiniteData<MembersPage>>(['members', debounceSearch]);

      // 낙관적 업데이트 — 서버 응답을 기다리지 않고 화면부터 바꾼다
      queryClient.setQueryData<InfiniteData<MembersPage>>(['members', debounceSearch], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((member) => (member.id === id ? { ...member, role } : member)),
          })),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      // 실패했으니 아까 확보해둔 값으로 되돌린다
      if (context?.previous) {
        queryClient.setQueryData(['members', debounceSearch], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
  const roleError = roleMutation.error;

  const members = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className='panel'>
      <input
        className='search'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder='이름 또는 이메일 검색'
      />

      {isPending && <p className='hint'>불러오는 중…</p>}
      {isError && <p className='error'>목록을 불러오지 못했습니다.</p>}
      {roleError && <p className='error'>역할 변경 실패 : {roleError.message}</p>}

      <ul className='list'>
        {members.map((member) => (
          <li key={member.id} className='row'>
            <div>
              <strong>{member.name}</strong>
              <span className='email'>{member.email}</span>
            </div>
            <div className='actions'>
              <span className={`badge ${member.role}`}>{member.role}</span>
              <button
                onClick={() =>
                  roleMutation.mutate({
                    id: member.id,
                    role: member.role === 'admin' ? 'member' : 'admin',
                  })
                }
              >
                역할 변경
              </button>
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <button className='more' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? '불러오는 중…' : '더 보기'}
        </button>
      )}
    </div>
  );
}
