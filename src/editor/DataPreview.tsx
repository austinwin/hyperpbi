import { useMemo, useState } from "preact/hooks";
import { NormalizedData } from "../data/normalizeData";
import { formatValue } from "../utils/formatValue";

export function DataPreview({ data }: { data: NormalizedData }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const fields = Object.values(data.fields);
  const pages = Math.max(1, Math.ceil(data.rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = useMemo(
    () =>
      data.rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data.rows, safePage, pageSize],
  );

  if (!fields.length)
    return (
      <div class="hp-bottom-empty" role="status">
        <strong>No fields are available</strong>
        <p>Add fields to the Power BI visual, then reopen the Builder.</p>
      </div>
    );

  return (
    <div class="hp-studio-data">
      {data.rows.length ? (
        <div class="hp-studio-table-wrap">
          <table>
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
              {rows.map((row, index) => (
                <tr>
                  <th scope="row">
                    {(safePage - 1) * pageSize + index + 1}
                  </th>
                  {fields.map((field) => (
                    <td>{formatValue(row[field.key], field.format)}</td>
                  ))}
                </tr>
              ))}
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
