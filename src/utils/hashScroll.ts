export function jumpToAnchor(anchorId: string): void {
  const encodedAnchorId = encodeURIComponent(anchorId);

  if (window.location.pathname === '/') {
    // location.hash への代入は履歴エントリを1つ積んでしまう。ページ内の
    // ジャンプを何度行ってもヒストリーバックが1回で済むよう、履歴を
    // 積まないreplaceStateでhashだけを更新する。
    window.history.replaceState(null, '', `#${encodedAnchorId}`);
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
