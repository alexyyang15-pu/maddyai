import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Mail, 
  Calendar, 
  Star, 
  Flame, 
  Share2, 
  MessageSquare, 
  MoreHorizontal, 
  Shield, 
  Zap, 
  Brain,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmailDrafter } from "@/components/email-drafter";

// Mock history data for warmth trend
const MOCK_HISTORY = [
  { day: '1', score: 65 },
  { day: '5', score: 68 },
  { day: '10', score: 72 },
  { day: '15', score: 70 },
  { day: '20', score: 85 }, // Interaction happened
  { day: '25', score: 82 },
  { day: '30', score: 80 },
];

export default function ContactProfile() {
  const [match, params] = useRoute("/contacts/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : undefined;
  const [drafterOpen, setDrafterOpen] = useState(false);
  const [draftType, setDraftType] = useState<'follow-up' | 'intro' | 'congrats' | 'reconnect'>('follow-up');

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: [`/api/contacts/${id}`],
    queryFn: () => fetch(`/api/contacts/${id}`).then(res => {
      if (!res.ok) throw new Error("Failed to fetch contact");
      return res.json();
    }),
    enabled: !!id
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">Loading...</div>;
  if (!contact) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">Contact not found</div>;

  const openDrafter = (type: 'follow-up' | 'intro' | 'congrats' | 'reconnect') => {
    setDraftType(type);
    setDrafterOpen(true);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2);

  const getWarmthColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <EmailDrafter 
        isOpen={drafterOpen} 
        onClose={() => setDrafterOpen(false)} 
        contact={contact} 
        type={draftType} 
      />

      {/* Header */}
      <header className="h-16 border-b border-border/60 bg-[#FAF9F6]/80 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-medium text-foreground">Back to Dashboard</span>
      </header>

      <main className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-border/60 shadow-sm bg-white overflow-hidden">
            {/* Cover Image (Abstract) */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/30" />
            
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row items-start justify-between relative">
                {/* Avatar & Info */}
                <div className="flex flex-col md:flex-row gap-6 items-start -mt-12 mb-6 md:mb-0">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md text-4xl">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-serif">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-white shadow-sm", getWarmthColor(contact.warmthScore))}>
                      <Flame className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                  
                  <div className="pt-14 md:pt-12">
                    <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
                      {contact.name}
                      {contact.priorityScore > 80 && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                    </h1>
                    <div className="text-lg text-muted-foreground mt-1 mb-3">
                      {contact.role} at <span className="text-foreground font-medium">{contact.company}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {contact.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> Last: {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : 'Never'}
                      </div>
                      {contact.industry && (
                        <Badge variant="secondary" className="bg-secondary/50 font-normal">
                          {contact.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 md:mt-12">
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="w-4 h-4" /> Log Interaction
                  </Button>
                  <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => openDrafter('follow-up')}>
                    <Mail className="w-4 h-4" /> Draft Email
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Enrichment & Stats */}
          <div className="md:col-span-2 space-y-8">
            
            {/* AI Enrichment Panel */}
            <Card className="bg-secondary/10 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-border/40">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Reliability Score
                    </div>
                    <div className="text-2xl font-medium">High (92%)</div>
                    <Progress value={92} className="h-1.5 mt-2" />
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-border/40">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Influence
                    </div>
                    <div className="text-2xl font-medium">Very High</div>
                    <Progress value={88} className="h-1.5 mt-2" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Key Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {contact.expertise?.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-white border-primary/20 text-primary/80">
                        <Sparkles className="w-3 h-3 mr-1" /> {skill}
                      </Badge>
                    ))}
                    {(!contact.expertise || contact.expertise.length === 0) && (
                      <span className="text-sm text-muted-foreground italic">No expertise tags yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Communication Style</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Usually concise and direct. Prefers email over calls for initial outreach. 
                    Responds best to clear value propositions and data-backed asks.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Warmth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Warmth Trend (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_HISTORY}>
                      <XAxis dataKey="day" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Introductions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5" /> Suggested Intros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>SJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">Sarah Jenkins</div>
                          <div className="text-xs text-muted-foreground">VP Engineering @ Stripe</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => openDrafter('intro')}>Draft Intro</Button>
                   </div>
                   <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>DK</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">David Kim</div>
                          <div className="text-xs text-muted-foreground">Angel Investor</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => openDrafter('intro')}>Draft Intro</Button>
                   </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Suggested Actions */}
          <div className="space-y-6">
            <Card className="bg-[#FFFDF5] border-yellow-100">
              <CardHeader>
                <CardTitle className="font-serif text-lg text-yellow-800">Suggested Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto py-3 bg-white hover:bg-yellow-50 border-yellow-200 text-left block group" onClick={() => openDrafter('reconnect')}>
                  <div className="font-medium text-foreground group-hover:text-yellow-800">Schedule Coffee Chat</div>
                  <div className="text-xs text-muted-foreground mt-0.5">You're both in SF next week.</div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3 bg-white hover:bg-yellow-50 border-yellow-200 text-left block group" onClick={() => openDrafter('congrats')}>
                  <div className="font-medium text-foreground group-hover:text-yellow-800">Share Article</div>
                  <div className="text-xs text-muted-foreground mt-0.5">New piece on AI Agents found.</div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Email</div>
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                </div>
                <div>
                   <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tags</div>
                   <div className="flex flex-wrap gap-2">
                     {contact.tags?.map(tag => (
                       <Badge key={tag} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                     ))}
                   </div>
                </div>
                <div>
                   <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Notes</div>
                   <p className="text-muted-foreground bg-muted/30 p-3 rounded-md text-xs leading-relaxed">
                     {contact.notes}
                   </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
}
