let calcSeq = 0;

/**
 * 일부러 무겁게 만든 계산.
 * 실제 서비스라면 큰 목록을 정렬·집계하거나 통계를 내는 코드쯤 된다.
 *
 * 호출될 때마다 콘솔에 몇 번째인지와 걸린 시간을 찍는다.
 * "이게 몇 번 도는가"를 눈으로 보라고 넣어둔 것이다.
 */
export function computeTeamScore(items: { likes: number }[]): number {
  const seq = ++calcSeq;
  const start = performance.now();

  let score = 0;
  for (let i = 0; i < 4_000_000; i++) {
    score += (i % 13) * (items.length || 1);
  }

  const ms = performance.now() - start;
  console.log(
    `%c[calc #${seq}] 팀 점수 재계산 — ${ms.toFixed(0)}ms 걸림`,
    "color:#f59e0b",
  );

  return score % 1000;
}
