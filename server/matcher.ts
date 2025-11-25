import type { InsertContact, UserProfile } from '@shared/schema';

interface MatchResult {
    tags: string[];
    similarityScore: number;
}

/**
 * Check if contact has a similar role to the user
 */
export function findSimilarRoles(userProfile: UserProfile, contact: InsertContact): string[] {
    const tags: string[] = [];

    if (!userProfile.currentRole || !contact.role || contact.role === 'Unknown') {
        return tags;
    }

    const userRole = userProfile.currentRole.toLowerCase();
    const contactRole = contact.role.toLowerCase();

    // Exact match
    if (userRole === contactRole) {
        tags.push(`Similar Role - ${contact.role}`);
        return tags;
    }

    // Check for role keywords
    const roleKeywords = ['engineer', 'manager', 'director', 'vp', 'ceo', 'cto', 'cfo',
        'founder', 'product', 'design', 'sales', 'marketing', 'analyst'];

    for (const keyword of roleKeywords) {
        if (userRole.includes(keyword) && contactRole.includes(keyword)) {
            tags.push(`Similar Role - ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`);
            break;
        }
    }

    return tags;
}

/**
 * Check if contact worked at same companies as user
 */
export function findSharedCompanies(userProfile: UserProfile, contact: InsertContact): string[] {
    const tags: string[] = [];

    if (!userProfile.workHistory || !contact.company || contact.company === 'Unknown') {
        return tags;
    }

    try {
        const workHistory = JSON.parse(userProfile.workHistory) as Array<{
            company: string;
            title: string;
            startDate: string;
            endDate: string;
        }>;

        const userCompanies = workHistory.map(pos => pos.company.toLowerCase());
        const contactCompany = contact.company.toLowerCase();

        // Check current company
        if (userProfile.currentCompany &&
            userProfile.currentCompany.toLowerCase() === contactCompany) {
            tags.push(`Current Colleague - ${contact.company}`);
            return tags;
        }

        // Check past companies
        if (userCompanies.some(comp => comp === contactCompany)) {
            tags.push(`Former Colleague - ${contact.company}`);
        }
    } catch (error) {
        console.error('Error parsing work history:', error);
    }

    return tags;
}

/**
 * Check if contact is in same industry
 */
export function findIndustryPeers(userProfile: UserProfile, contact: InsertContact): string[] {
    const tags: string[] = [];

    if (!userProfile.industries || userProfile.industries.length === 0) {
        return tags;
    }

    // Check if contact's company or role suggests same industry
    // This is a simple heuristic - could be enhanced with industry classification
    const userIndustries = userProfile.industries.map(ind => ind.toLowerCase());
    const contactInfo = `${contact.company} ${contact.role}`.toLowerCase();

    for (const industry of userIndustries) {
        if (contactInfo.includes(industry.toLowerCase())) {
            tags.push(`Industry Peer - ${industry}`);
            break;
        }
    }

    return tags;
}

/**
 * Calculate overall similarity score (0-100)
 */
export function calculateSimilarityScore(userProfile: UserProfile, contact: InsertContact): number {
    let score = 0;

    // Role similarity (30 points)
    const roleTags = findSimilarRoles(userProfile, contact);
    if (roleTags.length > 0) {
        score += 30;
    }

    // Company overlap (50 points for current, 30 for former)
    const companyTags = findSharedCompanies(userProfile, contact);
    if (companyTags.some(tag => tag.startsWith('Current Colleague'))) {
        score += 50;
    } else if (companyTags.some(tag => tag.startsWith('Former Colleague'))) {
        score += 30;
    }

    // Industry match (20 points)
    const industryTags = findIndustryPeers(userProfile, contact);
    if (industryTags.length > 0) {
        score += 20;
    }

    return Math.min(score, 100);
}

/**
 * Generate all smart tags for a contact based on user profile
 */
export function generateSmartTags(userProfile: UserProfile, contact: InsertContact): MatchResult {
    const tags: string[] = [];

    // Collect all matching tags
    tags.push(...findSimilarRoles(userProfile, contact));
    tags.push(...findSharedCompanies(userProfile, contact));
    tags.push(...findIndustryPeers(userProfile, contact));

    // Calculate similarity score
    const similarityScore = calculateSimilarityScore(userProfile, contact);

    // Add high-value connection tag if score is high
    if (similarityScore >= 70) {
        tags.push('High-Value Connection');
    }

    return {
        tags: Array.from(new Set(tags)), // Remove duplicates
        similarityScore,
    };
}

/**
 * Batch process contacts to add smart tags
 */
export function addSmartTagsToContacts(
    userProfile: UserProfile,
    contacts: InsertContact[]
): InsertContact[] {
    return contacts.map(contact => {
        const { tags: smartTags } = generateSmartTags(userProfile, contact);

        // Merge smart tags with existing tags
        const existingTags = contact.tags || [];
        const allTags = Array.from(new Set([...existingTags, ...smartTags]));

        return {
            ...contact,
            tags: allTags,
        };
    });
}
