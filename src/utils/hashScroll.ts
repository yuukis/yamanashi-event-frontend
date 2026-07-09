export function jumpToAnchor(anchorId: string): void {
  const encodedAnchorId = encodeURIComponent(anchorId);

  if (window.location.pathname === '/') {
    // location.hash への代入は履歴エントリを1つ積んでしまう。ページ内の
    // ジャンプを何度行ってもヒストリーバックが1回で済むよう、履歴を
    // 積まないreplaceStateでhashだけを更新する。第1引数にnullを渡すと
    // React Routerがhistory.stateに書き込んでいるidx/key等の内部管理用
    // 情報を消してしまい、以降のPOPナビゲーションのdelta計算が壊れうる
    // ため、既存のstateはそのまま引き継ぐ。
    window.history.replaceState(window.history.state, '', `#${encodedAnchorId}`);
    window.requestAnimationFrame(scrollToCurrentHash);
    return;
  }

  window.open(`/#${encodedAnchorId}`, '_self');
}

export function scrollToCurrentHash() {
  const hash = window.location.hash;

  if (!hash) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(hash.slice(1)));

  if (target) {
    window.dispatchEvent(new Event('site-header-show'));
    target.scrollIntoView();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('site-header-show'));
    });
    window.setTimeout(() => {
      window.dispatchEvent(new Event('site-header-show'));
    }, 120);
  }
}
