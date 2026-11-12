import { useEffect, useState } from 'react';

export const Paginated = ({ items, pageSize = 12, children, label = 'items' }) => {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(items.length / pageSize);

  useEffect(() => { setPage(1); }, [items]);
  useEffect(() => { if (pageCount && page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  const start = items.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, items.length);

  return <>
    {children(visibleItems)}
    {pageCount > 1 && <nav className="pagination" aria-label={`${label} pages`}>
      <span className="pagination-summary">{start}–{end} of {items.length}</span>
      <div className="pagination-pages">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1)
          .filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 1)
          .map((number, index, numbers) => <span className="pagination-number" key={number}>
            {index > 0 && number - numbers[index - 1] > 1 && <span className="pagination-ellipsis">…</span>}
            <button type="button" className={number === page ? 'active' : ''} onClick={() => setPage(number)} aria-current={number === page ? 'page' : undefined}>{number}</button>
          </span>)}
        <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">›</button>
      </div>
    </nav>}
  </>;
};
