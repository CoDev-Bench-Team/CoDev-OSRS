import type { ApiOffice } from './assets';
import { apiRequest } from './client';
import { API_ASSET_CATEGORIES, type ApiAssetCategory } from './maps';
import { withQuery } from './query';
import { id, isRecord, optNum, optStr, record, str } from './wire';

/** `/inventory-items`, as published on 2026-10-03. Each operation is defined
 *  once here (spec 017 FR-003). The list takes no office: none is sent
 *  (contracts G9). Responses stay `unknown` until a mapper reads them against
 *  the live field record (plan D15). The list returns BitLocker identifier and
 *  recovery PIN even to an Employee (contracts G3); every mapper but the
 *  Admin's single read drops them (plan D14). */

export type ApiUnitStatus = 'Available' | 'Reserved' | 'Assigned' | 'Inactive';

export type ListUnitsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: ApiAssetCategory;
  status?: ApiUnitStatus;
  assignedToId?: string;
};

type PurchaseFields = { price?: number; supplier?: string; purchasedAt?: string };
type SecretFields = { serialNumber?: string; bitlockerIdentifier?: string; recoveryPin?: string };

/** One unit. With `assignedToId` it starts `Assigned`, else `Available`. No
 *  Purchase Request number and no attachment file (contracts G5, G7). */
export type CreateUnitBody = PurchaseFields &
  SecretFields & {
    assetId: number;
    location: ApiOffice;
    assignedToId?: number;
    description?: string;
  };

/** 1–100 units with unique serials, in one operation. */
export type CreateUnitsBody = PurchaseFields & {
  assetId: number;
  location: ApiOffice;
  units: SecretFields[];
};

/** Partial. `assignedToId: null` clears the assignment; absent leaves it. */
export type UpdateUnitBody = {
  assetId?: number;
  location?: ApiOffice;
  status?: ApiUnitStatus;
  price?: number | null;
  supplier?: string | null;
  purchasedAt?: string | null;
  serialNumber?: string | null;
  bitlockerIdentifier?: string | null;
  recoveryPin?: string | null;
  assignedToId?: number | null;
  description?: string | null;
};

const one = (id: string) => `/inventory-items/${encodeURIComponent(id)}`;

/** `GET /inventory-items`. Added by BEN-158; reused by BEN-162. */
export function listUnits(params: ListUnitsParams): Promise<unknown> {
  return apiRequest(withQuery('/inventory-items', params));
}

/** `GET /inventory-items/:id`. Added by BEN-158; reused by BEN-162. */
export function getUnit(id: string): Promise<unknown> {
  return apiRequest(one(id));
}

/** `POST /inventory-items`. Added by BEN-162. */
export function createUnit(body: CreateUnitBody): Promise<unknown> {
  return apiRequest('/inventory-items', { method: 'POST', body });
}

/** `POST /inventory-items/bulk`. Added by BEN-162. */
export function createUnits(body: CreateUnitsBody): Promise<unknown> {
  return apiRequest('/inventory-items/bulk', { method: 'POST', body });
}

/** `PATCH /inventory-items/:id`. Added by BEN-162. */
export function updateUnit(id: string, body: UpdateUnitBody): Promise<unknown> {
  return apiRequest(one(id), { method: 'PATCH', body });
}

/** `DELETE /inventory-items/:id`, after the screen's confirmation. A soft
 *  delete that stores the required removal reason (published 2026-10-03,
 *  closing contracts G2). Added by BEN-162. */
export function deleteUnit(id: string, reason: string): Promise<unknown> {
  return apiRequest(one(id), { method: 'DELETE', body: { reason } });
}

/** One published unit, as `/inventory-items` rows and the single read carry it
 *  (CoDev-OSRS-BE `src/inventory-items`, read 2026-10-03). Only the `asset`
 *  relation is loaded, so neither `assignedTo` nor `assignedToId` is in the
 *  body (G6); both are read only if a later response carries them. */
export type ApiUnit = {
  id: string;
  asset: { id: string; name: string; model?: string; category: ApiAssetCategory };
  serialNumber?: string;
  status: ApiUnitStatus;
  location: ApiOffice;
  assignedToId?: string;
  assignee?: { id: string; name: string };
  assignedAt?: string;
  price?: number;
  supplier?: string;
  purchasedAt?: string;
  description?: string;
  attachmentUrl?: string;
  createdAt: string;
  /** Admin-only secrets (constitution VIII). Only Inventory's single read may
   *  keep them; every other mapper drops them (spec 017 plan D14). */
  bitlockerIdentifier?: string;
  recoveryPin?: string;
};

const UNIT_STATUSES: readonly ApiUnitStatus[] = ['Available', 'Reserved', 'Assigned', 'Inactive'];
const OFFICES: readonly ApiOffice[] = ['Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao'];

function person(value: unknown): { id: string; name: string } | undefined {
  if (!isRecord(value)) return undefined;
  const name = [optStr(value, 'firstName'), optStr(value, 'lastName')].filter(Boolean).join(' ') || optStr(value, 'name');
  const key = value.id;
  return name && (typeof key === 'number' || typeof key === 'string') ? { id: String(key), name } : undefined;
}

export function readUnit(value: unknown): ApiUnit {
  const what = 'unit';
  const body = record(value, what);
  const asset = record(body.asset, `${what}.asset`);
  const category = str(asset, 'category', `${what}.asset`);
  if (!(API_ASSET_CATEGORIES as readonly string[]).includes(category)) throw new Error(`${what}: unpublished category ${category}`);
  const status = str(body, 'status', what);
  if (!(UNIT_STATUSES as readonly string[]).includes(status)) throw new Error(`${what}: unpublished status ${status}`);
  const location = str(body, 'location', what);
  if (!(OFFICES as readonly string[]).includes(location)) throw new Error(`${what}: unpublished office ${location}`);
  const assignedToId = body.assignedToId;
  return {
    id: id(body, 'id', what),
    asset: {
      id: id(asset, 'id', `${what}.asset`),
      name: str(asset, 'name', `${what}.asset`),
      model: optStr(asset, 'model'),
      category: category as ApiAssetCategory,
    },
    serialNumber: optStr(body, 'serialNumber'),
    status: status as ApiUnitStatus,
    location: location as ApiOffice,
    assignedToId: typeof assignedToId === 'number' || typeof assignedToId === 'string' ? String(assignedToId) : undefined,
    assignee: person(body.assignedTo),
    assignedAt: optStr(body, 'assignedAt'),
    price: optNum(body, 'price'),
    supplier: optStr(body, 'supplier'),
    purchasedAt: optStr(body, 'purchasedAt'),
    description: optStr(body, 'description'),
    attachmentUrl: optStr(body, 'attachmentUrl'),
    createdAt: str(body, 'createdAt', what),
    bitlockerIdentifier: optStr(body, 'bitlockerIdentifier'),
    recoveryPin: optStr(body, 'recoveryPin'),
  };
}
