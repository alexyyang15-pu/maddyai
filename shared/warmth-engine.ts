export function calculateWarmthScore(contact: {
  lastInteraction: Date | null;
  priorityScore: number;
  tags?: string[] | null;
  mutualConnectionsCount?: number; // Assuming this might come from an enrichment source later
}): number {
  // Base Score: 100
  let score = 100;

  // Time Decay: -0.5 points per day of inactivity
  if (contact.lastInteraction) {
    const daysSinceInteraction = Math.floor(
      (new Date().getTime() - new Date(contact.lastInteraction).getTime()) / (1000 * 3600 * 24)
    );
    score -= daysSinceInteraction * 0.5;
  } else {
    // If no interaction ever, maybe default to 0 or treat as very old? 
    // Let's say 50 for now if new, but usually lastInteraction is null means new contact?
    // Or treat as "cold" if imported without history.
    // For Maddy AI context: "Below 50: Cold".
    score = 50; 
  }

  // Recent Interaction Bonus: +15 if contact in last 7 days
  if (contact.lastInteraction) {
    const daysSinceInteraction = Math.floor(
      (new Date().getTime() - new Date(contact.lastInteraction).getTime()) / (1000 * 3600 * 24)
    );
    if (daysSinceInteraction <= 7) {
      score += 15;
    }
  }

  // Priority Weighting: +10 if priority score is 80+
  if (contact.priorityScore >= 80) {
    score += 10;
  }

  // Network Effect: +5 per mutual connection (Mocked for now as 0 if not provided)
  const mutuals = contact.mutualConnectionsCount || 0;
  score += mutuals * 5;

  // Cap score at 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getWarmthStatus(score: number): 'cold' | 'cooling' | 'warm' {
  if (score >= 85) return 'warm';
  if (score >= 50) return 'cooling';
  return 'cold';
}
