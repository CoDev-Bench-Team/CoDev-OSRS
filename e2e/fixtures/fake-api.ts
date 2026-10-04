import type { Page, Route } from '@playwright/test';

/** A test-only stand-in for the published REST API (spec 017, Session
 *  2026-10-03 second). The application ships no seeded data; the e2e suite
 *  answers the browser's `/auth/*` and `/api/*` calls here, in the test
 *  process, so the demo path stays covered (constitution VI) without a live
 *  backend or a Google sign-in.
 *
 *  It keeps the rules the live API publishes in its Swagger (2026-10-03):
 *  submit reserves units at the requester's office, all or nothing; reject and
 *  cancel release them; receive assigns them to the requester; an Employee
 *  sees only their own requests and gets `404` for another's; illegal
 *  transitions are `409`. Bodies are `application/problem+json`.
 *
 *  Response shapes follow the field names the SPA's mappers read. Until the
 *  T0 live field record lands (spec 017 plan D15), those names are
 *  provisional, and this fake is changed with the mappers, never apart.
 *  `/sign` completes the request, as published and as constitution 10.0.0
 *  IV now requires (ADR-0013). */

type Role = 'employee' | 'admin';
type Office = 'Cebu' | 'Bacolod' | 'Makati' | 'Ortigas' | 'Davao';
type Status =
  | 'pending_approval'
  | 'approved'
  | 'ready_for_pickup'
  | 'for_delivery'
  | 'received'
  | 'rejected'
  | 'completed'
  | 'cancelled';
type UnitStatus = 'Available' | 'Reserved' | 'Assigned' | 'Inactive';

type User = { id: number; firstName: string; lastName: string; email: string; role: Role; location: Office };
type Asset = {
  id: number;
  name: string;
  category: string;
  model: string;
  description: string | null;
  imageBase64: string | null;
  lowQtyAlert: number;
  ram: string | null;
  storage: string | null;
  processor: string | null;
  graphics: string | null;
  operatingSystem: string | null;
  createdAt: string;
};
type Unit = {
  id: number;
  assetId: number;
  serialNumber: string | null;
  bitlockerIdentifier: string | null;
  recoveryPin: string | null;
  status: UnitStatus;
  location: Office;
  assignedToId: number | null;
  assignedAt: string | null;
  requestId: number | null;
  price: number | null;
  supplier: string | null;
  purchasedAt: string | null;
  description: string | null;
  attachmentUrl: string | null;
  createdAt: string;
};
type Request = {
  id: number;
  displayId: string;
  requesterId: number;
  requestingOffice: Office;
  status: Status;
  purpose: string | null;
  items: { assetId: number; quantity: number }[];
  pickupLocation: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  receivedSignature: string | null;
  createdAt: string;
  receivedAt: string | null;
  resolvedAt: string | null;
  timeline: { status: Status; at: string }[];
};

export const PEOPLE = {
  'Maya Santos': { id: 1, firstName: 'Maya', lastName: 'Santos', email: 'mayas@codev.com', role: 'employee', location: 'Davao' },
  'Ethan Cruz': { id: 2, firstName: 'Ethan', lastName: 'Cruz', email: 'ethanc@codev.com', role: 'admin', location: 'Davao' },
  'Samantha Reyes': { id: 3, firstName: 'Samantha', lastName: 'Reyes', email: 'samanthar@codev.com', role: 'employee', location: 'Cebu' },
} as const satisfies Record<string, User>;
export type Person = 'Maya Santos' | 'Ethan Cruz';

const LIVE: readonly Status[] = ['pending_approval', 'approved', 'ready_for_pickup', 'for_delivery', 'received'];
const RESOLVED: readonly Status[] = ['rejected', 'completed', 'cancelled'];
const ALL: readonly Status[] = [...LIVE, ...RESOLVED];

class Problem {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail?: string,
    readonly errors?: { detail: string; pointer: string }[],
  ) {}
}

const invalid = (pointer: string, detail: string) =>
  new Problem(400, 'Validation Failed', undefined, [{ detail, pointer }]);

function paged<T>(rows: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 10));
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    total: rows.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(rows.length / limit)),
  };
}

