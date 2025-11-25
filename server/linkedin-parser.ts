import AdmZip from 'adm-zip';
import type { InsertContact, InsertUserProfile } from '@shared/schema';

interface ParsedCSVLine {
    [key: string]: string;
}

/**
 * Robust CSV parser that handles quotes and special characters
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
                currentValue += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue.trim());
    return values;
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(text: string): ParsedCSVLine[] {
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
        return [];
    }

    // Find header row (skip any preamble)
    let headerRowIndex = 0;
    let header: string[] = [];

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const row = parseCSVLine(lines[i]);
        // Check if this row looks like a header
        if (row.length > 2 && row.some(cell => cell.length > 0)) {
            headerRowIndex = i;
            header = row;
            break;
        }
    }

    const results: ParsedCSVLine[] = [];

    // Parse data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        // Skip empty rows
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;

        const row: ParsedCSVLine = {};
        header.forEach((key, index) => {
            row[key] = values[index] || '';
        });

        results.push(row);
    }

    return results;
}

/**
 * Extract CSV files from LinkedIn ZIP export
 */
export function extractZipFiles(buffer: Buffer): {
    profile?: string;
    positions?: string;
    connections?: string;
} {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    const files: { profile?: string; positions?: string; connections?: string } = {};

    zipEntries.forEach(entry => {
        const fileName = entry.entryName.toLowerCase();

        if (fileName.includes('profile') && fileName.endsWith('.csv')) {
            files.profile = entry.getData().toString('utf8');
        } else if (fileName.includes('positions') && fileName.endsWith('.csv')) {
            files.positions = entry.getData().toString('utf8');
        } else if (fileName.includes('connections') && fileName.endsWith('.csv')) {
            files.connections = entry.getData().toString('utf8');
        }
    });

    return files;
}

/**
 * Parse LinkedIn Profile.csv
 */
export function parseProfile(csvText: string): Partial<InsertUserProfile> {
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
        return {};
    }

    // Profile.csv typically has key-value pairs
    const profileData: { [key: string]: string } = {};
    rows.forEach(row => {
        const keys = Object.keys(row);
        if (keys.length >= 2) {
            profileData[keys[0]] = row[keys[1]] || row[keys[0]];
        }
    });

    return {
        firstName: profileData['First Name'] || '',
        lastName: profileData['Last Name'] || '',
        headline: profileData['Headline'] || '',
        summary: profileData['Summary'] || '',
        industries: profileData['Industry'] ? [profileData['Industry']] : [],
    };
}

/**
 * Parse LinkedIn Positions.csv
 */
export function parsePositions(csvText: string): {
    workHistory: string;
    currentCompany?: string;
    currentRole?: string;
} {
    const rows = parseCSV(csvText);

    const positions = rows.map(row => ({
        company: row['Company Name'] || row['Company'] || '',
        title: row['Title'] || row['Position'] || '',
        startDate: row['Started On'] || row['Start Date'] || '',
        endDate: row['Finished On'] || row['End Date'] || '',
        description: row['Description'] || '',
    })).filter(pos => pos.company || pos.title);

    // Find current position (no end date)
    const currentPosition = positions.find(pos => !pos.endDate || pos.endDate.trim() === '');

    return {
        workHistory: JSON.stringify(positions),
        currentCompany: currentPosition?.company,
        currentRole: currentPosition?.title,
    };
}

/**
 * Parse LinkedIn Connections.csv
 */
export function parseConnections(csvText: string): InsertContact[] {
    const rows = parseCSV(csvText);

    return rows.map(row => {
        const firstName = row['First Name'] || '';
        const lastName = row['Last Name'] || '';
        const name = `${firstName} ${lastName}`.trim();

        const email = row['Email Address'] || row['Email'] || '';
        const company = (row['Company'] && row['Company'].trim()) ? row['Company'] : 'Unknown';
        const role = (row['Position'] && row['Position'].trim()) ? row['Position'] : 'Unknown';
        const url = row['URL'] || '';

        return {
            name,
            email: email || undefined,
            company,
            role,
            location: 'Unknown',
            warmthScore: 0,
            priorityScore: 50,
            tags: ['LinkedIn Import'],
            notes: url ? `LinkedIn: ${url}\nImported from LinkedIn connections` : 'Imported from LinkedIn connections',
        };
    }).filter(contact => contact.name); // Only include contacts with names
}
