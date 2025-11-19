import { contacts, nudges, type Contact, type InsertContact, type Nudge, type InsertNudge } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<void>;
  searchContacts(query: string): Promise<Contact[]>;

  // Nudges
  getNudges(): Promise<Nudge[]>;
  createNudge(nudge: InsertNudge): Promise<Nudge>;
  updateNudgeStatus(id: number, status: string): Promise<Nudge | undefined>;
  
  // Seed data helper
  seed(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.warmthScore));
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

  async searchContacts(query: string): Promise<Contact[]> {
    // Basic search implementation - in a real app this would be vector search or full text search
    const allContacts = await this.getContacts();
    const lowerQuery = query.toLowerCase();
    return allContacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.role.toLowerCase().includes(lowerQuery) ||
      c.company.toLowerCase().includes(lowerQuery) ||
      c.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  async getNudges(): Promise<Nudge[]> {
    return await db.select().from(nudges).orderBy(desc(nudges.priority), desc(nudges.date));
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
        lastInteraction: new Date('2024-11-10'),
        tags: ['HealthTech', 'Founder', 'SF'],
        notes: 'Met at TechCrunch Disrupt. Interested in Series A intros.',
      },
      {
        name: 'Alex Chen',
        role: 'Partner',
        company: 'Greylock',
        location: 'Menlo Park, CA',
        email: 'achen@greylock.com',
        warmthScore: 42,
        lastInteraction: new Date('2024-09-15'),
        nextFollowUp: new Date('2024-11-20'),
        tags: ['VC', 'Series A', 'AI'],
        notes: 'Key contact for AI infra deals. Loves hiking.',
      },
      {
        name: 'Sarah Jenkins',
        role: 'VP of Engineering',
        company: 'Stripe',
        location: 'New York, NY',
        email: 'sarah.j@stripe.com',
        warmthScore: 92,
        lastInteraction: new Date('2024-11-15'),
        tags: ['Fintech', 'Engineering', 'Operator'],
        notes: 'Former colleague. Good for technical due diligence.',
      },
      {
        name: 'David Kim',
        role: 'Angel Investor',
        company: 'Self-employed',
        location: 'Austin, TX',
        email: 'dkim@angel.co',
        warmthScore: 25,
        lastInteraction: new Date('2024-06-20'),
        tags: ['Angel', 'Consumer', 'Austin'],
        notes: 'Invests in consumer social. Has been quiet recently.',
      },
      {
        name: 'Elena Rodriguez',
        role: 'Product Lead',
        company: 'Notion',
        location: 'San Francisco, CA',
        email: 'elena@notion.so',
        warmthScore: 60,
        lastInteraction: new Date('2024-10-01'),
        tags: ['Product', 'SaaS', 'SF'],
        notes: 'Great product thinker. Potential advisor.',
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
