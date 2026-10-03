import type { RequestStatus } from '../../shared/ui';
import { ROLE_LABEL, type Office, type User } from '../auth/types';
import { unitRegister } from '../inventory/seeded-unit-register';
import type {
  CancelResult,
  EmployeeRequest,
  ReceiveResult,
  Signature,
  SignResult,
} from './detail/request-detail-types';
import type { PickupLocation, ReviewRequest, TransitionResult } from './queue/review-types';

/** Requests the suite creates, and the only ones whose units move with the
 *  status. Seeded employee and admin rows stay on their own stores and do not
 *  touch the unit register. Module state: a reload starts over.
 *
 *  Ids start at REQ-2026-9001 so they cannot collide with the seeded lists. */

export type DemoLine = {
  assetId: string;
  name: string;
  model: string;
  qty: number;
  unitIds: readonly string[];
};

type DemoRequest = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  office: Office;
  lines: readonly DemoLine[];
  note?: string;
  status: RequestStatus;
  submittedAt: string;
  approvedAt?: string;
  handover?: 'For Delivery' | 'Ready for Pickup';
  handedOverAt?: string;
  pickupLocation?: PickupLocation;
  receivedAt?: string;
  signedAt?: string;
  completedAt?: string;
  otherNotes?: string;
  rejection?: { reason: string; at: string };
  cancellation?: { reason: string; at: string };
};

const requests: DemoRequest[] = [];
let seq = 9000;
const now = () => new Date().toISOString();

const find = (id: string) => requests.find((request) => request.id === id);
const unitIdsOf = (request: DemoRequest) => request.lines.flatMap((line) => line.unitIds);

function toEmployee(request: DemoRequest): EmployeeRequest {
  return {
    id: request.id,
    submittedAt: request.submittedAt,
    status: request.status,
    lines: request.lines.map((line) => ({
      name: line.name,
      description: `${line.name} - ${line.model}`,
      qty: line.qty,
    })),
    ...(request.note ? { noteToApprover: request.note } : {}),
    ...(request.handover ? { handover: request.handover } : {}),
    ...(request.approvedAt ? { approvedAt: request.approvedAt } : {}),
    ...(request.handedOverAt ? { handedOverAt: request.handedOverAt } : {}),
    ...(request.receivedAt ? { receivedAt: request.receivedAt } : {}),
    ...(request.signedAt ? { signedAt: request.signedAt } : {}),
    ...(request.completedAt ? { completedAt: request.completedAt } : {}),
    ...(request.rejection ? { rejection: { ...request.rejection } } : {}),
    ...(request.cancellation ? { cancellation: { ...request.cancellation } } : {}),
  };
}

function toReview(request: DemoRequest): ReviewRequest {
  return {
    id: request.id,
    requestorName: request.ownerName,
    requestorEmail: request.ownerEmail,
    items: request.lines.map((line) => `${line.name} - ${line.model}`),
    submittedAt: request.submittedAt,
    status: request.status,
    requestorOffice: request.office,
    lines: request.lines.map((line) => ({
      description: `${line.name} - ${line.model}`,
      qty: line.qty,
      available: unitRegister.stockFor(line.assetId)[request.office].available,
    })),
    ...(request.note ? { noteToApprover: request.note } : {}),
    ...(request.otherNotes ? { otherNotes: request.otherNotes } : {}),
    ...(request.handover ? { handover: request.handover } : {}),
    ...(request.pickupLocation ? { pickupLocation: structuredClone(request.pickupLocation) } : {}),
    ...(request.approvedAt ? { approvedAt: request.approvedAt } : {}),
    ...(request.handedOverAt ? { handedOverAt: request.handedOverAt } : {}),
    ...(request.receivedAt ? { receivedAt: request.receivedAt } : {}),
    ...(request.signedAt ? { signedAt: request.signedAt } : {}),
    ...(request.completedAt ? { completedAt: request.completedAt } : {}),
    ...(request.rejection ? { rejection: { ...request.rejection } } : {}),
    ...(request.cancellation ? { cancellation: { ...request.cancellation } } : {}),
  };
}

const refused = (refusal: Exclude<TransitionResult, { ok: true }>['refusal']): TransitionResult => ({
  ok: false,
  refusal,
});

function rememberNotes(request: DemoRequest, notes: string | undefined) {
  const trimmed = notes?.trim();
  if (trimmed) request.otherNotes = trimmed;
}

export function isDemoRequest(id: string): boolean {
  return find(id) !== undefined;
}

export function demoRequestsFor(ownerId: string): EmployeeRequest[] {
  return requests.filter((request) => request.ownerId === ownerId).map(toEmployee);
}

export function demoReviewRequests(): ReviewRequest[] {
  return requests.map(toReview);
}

/** Records a request whose units are already Reserved. Newest first. */
export function appendDemoRequest(
  user: User,
  office: Office,
  lines: readonly DemoLine[],
  note: string | undefined,
): EmployeeRequest {
  const request: DemoRequest = {
    id: `REQ-2026-${++seq}`,
    ownerId: user.id,
    // A published user may omit both. The queue still needs a name, and it
    // uses the same role label the account cluster does. An absent email stays
    // blank rather than becoming an invented address.
    ownerName: user.name?.trim() || ROLE_LABEL[user.role],
    ownerEmail: user.email ?? '',
    office,
    lines: lines.map((line) => ({ ...line, unitIds: [...line.unitIds] })),
    ...(note ? { note } : {}),
    status: 'Pending Approval',
    submittedAt: now(),
  };
  requests.unshift(request);
  return toEmployee(request);
}

