import { UserBadge } from 'types/user';

// Fix the badge property access
const badge = badges.find(b => b._id === badgeId);

// Fix the badge rendering
{badges.map(badge => (
  <div
    key={badge._id}
    data-testid={`badge-item-${badge._id}`}
    className={`... ${highlightedBadges.has(badge._id) ? 'ring-2 ring-yellow-400' : ''}`}
  >
    {highlightedBadges.has(badge._id) && (
      <span
        data-testid={`badge-new-tag-${badge._id}`}
        className="..."
      >
        New!
      </span>
    )}
    <span data-testid={`badge-level-${badge._id}`} className="text-xs font-medium">
      {badge.level}
    </span>
  </div>
))} 