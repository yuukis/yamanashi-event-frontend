// スクロール位置に応じて要素を縦方向にずらすパララックス制御。
// 要素を rate * scrollY だけ下へ追随させることで、見かけ上 (1 - rate) 倍の
// 速度でスクロールする「遠景」の視差を作る。

export function getParallaxOffset(scrollY: number, rate: number): number {
  // オーバースクロール(iOS のラバーバンド等)で scrollY が負になる環境では
  // 0 に丸め、要素が上方向へずれて下端に継ぎ目が出ないようにする。
  return Math.max(0, scrollY) * rate;
}

// element を translateY で追随させるスクロールリスナーを登録し、解除関数を返す。
// 描画は requestAnimationFrame に間引き、transform のみを更新することで
// リフローを発生させない。
export function startParallax(element: HTMLElement, rate: number): () => void {
  // パララックスは装飾目的の動きなので、視差効果を減らす設定の
  // ユーザーには適用せず静止させたままにする。
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  let frame = 0;
  const update = () => {
    frame = 0;
    element.style.transform = `translateY(${getParallaxOffset(window.scrollY, rate)}px)`;
  };
  const handleScroll = () => {
    if (frame === 0) {
      frame = window.requestAnimationFrame(update);
    }
  };

  // ハッシュ遷移やリロード直後などスクロール済みで開始するケースに備え、
  // 初期位置を即時反映する。
  update();
  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    element.style.transform = '';
  };
}
