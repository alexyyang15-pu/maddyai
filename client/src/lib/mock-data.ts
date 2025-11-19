export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar?: string;
  warmthScore: number; // 0-100
  lastInteraction: string;
  nextFollowUp?: string;
  tags: string[];
  notes: string;
  email: string;
}

export interface Nudge {
  id: string;
  contactId: string;
  type: 'decay' | 'milestone' | 'location' | 'intro';
  message: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Maya Patel',
    role: 'Founder & CEO',
    company: 'Lumina Health',
    location: 'San Francisco, CA',
    email: 'maya@lumina.health',
    warmthScore: 85,
    lastInteraction: '2024-11-10',
    tags: ['HealthTech', 'Founder', 'SF'],
    notes: 'Met at TechCrunch Disrupt. Interested in Series A intros.',
  },
  {
    id: '2',
    name: 'Alex Chen',
    role: 'Partner',
    company: 'Greylock',
    location: 'Menlo Park, CA',
    email: 'achen@greylock.com',
    warmthScore: 42,
    lastInteraction: '2024-09-15',
    nextFollowUp: '2024-11-20',
    tags: ['VC', 'Series A', 'AI'],
    notes: 'Key contact for AI infra deals. Loves hiking.',
  },
  {
    id: '3',
    name: 'Sarah Jenkins',
    role: 'VP of Engineering',
    company: 'Stripe',
    location: 'New York, NY',
    email: 'sarah.j@stripe.com',
    warmthScore: 92,
    lastInteraction: '2024-11-15',
    tags: ['Fintech', 'Engineering', 'Operator'],
    notes: 'Former colleague. Good for technical due diligence.',
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Angel Investor',
    company: 'Self-employed',
    location: 'Austin, TX',
    email: 'dkim@angel.co',
    warmthScore: 25,
    lastInteraction: '2024-06-20',
    tags: ['Angel', 'Consumer', 'Austin'],
    notes: 'Invests in consumer social. Has been quiet recently.',
  },
  {
    id: '5',
    name: 'Elena Rodriguez',
    role: 'Product Lead',
    company: 'Notion',
    location: 'San Francisco, CA',
    email: 'elena@notion.so',
    warmthScore: 60,
    lastInteraction: '2024-10-01',
    tags: ['Product', 'SaaS', 'SF'],
    notes: 'Great product thinker. Potential advisor.',
  },
];

export const MOCK_NUDGES: Nudge[] = [
  {
    id: '1',
    contactId: '2', // Alex Chen
    type: 'decay',
    message: 'It’s been 60 days since you last spoke with Alex. Keep warm?',
    priority: 'high',
    date: '2024-11-19',
  },
  {
    id: '2',
    contactId: '4', // David Kim
    type: 'location',
    message: 'You’re visiting Austin next week. Grab coffee with David?',
    priority: 'medium',
    date: '2024-11-18',
  },
  {
    id: '3',
    contactId: '1', // Maya Patel
    type: 'milestone',
    message: 'Maya just raised a new round. Send congratulations?',
    priority: 'medium',
    date: '2024-11-17',
  },
];

export const RECENT_SEARCHES = [
  "Healthtech founders in SF",
  "Investors interested in AI agents",
  "Design leaders in NYC",
  "Who did I meet at Consensus?",
];
