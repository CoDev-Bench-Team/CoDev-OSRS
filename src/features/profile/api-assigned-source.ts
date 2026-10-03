import { listUnits, readAllPages, readUnit } from '../../shared/api';
import type { AssignedEquipmentSource, AssignedItem } from './assigned-source';

/** The signed-in person's assigned units, from `GET /inventory-items?
 *  assignedToId=<user id>` (spec 017 Story 6). Every page is read: Profile
 *  draws no paging.
 *
 *  The unit read carries BitLocker identifier and recovery PIN even for an
 *  Employee (contracts G3). This mapper copies neither and logs nothing
 *  (FR-039). There is no Purchase Request number, so no tag (G5). */
export function apiAssignedSource(userId: string): AssignedEquipmentSource {
  return {
    async assignedToMe(): Promise<AssignedItem[]> {
      const rows = await readAllPages<unknown>((page, limit) => listUnits({ assignedToId: userId, page, limit }));
      return rows.map((row) => {
        const unit = readUnit(row);
        const assignedOn = unit.assignedAt?.slice(0, 10);
        return {
          id: unit.id,
          name: `${unit.asset.category} - ${unit.asset.name}`,
          ...(assignedOn ? { assignedOn } : {}),
        };
      });
    },
  };
}
