// 現在のページが '/' ならその場でhash遷移してスクロール、そうでなければ
// '/' へ遷移してからスクロールする。ミニカレンダーの日付ジャンプと、
// 新着イベント通知一覧のイベント単位ジャンプの両方で使う汎用ヘルパー。
export function jumpToAnchor(anchorId: string): void {
  const encodedAnchorId = encodeURIComponent(anchorId);

  if (window.location.pathname === '/') {
    window.location.hash = encodedAnchorId;
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
