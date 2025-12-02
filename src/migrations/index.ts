import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20251202_015831 from './20251202_015831';
import * as migration_20251202_023627 from './20251202_023627';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20251202_015831.up,
    down: migration_20251202_015831.down,
    name: '20251202_015831',
  },
  {
    up: migration_20251202_023627.up,
    down: migration_20251202_023627.down,
    name: '20251202_023627'
  },
];