const contains = (haystack: string, needle: string | null) => !needle || haystack.toLowerCase().includes(needle.toLowerCase());

export class FakeApi {
  private clock = Date.parse('2026-10-03T01:00:00.000Z');
  private nextId = { asset: 100, unit: 1000, request: 1847 };
  readonly users: User[] = Object.values(PEOPLE);
  readonly assets: Asset[] = [];
  readonly units: Unit[] = [];
  readonly requests: Request[] = [];
  current: User | null = null;
  /** How many unit-list reads still return a unit after its delete, as the
   *  live API's soft delete was seen to (its read lags the write). 0 = none. */
  staleReadsAfterDelete = 0;
  /** Delay every list read by this many ms, to see a loading state. */
  listDelayMs = 0;
  private lagging: { unit: Unit; reads: number }[] = [];

  constructor() {
    // Two requests the routing tests read: Maya's own, pending, and one that
    // belongs to someone else.
    const laptop = this.addAsset({ name: 'Business Laptop', category: 'Laptop', model: 'Dell Latitude 5440' });
    for (let i = 0; i < 6; i++) this.addUnit(laptop.id, 'Davao', `SEED-LT-${i}`);
    for (let i = 0; i < 2; i++) this.addUnit(laptop.id, 'Cebu', `SEED-LT-C${i}`);
    this.submit(PEOPLE['Maya Santos'], { items: [{ assetId: laptop.id, quantity: 1 }], purpose: 'For onboarding' });
    this.nextId.request = 1850;
    this.submit(PEOPLE['Samantha Reyes'], { items: [{ assetId: laptop.id, quantity: 1 }] });
  }

  private now(): string {
    this.clock += 60_000;
    return new Date(this.clock).toISOString();
  }

  private addAsset(input: { name: string; category: string; model: string }): Asset {
    const asset: Asset = {
      id: ++this.nextId.asset,
      name: input.name,
      category: input.category,
      model: input.model,
      description: null,
      imageBase64: null,
      lowQtyAlert: 5,
      ram: null,
      storage: null,
      processor: null,
      graphics: null,
      operatingSystem: null,
      createdAt: this.now(),
    };
    this.assets.push(asset);
    return asset;
  }

  private addUnit(assetId: number, location: Office, serialNumber: string | null): Unit {
    const unit: Unit = {
      id: ++this.nextId.unit,
      assetId,
      serialNumber,
      bitlockerIdentifier: null,
      recoveryPin: null,
      status: 'Available',
      location,
      assignedToId: null,
      assignedAt: null,
      requestId: null,
      price: null,
      supplier: null,
      purchasedAt: null,
      description: null,
      attachmentUrl: null,
      createdAt: this.now(),
    };
    this.units.push(unit);
    return unit;
  }

  // ---------------------------------------------------------------- reads

  private me(): User {
    if (!this.current) throw new Problem(401, 'Unauthorized');
    return this.current;
  }

  private admin(): User {
    const user = this.me();
    if (user.role !== 'admin') throw new Problem(403, 'Insufficient permissions.');
    return user;
  }

  private userJson(user: User) {
    return {
      ...user,
      googleSubject: `google-${user.id}`,
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    };
  }

  private count(assetId: number, status: UnitStatus, location?: Office) {
    return this.units.filter((u) => u.assetId === assetId && u.status === status && (!location || u.location === location)).length;
  }

  private available(assetId: number, location?: Office) {
    return this.count(assetId, 'Available', location);
  }

  private assetJson(asset: Asset, location?: Office) {
    const quantity = this.available(asset.id, location);
    const reservedQuantity = this.count(asset.id, 'Reserved', location);
    return {
      ...asset,
      updatedAt: null,
      quantity,
      reservedQuantity,
      assignedQuantity: this.count(asset.id, 'Assigned', location),
      totalQuantity: quantity + reservedQuantity,
    };
  }

  /** As the backend serialises a unit: only the `asset` relation is loaded,
   *  so no assignee and no `assignedToId` (contracts G6). */
  private unitJson(unit: Unit) {
    const asset = this.assets.find((a) => a.id === unit.assetId)!;
    const { requestId: _requestId, assignedToId: _assignedToId, ...rest } = unit;
    return { ...rest, asset: { id: asset.id, name: asset.name, model: asset.model, category: asset.category } };
  }

