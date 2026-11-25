import { useEffect, useState } from "preact/hooks";
import { NormalizedData } from "../data/normalizeData";
import { tableVirtualRange, TABLE_ROW_HEIGHT } from "../components/tables/tableVirtualRange";
import { useVirtualRowViewport } from "../components/tables/useVirtualRowViewport";
import { samplePreviewValue } from "../data/samplePreviewRows";
import { formatValue } from "../utils/formatValue";

export function DataPreview({ data }: { data: NormalizedData }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const fields = Object.values(data.fields);
  const pages = Math.max(1, Math.ceil(data.rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const { viewportRef, onScroll, resetScroll, scrollTop, viewportHeight } = useVirtualRowViewport(Boolean(data.rows.length));
  const pageOffset = (safePage - 1) * pageSize;
  const pageCount = Math.min(pageSize, data.rows.length - pageOffset);
  const range = tableVirtualRange(pageCount, scrollTop, viewportHeight);
  const rows = data.rows.slice(pageOffset + range.start, pageOffset + range.end);
  useEffect(resetScroll, [safePage, pageSize]);

  if (!fields.length)
    return (
      <div class="hp-bottom-empty" role="status">
        <strong>No fields are available</strong>
        <p>Add fields to Values in Power BI. The preview updates when fields arrive.</p>
      </div>
    );

  return (
    <div class="hp-studio-data">
      {data.rows.length ? (
        <div class="hp-studio-table-wrap hp-studio-virtual" ref={viewportRef} onScroll={onScroll} style={{ "--hp-table-row-height": `${TABLE_ROW_HEIGHT}px` }}>
          <table aria-rowcount={data.rows.length + 1}>
            <caption class="hp-visually-hidden">
              Preview of data available to this dashboard
            </caption>
            <thead>
              <tr>
                <th scope="col">Row</th>
                {fields.map((field) => (
                  <th scope="col">{field.displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {range.topSpacer > 0 && <tr class="hp-table-spacer" aria-hidden="true"><td colSpan={fields.length + 1} style={{ height: range.topSpacer }} /></tr>}
              {rows.map((row, index) => {
                const position = pageOffset + range.start + index;
                return <tr key={data.rowKeys[position] ?? position} aria-rowindex={position + 2}>
                  <th scope="row">{position + 1}</th>
                  {fields.map(field => <td key={field.key}>{formatValue(samplePreviewValue(row[field.key]), field.format)}</td>)}
                </tr>;
              })}
              {range.bottomSpacer > 0 && <tr class="hp-table-spacer" aria-hidden="true"><td colSpan={fields.length + 1} style={{ height: range.bottomSpacer }} /></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="hp-bottom-empty" role="status">
          <strong>No rows to preview</strong>
          <p>The field structure is ready, but Power BI supplied no rows.</p>
        </div>
      )}
      <footer class="hp-studio-data-footer">
        <span>
          {data.rows.length.toLocaleString()} rows loaded
          {data.loadStatus?.moreRowsAvailable ? " · more available" : ""}
        </span>
        <label>
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.currentTarget.value));
              setPage(1);
            }}
          >
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </label>
        <span aria-live="polite">
          {data.rows.length
            ? `${(safePage - 1) * pageSize + 1}–${Math.min(
                safePage * pageSize,
                data.rows.length,
              )} of ${data.rows.length}`
            : "0 rows"}
        </span>
        <div class="hp-studio-pagination">
          {pages > 1 && <label>Page <input type="number" aria-label="Data preview page" min={1} max={pages} value={safePage}
            onChange={event => setPage(Math.max(1, Math.min(pages, Number(event.currentTarget.value) || 1)))} /></label>}
          <button
            type="button"
            aria-label="Previous data page"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            aria-label="Next data page"
            disabled={safePage >= pages}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
