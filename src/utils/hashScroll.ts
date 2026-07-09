export function jumpToAnchor(anchorId: string): void {
  const encodedAnchorId = encodeURIComponent(anchorId);

  if (window.location.pathname === '/') {
    // location.hash への代入は履歴を積んでしまうためreplaceStateを使う。
    // 第1引数にnullを渡すとReact Routerがhistory.stateに持たせている
    // idx/key等が消えPOPナビゲーションが壊れるため、既存stateを引き継ぐ。
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
