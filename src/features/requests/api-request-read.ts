import { OFFICES, type Office } from '../auth/types';
import { isRecord, optNum, optStr, readId, readNum, readStr, record, toRequestStatus } from '../../shared/api';
import type { RequestStatus } from '../../shared/ui';
import type { EmployeeRequest } from './detail/request-detail-types';
import type { HandoverStatus, PickupLocation, ReviewRequest } from './queue/review-types';

/** One reading of a published request, for every request screen (spec 017).
 *
 *  Field names are the backend's `Request` entity as `/requests` serialises it
 *  (CoDev-OSRS-BE `src/requests`, read 2026-10-03): `displayId`, `requestor`,
 *  `requestingOffice`, `items[].asset`, `items[].availableStock`, `purpose`,
 *  `pickupLocation`, `rejectionReason`, `cancellationReason`, `receivedAt`,
 *  `receivedSignature`, `resolvedAt`, `timeline[].{status, at}`, `createdAt`.
 *  A required field that is missing throws, so the screen shows its error
 *  state instead of invented data. An optional one is left out. */

type ApiLine = { name: string; model?: string; category?: string; qty: number; available: number | null };

type ApiRequest = {
  id: string;
  displayId: string;
  status: RequestStatus;
  submittedAt: string;
  purpose?: string;
  requester?: { name: string; email?: string; office?: Office };
  lines: ApiLine[];
  pickupLocation?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  /** The time each status was recorded, from the timeline or a dated field. */
  at: Partial<Record<RequestStatus, string>>;
  /** The handover state it went through, from the timeline. */
  handover?: HandoverStatus;
  signedAt?: string;
};

const asOffice = (value: string | undefined): Office | undefined =>
  value && (OFFICES as readonly string[]).includes(value) ? (value as Office) : undefined;

/** `items[]`: the asset, the quantity, and `availableStock` at the request's
 *  office. The create response carries no `availableStock`. */
function readLine(value: unknown): ApiLine {
  const what = 'request line';
  const body = record(value, what);
  const asset = record(body.asset, `${what}.asset`);
  return {
    name: readStr(asset, 'name', `${what}.asset`),
    model: optStr(asset, 'model'),
    category: optStr(asset, 'category'),
    qty: readNum(body, 'quantity', what),
    available: optNum(body, 'availableStock') ?? null,
  };
}

/** `requestor`: the user who submitted. The office is the request's own
 *  `requestingOffice`, where its units are reserved, and falls back to the
 *  user's `location`. */
function readRequester(value: unknown, requestingOffice: string | undefined): ApiRequest['requester'] {
  if (!isRecord(value)) return undefined;
  const name = [optStr(value, 'firstName'), optStr(value, 'lastName')].filter(Boolean).join(' ');
  const email = optStr(value, 'email');
  if (!name && !email) return undefined;
  return { name: name || email || '', email, office: asOffice(requestingOffice) ?? asOffice(optStr(value, 'location')) };
}

/** `timeline[]` entries: `{ status, at, byUserId?, note? }`. Only recorded
 *  events are kept (FR-019). */
function readTimeline(value: unknown): { at: ApiRequest['at']; handover?: HandoverStatus } {
  const at: ApiRequest['at'] = {};
  let handover: HandoverStatus | undefined;
  if (!Array.isArray(value)) return { at };
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const when = optStr(entry, 'at');
    if (!when) continue;
    let status: RequestStatus;
    try {
      status = toRequestStatus(entry.status);
    } catch {
      continue;
    }
    at[status] = when;
    if (status === 'For Delivery' || status === 'Ready for Pickup') handover = status;
  }
  return { at, handover };
}

