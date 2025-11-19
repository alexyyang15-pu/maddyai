import React from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Globe, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      {/* Navigation */}
      <header className="border-b border-border/40 sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-full" />
            <span className="font-serif text-xl font-bold tracking-tight">Maddy AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Product</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Manifesto</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden md:inline-flex font-medium text-muted-foreground hover:text-foreground hover:bg-transparent">
                Log in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                Get Early Access
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4 relative overflow-hidden">
          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                Now accepting founding members
              </div>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.1] mb-8 text-foreground">
                Turn your network into <br />
                <span className="italic text-primary">your greatest advantage.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                Your relationship copilot to unlock opportunities hiding in plain sight. 
                Centralize contacts, track warmth, and never miss a follow-up.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="relative w-full max-w-md">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full h-14 pl-6 pr-36 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Button className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6">
                    Join Waitlist
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">or</span>
                <Link href="/dashboard">
                  <Button variant="outline" className="h-14 rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5">
                    View Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Abstract decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-secondary/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: Users,
                  title: "Unified Intelligence",
                  desc: "Consolidate contacts from Gmail, LinkedIn, and Calendar into one enriched, deduplicated system."
                },
                {
                  icon: Zap,
                  title: "Proactive Nudges",
                  desc: "Get warm reminders to reconnect when relationships go cold or when you're in the same city."
                },
                {
                  icon: Globe,
                  title: "Natural Search",
                  desc: "Query your network like a human. 'Who do I know in SF who invests in HealthTech?'"
                }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl bg-[#FAF9F6] border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Social Proof / Bottom CTA */}
        <section className="py-24 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8">Stop losing touch.</h2>
            <Link href="/dashboard">
               <Button size="lg" className="rounded-full text-lg px-10 h-16">
                 Start using Maddy AI
               </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border bg-[#FAF9F6]">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© 2024 Maddy AI Inc.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
