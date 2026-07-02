import { UserBadge } from './userTypes';

// The API stores earned badges as nested records:
//   { _id, badge: { _id, name, description, icon, rarity, category, xpReward }, earnedAt }
// while the UI components want a flat UserBadge. The Badge model has RARITY
// (common..legendary), not the UI's level (bronze..platinum), so map it here.
const rarityToLevel: Record<string, UserBadge['level']> = {
  common: 'bronze',
  uncommon: 'silver',
  rare: 'gold',
  epic: 'platinum',
  legendary: 'platinum'
};

interface RawBadgeFields {
  _id?: string;
  name?: string;
  description?: string;
  icon?: string;
  rarity?: string;
  category?: string;
  xpReward?: number;
}

// Records arrive either nested ({ badge: {...}, earnedAt }) or pre-flattened
// (badge fields directly on the record), so the record itself carries the
// same optional fields. (An index signature here previously typed the flat
// fields as `unknown`, breaking the UserBadge mapping below.)
interface RawUserBadgeRecord extends RawBadgeFields {
  badge?: RawBadgeFields | null;
  earnedAt?: string;
}

/**
 * Flatten nested earned-badge records into the UI's UserBadge shape.
 * Records whose Badge document is missing (deleted badge) are dropped.
 */
export const flattenUserBadges = (records: unknown[] | undefined | null): UserBadge[] => {
  if (!Array.isArray(records)) return [];
  return records.flatMap((raw) => {
    const record = raw as RawUserBadgeRecord;
    // Already-flat objects (some endpoints may pre-flatten) pass through
    const source = record.badge ?? (record.name ? record : null);
    if (!source || !source.name) return [];
    return [{
      _id: String(source._id ?? record._id ?? source.name),
      name: source.name,
      description: source.description ?? '',
      icon: source.icon ?? '🏅',
      level: rarityToLevel[String(source.rarity ?? '').toLowerCase()] ?? 'bronze',
      rarity: source.rarity,
      category: source.category ?? 'achievement',
      xpReward: Number(source.xpReward ?? 0),
      earnedAt: String(record.earnedAt ?? new Date().toISOString())
    }];
  });
};
