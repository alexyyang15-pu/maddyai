import React, { useState } from "react";
import { 
  Search, 
  Bell, 
  MapPin, 
  Calendar, 
  Mail, 
  MoreHorizontal, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  Clock,
  Briefcase,
  UserPlus,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_CONTACTS, MOCK_NUDGES, RECENT_SEARCHES } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);
  };

  const getWarmthColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-400";
  };

  const filteredContacts = MOCK_CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/60 bg-[#FAF9F6] hidden lg:flex flex-col fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-primary rounded-md" />
            <span className="font-serif text-lg font-bold">Maddy AI</span>
          </div>
          
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start font-medium bg-secondary/50 text-secondary-foreground">
              <Sparkles className="mr-2 w-4 h-4" /> Home
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <Users className="mr-2 w-4 h-4" /> Contacts
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <Briefcase className="mr-2 w-4 h-4" /> Lists
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <Calendar className="mr-2 w-4 h-4" /> Events
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <MapPin className="mr-2 w-4 h-4" /> Travel
            </Button>
          </div>

          <div className="mt-8">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent Searches</h4>
            <div className="space-y-1">
              {RECENT_SEARCHES.slice(0, 3).map((search, i) => (
                <button key={i} className="text-sm text-muted-foreground hover:text-foreground block px-2 py-1.5 truncate w-full text-left rounded-md hover:bg-black/5 transition-colors">
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6 border-t border-border/60">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Jane Doe</p>
              <p className="text-xs text-muted-foreground truncate">Super Connector</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="h-16 border-b border-border/60 bg-[#FAF9F6]/80 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="lg:hidden font-serif font-bold">Maddy AI</div>
          
          <div className="flex-1 max-w-2xl mx-auto relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Ask Maddy: 'Who do I know in NYC working on Fintech?'" 
              className="w-full pl-10 bg-white border-border/60 focus-visible:ring-primary/20 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <UserPlus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10">
          
          {/* Nudges Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-medium text-foreground">Morning Nudges</h2>
              <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {MOCK_NUDGES.map((nudge) => {
                const contact = MOCK_CONTACTS.find(c => c.id === nudge.contactId);
                if (!contact) return null;
                
                return (
                  <motion.div
                    key={nudge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className="h-full border-border/60 shadow-sm hover:shadow-md transition-all bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border/50">
                              <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base font-medium">{contact.name}</CardTitle>
                              <CardDescription className="text-xs">{contact.role} @ {contact.company}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase tracking-wide font-semibold",
                            nudge.priority === 'high' ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"
                          )}>
                            {nudge.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {nudge.message}
                        </p>
                        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline" className="w-full text-xs h-8">Dismiss</Button>
                          <Button size="sm" className="w-full text-xs h-8 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Action</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Main Content Tabs */}
          <Tabs defaultValue="network" className="space-y-6">
            <TabsList className="bg-transparent border-b border-border/60 w-full justify-start h-auto p-0 rounded-none space-x-6">
              <TabsTrigger 
                value="network" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 py-3 font-serif text-lg text-muted-foreground"
              >
                Your Network
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 py-3 font-serif text-lg text-muted-foreground"
              >
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="m-0">
              <Card className="border-border/60 shadow-sm bg-white">
                <div className="p-4 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      <Filter className="w-3 h-3" /> Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      Sort by: <span className="font-medium text-foreground">Warmth</span>
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">{filteredContacts.length} contacts found</span>
                </div>
                
                <div className="divide-y divide-border/40">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border border-border">
                            <AvatarFallback className="text-sm bg-muted text-muted-foreground">{getInitials(contact.name)}</AvatarFallback>
                          </Avatar>
                          <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white", getWarmthColor(contact.warmthScore))} />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            {contact.name}
                            <span className="text-xs font-normal text-muted-foreground">• {contact.location}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">{contact.role} at <span className="text-foreground/80">{contact.company}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                          <p className="text-xs text-muted-foreground">Last spoken</p>
                          <p className="text-sm font-medium">{contact.lastInteraction}</p>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="insights">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-secondary/30 border-none">
                  <CardHeader>
                    <CardTitle className="font-serif">Network Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      [Chart Placeholder]
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
