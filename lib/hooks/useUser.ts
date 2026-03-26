import useSWR from 'swr';

interface User {
  id: number;
  name: string;
  department: string;
  role: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.user || null);

export function useUser() {
  const { data: user, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000, // 5s 内同一页面多组件不重复请求，但登录/退出后立即刷新
    }
  );

  return {
    user: user ?? null,
    isLoading,
    error,
    mutate,
  };
}
