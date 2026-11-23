/**
 * 小程序二维分页控制器：先置 loadingMore 防重入，仅按页路径增量 setData。
 */

function initialPaginationState() {
  return { listPages: /** @type {any[]} */ ([]), page: 0, hasMore: true, loadingMore: false, errorMessage: null };
}

export function createMiniPagination(fetchPage) {
  const data = initialPaginationState();
  let activeToken = 0;

  async function loadNext(setData) {
    if (data.loadingMore || !data.hasMore) return { skipped: true };
    const nextPage = data.page + 1;
    const token = ++activeToken;
    data.loadingMore = true;
    data.errorMessage = null;
    setData({ loadingMore: true, errorMessage: null });

    const res = await fetchPage(nextPage);
    if (token !== activeToken) return { stale: true };
    data.loadingMore = false;

    if (!res.ok) {
      data.errorMessage = res.error.message;
      setData({ loadingMore: false, errorMessage: res.error.message });
      return { ok: false };
    }
    const pageIndex = nextPage - 1;
    data.listPages[pageIndex] = res.data.items;
    data.page = nextPage;
    data.hasMore = nextPage < res.data.page.totalPages;
    setData({
      [`listPages[${pageIndex}]`]: res.data.items,
      page: data.page,
      hasMore: data.hasMore,
      loadingMore: false,
      errorMessage: null,
    });
    return { ok: true };
  }

  function reset() {
    activeToken += 1;
    Object.assign(data, initialPaginationState());
  }

  return { data, loadNext, reset };
}
