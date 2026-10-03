import {
  ApiProblemError,
  createUnit,
  createUnits,
  deleteUnit,
  getUnit,
  listUnits,
  problemMessage,
  readAllPages,
  readPage,
  readUnit,
  updateUnit,
  type ApiUnit,
  type UpdateUnitBody,
} from '../../shared/api';
import type { ValidationProblem } from '../../shared/validation';
import type { Category } from '../assets/types';
import type { RemoteTablePage, RemoteTableQuery } from '../assets/useRemoteTableQuery';
import { ALL_CATEGORIES } from '../assets/table-query';
import type { InventorySource, UnitProblem } from './inventory-source';
import { UNIT_CHIPS, type UnitChip, type UnitDetail, type UnitDraft, type UnitRow } from './types';

/** The unit register over `/inventory-items` (spec 017 Story 8).
 *
 *  - Search reaches the asset's name, model and category only; PR and serial
 *    are not searchable (G9). No office filter is sent (G9).
 *  - The unit read carries no assignee name (G6); the row shows it when the
 *    response does, and the not-published dash for an `Assigned` unit when not.
 *  - No Purchase Request number and no attachment file are sent (G5, G7).
 *  - The row mapper drops BitLocker identifier and recovery PIN; only `get`
 *    keeps them, for the Admin's panel (plan D14). Nothing is logged. */

function toRow(unit: ApiUnit): UnitRow {
  return {
    id: unit.id,
    assetId: unit.asset.id,
    itemName: unit.asset.name,
    model: unit.asset.model,
    category: unit.asset.category as Category,
    serialNumber: unit.serialNumber,
    location: unit.location,
    status: unit.status,
    ...(unit.assignee ? { assignee: unit.assignee } : {}),
    createdAt: unit.createdAt,
  };
}

function toDetail(unit: ApiUnit): UnitDetail {
  return {
    ...toRow(unit),
    // The form keeps the assignment by id; the user list names it. The unit
    // read publishes neither the assignee nor its id today (G6), so this
    // stays empty until it does.
    ...(unit.assignedToId && !unit.assignee ? { assignee: { id: unit.assignedToId, name: '' } } : {}),
    price: unit.price,
    supplier: unit.supplier,
    purchasedAt: unit.purchasedAt?.slice(0, 10),
    bitlockerIdentifier: unit.bitlockerIdentifier,
    recoveryPin: unit.recoveryPin,
    description: unit.description,
    attachmentUrl: unit.attachmentUrl,
  };
}

/** The panels read a `ValidationProblem` (400 with pointers) or a
 *  `UnitProblem` (404, 409) and show the API's own words. */
function asPanelRefusal(error: unknown): never {
  if (error instanceof ApiProblemError) {
    const { status, problem } = error;
    if (status === 400 && problem.errors?.length) {
      const refusal: ValidationProblem = {
        type: 'validation-error',
        title: problem.title ?? 'Validation Failed',
        status: 400,
        errors: problem.errors.map((entry) => ({ detail: entry.detail, pointer: entry.pointer })),
      };
      throw refusal;
    }
    // A 400 without field errors is a business rule: its words are shown.
    if (status === 400 || status === 404 || status === 409) {
      const refusal: UnitProblem = { title: problem.title ?? '', status, detail: problemMessage(problem, error.message) };
      throw refusal;
    }
  }
  throw error;
}

const asNumber = (value: string | undefined) => (value === undefined ? undefined : Number(value));

/** The assignment and status of each unit last read, so an edit sends
 *  `assignedToId: null` only when it clears an assignment, and nothing when it
 *  leaves it (FR-046). Only those two: list reads carry the BitLocker
 *  identifier and recovery PIN (G3), and they are not kept (plan D14). */
const seen = new Map<string, Pick<ApiUnit, 'assignedToId' | 'status'>>();
const remember = (unit: ApiUnit) => {
  seen.set(unit.id, { assignedToId: unit.assignedToId, status: unit.status });
  return unit;
};

function updateBody(id: string, draft: UnitDraft): UpdateUnitBody {
  const before = seen.get(id);
  const body: UpdateUnitBody = {
    price: draft.price ?? null,
    supplier: draft.supplier ?? null,
    purchasedAt: draft.purchasedAt ?? null,
    serialNumber: draft.serialNumber ?? null,
    bitlockerIdentifier: draft.bitlockerIdentifier ?? null,
    recoveryPin: draft.recoveryPin ?? null,
    description: draft.description ?? null,
  };
  // A Reserved unit's draft omits these; they are then left as they are.
  if (draft.location) body.location = draft.location;
  if (draft.status) {
    body.status = draft.status;
    if (draft.status === 'Assigned' && draft.assignedToId) {
      if (draft.assignedToId !== before?.assignedToId) body.assignedToId = Number(draft.assignedToId);
    } else if (draft.status !== 'Assigned' && (before?.assignedToId || before?.status === 'Assigned')) {
      body.assignedToId = null;
    }
  }
  return body;
}

