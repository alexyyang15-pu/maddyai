import { contacts, nudges, type Contact, type InsertContact, type Nudge, type InsertNudge } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, gte, lt, sql, inArray, isNull } from "drizzle-orm";

export interface IStorage {
  // Contacts
  getContacts(filters?: ContactFilters): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<void>;
  
  // Stats
  getStats(): Promise<Stats>;

  // Nudges
  getNudges(): Promise<(Nudge & { contact: Contact })[]>;
  createNudge(nudge: InsertNudge): Promise<Nudge>;
  updateNudgeStatus(id: number, status: string): Promise<Nudge | undefined>;
  
  // Seed data helper
  seed(): Promise<void>;
}

export interface ContactFilters {
  query?: string;
  category?: string;
  industry?: string;
  minWarmth?: number;
  minPriority?: number;
}

export interface Stats {
  totalContacts: number;
  thisMonthContacts: number;
  topPriorityCount: number;
  needsWarmthCount: number;
}

export class DatabaseStorage implements IStorage {
  async getContacts(filters?: ContactFilters): Promise<Contact[]> {
    let conditions = [];

    if (filters?.query) {
      const lowerQuery = `%${filters.query.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(contacts.name, lowerQuery),
          ilike(contacts.role, lowerQuery),
          ilike(contacts.company, lowerQuery),
          sql`array_to_string(${contacts.tags}, ',') ILIKE ${lowerQuery}`
        )
      );
    }

    if (filters?.category) {
      conditions.push(eq(contacts.category, filters.category));
    }

    if (filters?.industry) {
      conditions.push(eq(contacts.industry, filters.industry));
    }
    
    let query = db.select().from(contacts);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(contacts.warmthScore));
    }
    
    return await query.orderBy(desc(contacts.warmthScore));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async getStats(): Promise<Stats> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    
    const [thisMonth] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(gte(contacts.lastInteraction, firstDayOfMonth));

    const [topPriority] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(gte(contacts.priorityScore, 80));

    // Needs warmth: > 60 days since last interaction
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const [needsWarmth] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(or(
        lt(contacts.lastInteraction, sixtyDaysAgo),
        isNull(contacts.lastInteraction)
      ));

    return {
      totalContacts: Number(total.count),
      thisMonthContacts: Number(thisMonth.count),
      topPriorityCount: Number(topPriority.count),
      needsWarmthCount: Number(needsWarmth.count)
    };
  }

  async getNudges(): Promise<(Nudge & { contact: Contact })[]> {
    const result = await db.select({
      nudge: nudges,
      contact: contacts,
    })
    .from(nudges)
    .innerJoin(contacts, eq(nudges.contactId, contacts.id))
    .orderBy(desc(nudges.priority), desc(nudges.date));

    return result.map(row => ({
      ...row.nudge,
      contact: row.contact
    }));
  }

  async createNudge(nudge: InsertNudge): Promise<Nudge> {
    const [newNudge] = await db
      .insert(nudges)
      .values(nudge)
      .returning();
    return newNudge;
  }

  async updateNudgeStatus(id: number, status: string): Promise<Nudge | undefined> {
    const [updated] = await db
      .update(nudges)
      .set({ status })
      .where(eq(nudges.id, id))
      .returning();
    return updated;
  }

  async seed(): Promise<void> {
    const existing = await this.getContacts();
    if (existing.length > 0) return;

    const mockContacts: InsertContact[] = [
      {
        name: 'Maya Patel',
        role: 'Founder & CEO',
        company: 'Lumina Health',
        location: 'San Francisco, CA',
        email: 'maya@lumina.health',
        warmthScore: 85,
        priorityScore: 90,
        lastInteraction: new Date('2024-11-10'),
        tags: ['HealthTech', 'Founder', 'SF'],
        notes: 'Met at TechCrunch Disrupt. Interested in Series A intros.',
        category: 'Founder',
        industry: 'HealthTech',
        interests: ['Digital Health', 'Yoga', 'Meditation'],
        expertise: ['Healthcare Regulations', 'B2B Sales']
      },
      {
        name: 'Alex Chen',
        role: 'Partner',
        company: 'Greylock',
        location: 'Menlo Park, CA',
        email: 'achen@greylock.com',
        warmthScore: 42,
        priorityScore: 85,
        lastInteraction: new Date('2024-09-15'),
        nextFollowUp: new Date('2024-11-20'),
        tags: ['VC', 'Series A', 'AI'],
        notes: 'Key contact for AI infra deals. Loves hiking.',
        category: 'Investor',
        industry: 'Venture Capital',
        interests: ['Hiking', 'AI Infrastructure', 'Poker'],
        expertise: ['Series A', 'Board Governance']
      },
      {
        name: 'Sarah Jenkins',
        role: 'VP of Engineering',
        company: 'Stripe',
        location: 'New York, NY',
        email: 'sarah.j@stripe.com',
        warmthScore: 92,
        priorityScore: 70,
        lastInteraction: new Date('2024-11-15'),
        tags: ['Fintech', 'Engineering', 'Operator'],
        notes: 'Former colleague. Good for technical due diligence.',
        category: 'Collaborator',
        industry: 'Fintech',
        interests: ['System Design', 'Urban Planning'],
        expertise: ['Engineering Management', 'Payments']
      },
      {
        name: 'David Kim',
        role: 'Angel Investor',
        company: 'Self-employed',
        location: 'Austin, TX',
        email: 'dkim@angel.co',
        warmthScore: 25,
        priorityScore: 60,
        lastInteraction: new Date('2024-06-20'),
        tags: ['Angel', 'Consumer', 'Austin'],
        notes: 'Invests in consumer social. Has been quiet recently.',
        category: 'Investor',
        industry: 'Venture Capital',
        interests: ['Consumer Social', 'BBQ'],
        expertise: ['Angel Investing', 'Growth Marketing']
      },
      {
        name: 'Elena Rodriguez',
        role: 'Product Lead',
        company: 'Notion',
        location: 'San Francisco, CA',
        email: 'elena@notion.so',
        warmthScore: 60,
        priorityScore: 75,
        lastInteraction: new Date('2024-10-01'),
        tags: ['Product', 'SaaS', 'SF'],
        notes: 'Great product thinker. Potential advisor.',
        category: 'Advisor',
        industry: 'Technology',
        interests: ['Productivity Tools', 'Design'],
        expertise: ['Product Strategy', 'PLG']
      },
    ];

    const createdContacts = await Promise.all(
      mockContacts.map(c => this.createContact(c))
    );

    const mockNudges: InsertNudge[] = [
      {
        contactId: createdContacts[1].id, // Alex Chen
        type: 'decay',
        message: 'It’s been 60 days since you last spoke with Alex. Keep warm?',
        priority: 'high',
        date: new Date('2024-11-19'),
        status: 'pending'
      },
      {
        contactId: createdContacts[3].id, // David Kim
        type: 'location',
        message: 'You’re visiting Austin next week. Grab coffee with David?',
        priority: 'medium',
        date: new Date('2024-11-18'),
        status: 'pending'
      },
      {
        contactId: createdContacts[0].id, // Maya Patel
        type: 'milestone',
        message: 'Maya just raised a new round. Send congratulations?',
        priority: 'medium',
        date: new Date('2024-11-17'),
        status: 'pending'
      },
    ];

    await Promise.all(
      mockNudges.map(n => this.createNudge(n))
    );
  }
}

export const storage = new DatabaseStorage();