  private requestJson(request: Request) {
    const requester = this.users.find((u) => u.id === request.requesterId)!;
    return {
      id: request.id,
      displayId: request.displayId,
      status: request.status,
      purpose: request.purpose,
      requestingOffice: request.requestingOffice,
      requestor: {
        id: requester.id,
        firstName: requester.firstName,
        lastName: requester.lastName,
        email: requester.email,
        location: requester.location,
      },
      items: request.items.map((item) => {
        const asset = this.assets.find((a) => a.id === item.assetId)!;
        return {
          assetId: item.assetId,
          quantity: item.quantity,
          availableStock: this.available(item.assetId, request.requestingOffice),
          asset: { id: asset.id, name: asset.name, model: asset.model, category: asset.category },
        };
      }),
      units: this.units
        .filter((u) => u.requestId === request.id)
        .map((u) => ({ id: u.id, assetId: u.assetId, serialNumber: u.serialNumber, status: u.status })),
      pickupLocation: request.pickupLocation,
      rejectionReason: request.rejectionReason,
      cancellationReason: request.cancellationReason,
      receivedSignature: request.receivedSignature,
      createdAt: request.createdAt,
      receivedAt: request.receivedAt,
      resolvedAt: request.resolvedAt,
      timeline: request.timeline,
    };
  }

  private visible(user: User): Request[] {
    return user.role === 'admin' ? this.requests : this.requests.filter((r) => r.requesterId === user.id);
  }

  private filtered(url: URL, rows: Request[]): Request[] {
    const p = url.searchParams;
    return rows.filter((r) => {
      const requester = this.users.find((u) => u.id === r.requesterId)!;
      const items = r.items.map((i) => this.assets.find((a) => a.id === i.assetId)!.name).join(' ');
      return (
        contains(r.displayId, p.get('displayId')) &&
        // As the backend: each of first name, last name and email on its own
        // (`ILIKE` per column), never the three joined.
        [requester.firstName, requester.lastName, requester.email].some((field) => contains(field, p.get('requester'))) &&
        (!p.get('requesterId') || String(r.requesterId) === p.get('requesterId')) &&
        contains(items, p.get('itemName'))
      );
    });
  }

  private sorted(rows: Request[], sort: string | null, by: (r: Request) => string): Request[] {
    const name = (r: Request) => {
      const u = this.users.find((x) => x.id === r.requesterId)!;
      return `${u.firstName} ${u.lastName}`;
    };
    return [...rows].sort((a, b) => {
      if (sort === 'oldest') return by(a).localeCompare(by(b)) || a.id - b.id;
      if (sort === 'employee_name_asc') return name(a).localeCompare(name(b)) || by(b).localeCompare(by(a)) || b.id - a.id;
      return by(b).localeCompare(by(a)) || b.id - a.id;
    });
  }

  private find(id: string, user: User): Request {
    const request = this.visible(user).find((r) => String(r.id) === id);
    if (!request) throw new Problem(404, `Request with ID '${id}' could not be found.`);
    return request;
  }

  // ---------------------------------------------------------------- writes