export const apiInventorySource: InventorySource = {
  createStatuses: ['Available', 'Assigned'],

  async list() {
    const rows = await readAllPages<unknown>((page, limit) => listUnits({ page, limit }));
    return rows.map((row) => toRow(remember(readUnit(row))));
  },

  async page(query: RemoteTableQuery<UnitChip>, withCounts: boolean): Promise<RemoteTablePage<UnitRow, UnitChip>> {
    const filters = {
      search: query.search.trim() || undefined,
      category: query.category === ALL_CATEGORIES ? undefined : (query.category as Category),
    };
    const rows = listUnits({ ...filters, status: query.status ?? undefined, page: query.page, limit: query.pageSize }).then(
      (body) => {
        const read = readPage<unknown>(body);
        if (!read) throw new Error('units: not a page');
        return read;
      },
    );
    const toRows = (data: unknown[]) => data.map((row) => toRow(remember(readUnit(row))));
    if (!withCounts) {
      const read = await rows;
      return { rows: toRows(read.data), total: read.total };
    }
    const total = async (status?: UnitChip) => {
      const read = readPage<unknown>(await listUnits({ ...filters, status, page: 1, limit: 1 }));
      if (!read) throw new Error('units: not a page');
      return read.total;
    };
    // The page counts its own chip (All when none is pressed). The chips do
    // not add up to All, which holds Inactive units too, so the rest are read.
    const others: (UnitChip | undefined)[] = [undefined, ...UNIT_CHIPS].filter((chip) => chip !== (query.status ?? undefined));
    const [read, ...totals] = await Promise.all([rows, ...others.map((chip) => total(chip))]);
    const counted = new Map<UnitChip | undefined, number>(others.map((chip, i) => [chip, totals[i]]));
    counted.set(query.status ?? undefined, read.total);
    return {
      rows: toRows(read.data),
      total: read.total,
      counts: { all: counted.get(undefined) ?? 0, of: Object.fromEntries(UNIT_CHIPS.map((chip) => [chip, counted.get(chip) ?? 0])) },
    };
  },

  async get(id) {
    try {
      return toDetail(remember(readUnit(await getUnit(id))));
    } catch (error) {
      asPanelRefusal(error);
    }
  },

  async create(draft) {
    if (!draft.location) throw new Error('A unit needs an office.');
    try {
      return toDetail(
        remember(
          readUnit(
            await createUnit({
              assetId: Number(draft.assetId),
              location: draft.location,
              price: draft.price,
              supplier: draft.supplier,
              purchasedAt: draft.purchasedAt,
              serialNumber: draft.serialNumber,
              bitlockerIdentifier: draft.bitlockerIdentifier,
              recoveryPin: draft.recoveryPin,
              // Assigned when a user is given; Available otherwise (D13).
              assignedToId: draft.status === 'Assigned' ? asNumber(draft.assignedToId) : undefined,
              description: draft.description,
            }),
          ),
        ),
      );
    } catch (error) {
      asPanelRefusal(error);
    }
  },

  async createBatch(draft) {
    try {
      const body = await createUnits({
        assetId: Number(draft.assetId),
        location: draft.location,
        price: draft.price,
        supplier: draft.supplier,
        purchasedAt: draft.purchasedAt,
        units: draft.units.map((unit) => ({
          serialNumber: unit.serialNumber,
          bitlockerIdentifier: unit.bitlockerIdentifier,
          recoveryPin: unit.recoveryPin,
        })),
      });
      const rows = Array.isArray(body) ? body : readPage<unknown>(body)?.data;
      if (!rows) throw new Error('units: the batch returned no units');
      return rows.map((row) => toRow(remember(readUnit(row))));
    } catch (error) {
      asPanelRefusal(error);
    }
  },

  async update(id, draft) {
    try {
      return toDetail(remember(readUnit(await updateUnit(id, updateBody(id, draft)))));
    } catch (error) {
      asPanelRefusal(error);
    }
  },

  async remove(id, reason) {
    try {
      await deleteUnit(id, reason);
      seen.delete(id);
    } catch (error) {
      asPanelRefusal(error);
    }
  },
};
