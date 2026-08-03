import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App } from "./App";
import "./styles.css";

/**
 * QueryClient — TanStack Query의 캐시 저장소.
 * 연습장이라 재시도(retry)를 껐다. 실패를 바로 눈으로 보려는 목적.
 * (retry가 켜져 있으면 에러가 3번 재시도 뒤에야 화면에 나타나서 검증이 답답해진다.)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* 화면 우하단 꽃 아이콘 → 캐시에 뭐가 들었는지 눈으로 볼 수 있다 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