export function cancelDemoAsEmployee(user: User, id: string, reason: string): CancelResult {
  const request = find(id);
  if (user.role !== 'employee' || !request || request.ownerId !== user.id) return { ok: false, refusal: 'unavailable' };
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, refusal: 'reason-required' };
  if (request.status !== 'Pending Approval') return { ok: false, refusal: 'status-changed' };
  unitRegister.releaseSession(unitIdsOf(request));
  request.status = 'Cancelled';
  request.cancellation = { reason: trimmed, at: now() };
  return { ok: true, request: toEmployee(request) };
}

export function receiveDemoAsEmployee(user: User, id: string): ReceiveResult {
  const request = find(id);
  if (user.role !== 'employee' || !request || request.ownerId !== user.id) return { ok: false, refusal: 'unavailable' };
  if (request.status !== 'For Delivery' && request.status !== 'Ready for Pickup') {
    return { ok: false, refusal: 'status-changed' };
  }
  unitRegister.assignSession(unitIdsOf(request), request.ownerId);
  request.status = 'Received';
  request.receivedAt = now();
  return { ok: true, request: toEmployee(request) };
}

export function signDemoRequest(user: User, id: string, signature: Signature): SignResult {
  const request = find(id);
  if (user.role !== 'employee' || !request || request.ownerId !== user.id) return { ok: false, refusal: 'unavailable' };
  if (signature.agreed !== true || !signature.fullName.trim()) {
    return {
      ok: false,
      refusal: 'invalid',
      problems: [{ path: [], detail: 'Agree to the conditions and type your full name to sign.' }],
    };
  }
  if (request.status !== 'Received' || request.signedAt) return { ok: false, refusal: 'status-changed' };
  request.signedAt = now();
  return { ok: true, request: toEmployee(request) };
}

export function approveDemoRequest(id: string, notes?: string): TransitionResult {
  const request = find(id);
  if (!request) return refused('unavailable');
  if (request.status !== 'Pending Approval') return refused('status-changed');
  rememberNotes(request, notes);
  request.status = 'Approved';
  request.approvedAt = now();
  return { ok: true };
}

export function rejectDemoRequest(id: string, reason: string, notes?: string): TransitionResult {
  const request = find(id);
  if (!request) return refused('unavailable');
  if (request.status !== 'Pending Approval') return refused('status-changed');
  const trimmed = reason.trim();
  if (!trimmed) return refused('reason-required');
  unitRegister.releaseSession(unitIdsOf(request));
  rememberNotes(request, notes);
  request.status = 'Rejected';
  request.rejection = { reason: trimmed, at: now() };
  return { ok: true };
}

const HANDOVER_FROM = new Set<RequestStatus>(['Approved', 'For Delivery', 'Ready for Pickup']);
const RECEIVED_FROM = new Set<RequestStatus>(['For Delivery', 'Ready for Pickup']);
const ADMIN_CANCEL_FROM = new Set<RequestStatus>(['Approved', 'Ready for Pickup']);

export function updateDemoRequest(
  id: string,
  to: 'For Delivery' | 'Ready for Pickup' | 'Received',
  pickup: PickupLocation | undefined,
  offices: readonly Office[],
): TransitionResult {
  const request = find(id);
  if (!request) return refused('unavailable');
  if (to === 'Received') {
    if (!RECEIVED_FROM.has(request.status)) return refused('status-changed');
    unitRegister.assignSession(unitIdsOf(request), request.ownerId);
    request.status = 'Received';
    request.receivedAt = now();
    return { ok: true };
  }
  if (!HANDOVER_FROM.has(request.status) || request.status === to) return refused('status-changed');
  let location: PickupLocation | undefined;
  if (to === 'Ready for Pickup') {
    if (!pickup) return refused('location-required');
    if (pickup.kind === 'other') {
      const text = pickup.text.trim();
      if (!text) return refused('location-required');
      location = { kind: 'other', text };
    } else if (!offices.includes(pickup.office)) {
      return refused('location-required');
    } else {
      location = pickup;
    }
  }
  request.status = to;
  request.handover = to;
  request.pickupLocation = location;
  request.handedOverAt = now();
  return { ok: true };
}

export function cancelDemoAsAdmin(id: string, reason: string): TransitionResult {
  const request = find(id);
  if (!request) return refused('unavailable');
  if (!ADMIN_CANCEL_FROM.has(request.status)) return refused('status-changed');
  const trimmed = reason.trim();
  if (!trimmed) return refused('reason-required');
  unitRegister.releaseSession(unitIdsOf(request));
  request.status = 'Cancelled';
  request.cancellation = { reason: trimmed, at: now() };
  return { ok: true };
}

/** Complete only from a signed Received request. Units stay Assigned. */
export function completeDemoRequest(id: string): TransitionResult {
  const request = find(id);
  if (!request) return refused('unavailable');
  if (request.status !== 'Received' || !request.signedAt) return refused('status-changed');
  request.status = 'Completed';
  request.completedAt = now();
  return { ok: true };
}