export function readRequest(value: unknown): ApiRequest {
  const what = 'request';
  const body = record(value, what);
  const status = toRequestStatus(body.status);
  const items = Array.isArray(body.items) ? body.items : [];
  const { at, handover } = readTimeline(body.timeline);
  const dated: [RequestStatus, string | undefined][] = [
    ['Received', optStr(body, 'receivedAt')],
    ['Completed', status === 'Completed' ? optStr(body, 'resolvedAt') : undefined],
    ['Rejected', status === 'Rejected' ? optStr(body, 'resolvedAt') : undefined],
    ['Cancelled', status === 'Cancelled' ? optStr(body, 'resolvedAt') : undefined],
  ];
  for (const [key, when] of dated) if (when && !at[key]) at[key] = when;
  const submittedAt = readStr(body, 'createdAt', what);
  return {
    id: readId(body, 'id', what),
    displayId: readStr(body, 'displayId', what),
    status,
    submittedAt,
    purpose: optStr(body, 'purpose'),
    requester: readRequester(body.requestor, optStr(body, 'requestingOffice')),
    lines: items.map(readLine),
    pickupLocation: optStr(body, 'pickupLocation'),
    rejectionReason: optStr(body, 'rejectionReason'),
    cancellationReason: optStr(body, 'cancellationReason'),
    at,
    handover: handover ?? (status === 'For Delivery' || status === 'Ready for Pickup' ? status : undefined),
    // No signed time is published. Signing stores `receivedSignature` and
    // completes the request in the same write (contracts conflict 12), so a
    // signed request was signed when it completed.
    signedAt: optStr(body, 'receivedSignature') ? at.Completed : undefined,
  };
}

const lineName = (line: ApiLine) => line.category ?? line.name;
const lineDescription = (line: ApiLine) => (line.model ? `${line.name} - ${line.model}` : line.name);

const handedOverAt = (r: ApiRequest) => (r.handover ? r.at[r.handover] : undefined);

export function toEmployeeRequest(r: ApiRequest): EmployeeRequest {
  return {
    id: r.id,
    displayId: r.displayId,
    submittedAt: r.submittedAt,
    lines: r.lines.map((line) => ({ name: lineName(line), description: lineDescription(line), qty: line.qty })),
    noteToApprover: r.purpose,
    status: r.status,
    handover: r.handover,
    approvedAt: r.at.Approved,
    handedOverAt: handedOverAt(r),
    receivedAt: r.at.Received,
    signedAt: r.signedAt,
    completedAt: r.at.Completed,
    ...(r.status === 'Rejected' && r.rejectionReason && r.at.Rejected
      ? { rejection: { reason: r.rejectionReason, at: r.at.Rejected } }
      : {}),
    ...(r.status === 'Cancelled' && r.cancellationReason && r.at.Cancelled
      ? { cancellation: { reason: r.cancellationReason, at: r.at.Cancelled } }
      : {}),
  };
}

function pickup(location: string | undefined): PickupLocation | undefined {
  if (!location) return undefined;
  const office = OFFICES.find((o) => location === o || location === `${o} Office`);
  return office ? { kind: 'office', office } : { kind: 'other', text: location };
}

/** The Admin's view. A requester office the API does not publish leaves the
 *  row unreadable: the panel needs it, and it is not invented. */
export function toReviewRequest(r: ApiRequest): ReviewRequest {
  const office = r.requester?.office;
  if (!office) throw new Error('request: no requester office');
  const employee = toEmployeeRequest(r);
  return {
    id: r.id,
    displayId: r.displayId,
    requestorName: r.requester?.name ?? '',
    requestorEmail: r.requester?.email,
    requestorOffice: office,
    items: r.lines.map(lineName),
    submittedAt: r.submittedAt,
    status: r.status,
    lines: r.lines.map((line) => ({ description: lineDescription(line), qty: line.qty, available: line.available })),
    noteToApprover: r.purpose,
    handover: r.handover,
    pickupLocation: pickup(r.pickupLocation),
    approvedAt: employee.approvedAt,
    handedOverAt: employee.handedOverAt,
    receivedAt: employee.receivedAt,
    signedAt: employee.signedAt,
    completedAt: employee.completedAt,
    rejection: employee.rejection,
    cancellation: employee.cancellation,
  };
}
