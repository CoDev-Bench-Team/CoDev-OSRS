import {
  TABLE_ROW_PADDING_CLASS,
  TableCard,
  TableHead,
  tableColumnStyle,
  type ColumnWidth,
} from '../../../shared/ui';
import { keyedLines } from '../format';
import type { RequestLine } from './request-detail-types';

const QTY_WIDTH: ColumnWidth = '50px';

/** A request's lines as ITEM / QTY — under *Items Requested* in the read-back
 *  (`03.1`, `04.1`) and the Admin's History panel (spec 013), and under
 *  **EQUIPMENT ASSIGNED** on the Accountability Form (spec 012 D7). One table,
 *  so the form lists exactly what the read-back names. The form's drawn **PR**
 *  column is QTY here: the form signs for lines, not unit tags (ADR-0009
 *  decision 7). */
export function RequestLinesTable({ lines }: { lines: readonly Pick<RequestLine, 'description' | 'qty'>[] }) {
  return (
    <TableCard>
      <TableHead cols={[['Item'], ['Qty', QTY_WIDTH]]} />
      <ul>
        {keyedLines(lines).map(({ key, line }) => (
          <li key={key} className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
            <span style={tableColumnStyle()} className="type-ui-bold-wrap text-ink-primary">
              {line.description}
            </span>
            <span style={tableColumnStyle(QTY_WIDTH)} className="type-ui-bold tabular-nums text-ink-primary">
              {line.qty}
            </span>
          </li>
        ))}
      </ul>
    </TableCard>
  );
}
