// スクロール位置に応じて要素を縦方向にずらすパララックス制御。
// 要素を rate * スクロール量 だけ下へ追随させることで、見かけ上 (1 - rate) 倍の
// 速度でスクロールする「遠景」の視差を作る。

export function getParallaxOffset(scrollY: number, rate: number, anchorTop = 0): number {
  // anchorTop(基準要素のページ内上端)に達するまでは 0 のままとし、基準要素の
  // 上端がビューポート上端を越えてから追随を始める。これにより、ページ先頭
  // 付近のスクロール(固定ヘッダーが隠れるタイミング)では背景が動かない。
  // scrollY が負になるオーバースクロール(iOS のラバーバンド等)もここで
  // 0 に丸められる。
  return Math.max(0, scrollY - anchorTop) * rate;
}

// element を translateY で追随させるスクロールリスナーを登録し、解除関数を返す。
// anchor を渡すと、その要素の上端がビューポート上端に達してから視差が始まる。
// 描画は requestAnimationFrame に間引き、transform のみを更新することで
// リフローを発生させない。
export function startParallax(element: HTMLElement, rate: number, anchor?: HTMLElement): () => void {
  // パララックスは装飾目的の動きなので、視差効果を減らす設定の
  // ユーザーには適用せず静止させたままにする。
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  let frame = 0;
  const update = () => {
    frame = 0;
    // offsetTop は毎回読み直し、ブレークポイント切り替え等によるヘッダー高の
    // 変化に追従する。transform はレイアウトに影響しないため、この読み取りが
    // 強制リフローを引き起こすことはない。
    const anchorTop = anchor ? anchor.offsetTop : 0;
    element.style.transform = `translateY(${getParallaxOffset(window.scrollY, rate, anchorTop)}px)`;
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