  private submit(user: User, body: { items?: { assetId: number; quantity: number }[]; purpose?: string }): Request {
    const items = body.items ?? [];
    if (!items.length) throw invalid('#/items', 'items must contain at least 1 elements');
    items.forEach((item, i) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) throw invalid(`#/items/${i}/quantity`, 'quantity must not be less than 1');
      if (!this.assets.some((a) => a.id === item.assetId)) throw invalid(`#/items/${i}/assetId`, 'asset does not exist');
    });
    // All or nothing: check every line before reserving any.
    for (const item of items) {
      const available = this.available(item.assetId, user.location);
      if (available < item.quantity) {
        const asset = this.assets.find((a) => a.id === item.assetId)!;
        throw new Problem(400, 'Insufficient stock', `Only ${available} ${asset.name} available at ${user.location}.`);
      }
    }
    const at = this.now();
    const request: Request = {
      id: this.nextId.request,
      displayId: `REQ-2026-${this.nextId.request}`,
      requesterId: user.id,
      requestingOffice: user.location,
      status: 'pending_approval',
      purpose: body.purpose?.trim() || null,
      items,
      pickupLocation: null,
      rejectionReason: null,
      cancellationReason: null,
      receivedSignature: null,
      createdAt: at,
      receivedAt: null,
      resolvedAt: null,
      timeline: [{ status: 'pending_approval', at }],
    };
    this.nextId.request += 1;
    for (const item of items) {
      this.units
        .filter((u) => u.assetId === item.assetId && u.status === 'Available' && u.location === user.location)
        .slice(0, item.quantity)
        .forEach((u) => {
          u.status = 'Reserved';
          u.requestId = request.id;
        });
    }
    this.requests.push(request);
    return request;
  }

  private move(request: Request, status: Status) {
    const at = this.now();
    request.status = status;
    request.timeline.push({ status, at });
    if (RESOLVED.includes(status)) request.resolvedAt = at;
    if (status === 'received') request.receivedAt = at;
    return at;
  }

  private release(request: Request) {
    for (const unit of this.units.filter((u) => u.requestId === request.id && u.status === 'Reserved')) {
      unit.status = 'Available';
      unit.requestId = null;
    }
  }

  private conflict(request: Request, action: string): never {
    throw new Problem(409, `A request with status '${request.status}' cannot be ${action}.`);
  }

  // ---------------------------------------------------------------- routing

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api(?=\/)/, '');
    const method = request.method();
    const body = (() => {
      try {
        return request.postDataJSON() as Record<string, unknown> | null;
      } catch {
        return null;
      }
    })();
    if (this.listDelayMs && method === 'GET') await new Promise((resolve) => setTimeout(resolve, this.listDelayMs));
    try {
      const result = this.dispatch(method, path, url, body ?? {});
      await route.fulfill({ status: result.status ?? 200, contentType: 'application/json', body: JSON.stringify(result.body) });
    } catch (error) {
      if (!(error instanceof Problem)) throw error;
      await route.fulfill({
        status: error.status,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: error.errors ? 'validation-error' : 'about:blank',
          title: error.title,
          status: error.status,
          ...(error.detail ? { detail: error.detail } : {}),
          ...(error.errors ? { errors: error.errors } : {}),
        }),
      });
    }
  }

  private dispatch(method: string, path: string, url: URL, body: Record<string, unknown>): { status?: number; body: unknown } {
    const segments = path.split('/').filter(Boolean);
    const [resource, id, action] = segments;

    if (resource === 'auth') {
      if (id === 'me' && method === 'GET') return { body: this.userJson(this.me()) };
      if (id === 'logout' && method === 'POST') {
        this.current = null;
        return { status: 201, body: {} };
      }
      throw new Problem(401, 'Unauthorized');
    }

    const user = this.me();

    if (resource === 'assets') {
      if (!id && method === 'GET') {
        const p = url.searchParams;
        const location = (p.get('location') as Office | null) ?? undefined;
        const level = p.get('stockLevel');
        const levelOf = (a: Asset) => {
          const n = this.available(a.id, location);
          return n === 0 ? 'out_of_stock' : n <= a.lowQtyAlert ? 'low_stock' : 'in_stock';
        };
        const matching = this.assets
          .filter((a) => contains(`${a.name} ${a.model} ${a.category}`, p.get('search')))
          .filter((a) => !p.get('category') || a.category === p.get('category'));
        const rows = matching.filter((a) => !level || levelOf(a) === level).map((a) => this.assetJson(a, location));
        // As the backend does (BEN-115): counts follow search, category and
        // office, and ignore stockLevel, so every chip keeps its number.
        const byStockLevel = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
        for (const a of matching) byStockLevel[levelOf(a)] += 1;
        return { body: { ...paged(rows, url), counts: { total: matching.length, byStockLevel } } };
      }
      if (!id && method === 'POST') {
        this.admin();
        if (!body.name) throw invalid('#/name', 'name should not be empty');
        if (!body.model) throw invalid('#/model', 'model should not be empty');
        const asset = this.addAsset({ name: String(body.name), category: String(body.category), model: String(body.model) });
        if (typeof body.lowQtyAlert === 'number') asset.lowQtyAlert = body.lowQtyAlert;
        return { status: 201, body: this.assetJson(asset) };
      }
      const asset = this.assets.find((a) => String(a.id) === id);
      if (!asset) throw new Problem(404, `Asset with ID '${id}' could not be found.`);
      if (method === 'GET') return { body: this.assetJson(asset) };
      if (method === 'PATCH') {
        this.admin();
        Object.assign(asset, Object.fromEntries(Object.entries(body).filter(([k]) => k in asset && k !== 'id')));
        return { body: this.assetJson(asset) };
      }
    }

    if (resource === 'inventory-items') {
      if (!id && method === 'GET') {
        const p = url.searchParams;
        const ghosts = this.lagging.filter((l) => l.reads > 0);
        ghosts.forEach((l) => (l.reads -= 1));
        const rows = [...this.units, ...ghosts.map((l) => l.unit)]
          .filter((u) => {
            const a = this.assets.find((x) => x.id === u.assetId)!;
            return (
              contains(`${a.name} ${a.model} ${a.category}`, p.get('search')) &&
              (!p.get('category') || a.category === p.get('category')) &&
              (!p.get('status') || u.status === p.get('status')) &&
              (!p.get('assignedToId') || String(u.assignedToId) === p.get('assignedToId'))
            );
          })
          .map((u) => this.unitJson(u));
        return { body: paged(rows, url) };
      }
      this.admin();
      if (id === 'bulk' && method === 'POST') {
        const units = (body.units as { serialNumber?: string }[] | undefined) ?? [];
        if (units.length < 1 || units.length > 100) throw invalid('#/units', 'units must contain 1 to 100 elements');
        const created = units.map((u) => this.addUnit(Number(body.assetId), body.location as Office, u.serialNumber ?? null));
        return { status: 201, body: created.map((u) => this.unitJson(u)) };
      }
      if (!id && method === 'POST') {
        const unit = this.addUnit(Number(body.assetId), body.location as Office, (body.serialNumber as string) ?? null);
        if (typeof body.assignedToId === 'number') {
          unit.status = 'Assigned';
          unit.assignedToId = body.assignedToId;
          unit.assignedAt = this.now();
        }
        return { status: 201, body: this.unitJson(unit) };
      }
      const unit = this.units.find((u) => String(u.id) === id);
      if (!unit) throw new Problem(404, `Inventory item with ID '${id}' could not be found.`);
      if (method === 'GET') return { body: this.unitJson(unit) };
      if (method === 'DELETE') {
        if (!body.reason) throw invalid('#/reason', 'reason should not be empty');
        this.units.splice(this.units.indexOf(unit), 1);
        if (this.staleReadsAfterDelete) this.lagging.push({ unit, reads: this.staleReadsAfterDelete });
        return { body: this.unitJson(unit) };
      }
      if (method === 'PATCH') {
        if (body.assignedToId === null) {
          unit.assignedToId = null;
          unit.assignedAt = null;
          unit.status = 'Available';
        }
        if (typeof body.assignedToId === 'number') {
          unit.assignedToId = body.assignedToId;
          unit.assignedAt = this.now();
          unit.status = 'Assigned';
        }
        if (typeof body.status === 'string') unit.status = body.status as UnitStatus;
        return { body: this.unitJson(unit) };
      }
    }

    if (resource === 'users' && method === 'GET') {
      this.admin();
      return { body: this.users.map((u) => this.userJson(u)) };
    }

    if (resource === 'requests') {
      if (id === 'counts' && method === 'GET') {
        const rows = this.filtered(url, this.visible(user));
        const byStatus = Object.fromEntries(ALL.map((s) => [s, rows.filter((r) => r.status === s).length]));
        const inProcessing = rows.filter((r) => ['approved', 'ready_for_pickup', 'for_delivery', 'received'].includes(r.status)).length;
        return { body: { total: rows.length, byStatus, inProcessing } };
      }
      if (id === 'history' && method === 'GET') {
        this.admin();
        const status = url.searchParams.get('status');
        const rows = this.filtered(url, this.requests).filter((r) => (status ? r.status === status : RESOLVED.includes(r.status)));
        const ordered = this.sorted(rows, url.searchParams.get('sort'), (r) => r.resolvedAt ?? '');
        return { body: paged(ordered.map((r) => this.requestJson(r)), url) };
      }
      if (!id && method === 'GET') {
        const status = url.searchParams.get('status');
        const rows = this.filtered(url, this.visible(user)).filter((r) => !status || r.status === status);
        const ordered = this.sorted(rows, url.searchParams.get('sort'), (r) => r.createdAt);
        return { body: paged(ordered.map((r) => this.requestJson(r)), url) };
      }
      if (!id && method === 'POST') {
        if (user.role !== 'employee') throw new Problem(403, 'Insufficient permissions.');
        const created = this.submit(user, body as { items?: { assetId: number; quantity: number }[]; purpose?: string });
        return { status: 201, body: this.requestJson(created) };
      }
      const request = this.find(id, user);
      if (!action && method === 'GET') return { body: this.requestJson(request) };
      if (!action && method === 'PATCH') {
        this.admin();
        const to = body.status as Status;
        const from = request.status;
        if (to === 'approved' || to === 'rejected') {
          if (from !== 'pending_approval') this.conflict(request, `moved to '${to}'`);
          if (to === 'rejected') {
            const reason = String(body.rejectionReason ?? '').trim();
            if (!reason) throw invalid('#/rejectionReason', 'rejectionReason should not be empty');
            request.rejectionReason = reason;
            this.release(request);
          }
        } else if (to === 'ready_for_pickup' || to === 'for_delivery') {
          if (!['approved', 'ready_for_pickup', 'for_delivery'].includes(from)) this.conflict(request, `moved to '${to}'`);
          if (to === 'for_delivery' && from === 'for_delivery') this.conflict(request, `moved to '${to}'`);
          if (to === 'ready_for_pickup') {
            const location = String(body.pickupLocation ?? '').trim();
            if (!location) throw invalid('#/pickupLocation', 'pickupLocation should not be empty');
            request.pickupLocation = location;
          }
        } else {
          this.conflict(request, `moved to '${String(to)}'`);
        }
        this.move(request, to);
        return { body: this.requestJson(request) };
      }
      if (action === 'cancel' && method === 'POST') {
        const reason = String(body.reason ?? '').trim();
        if (!reason) throw invalid('#/reason', 'reason should not be empty');
        const allowed =
          user.role === 'employee' ? ['pending_approval'] : ['approved', 'ready_for_pickup', 'for_delivery'];
        if (!allowed.includes(request.status)) this.conflict(request, 'cancelled');
        request.cancellationReason = reason;
        this.release(request);
        this.move(request, 'cancelled');
        return { body: this.requestJson(request) };
      }
      if (action === 'receive' && method === 'POST') {
        if (!['for_delivery', 'ready_for_pickup'].includes(request.status)) this.conflict(request, 'marked received');
        const at = this.move(request, 'received');
        for (const unit of this.units.filter((u) => u.requestId === request.id && u.status === 'Reserved')) {
          unit.status = 'Assigned';
          unit.assignedToId = request.requesterId;
          unit.assignedAt = at;
        }
        return { body: this.requestJson(request) };
      }
      if (action === 'sign' && method === 'POST') {
        // As published: the owning Employee signs a `received` request, and
        // signing completes it (constitution 10.0.0 IV, ADR-0013).
        if (user.role !== 'employee') throw new Problem(403, 'Insufficient permissions.');
        if (body.agreed !== true) throw invalid('#/agreed', 'You must agree to the accountability conditions to sign.');
        const fullName = String(body.fullName ?? '').trim();
        if (!fullName) throw invalid('#/fullName', 'fullName is required to sign the form.');
        if (request.status !== 'received') this.conflict(request, 'signed for');
        request.receivedSignature = fullName;
        this.move(request, 'completed');
        return { body: this.requestJson(request) };
      }
    }

    throw new Problem(404, `No route for ${method} ${path}`);
  }
}

/** Answer the page's API calls from `api`, and keep Google's script off the
 *  network: the suite signs people in through the fake session. */
export async function serve(page: Page, api: FakeApi) {
  await page.route(/^https?:\/\/[^/]+\/(auth|api)\//, (route) => api.handle(route));
  await page.route(/accounts\.google\.com/, (route) => route.abort());
}
