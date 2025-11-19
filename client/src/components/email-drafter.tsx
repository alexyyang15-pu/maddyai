import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wand2, 
  Copy, 
  Send, 
  RefreshCw, 
  Check,
  Sparkles
} from "lucide-react";
import { Contact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmailDrafterProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  type: 'follow-up' | 'intro' | 'congrats' | 'reconnect';
  context?: string; // Extra context like "met at event" or "saw article"
}

export function EmailDrafter({ isOpen, onClose, contact, type, context }: EmailDrafterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  // Mock AI Generation Logic
  const generateDraft = async () => {
    setIsGenerating(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let generatedSubject = "";
    let generatedBody = "";

    const firstName = contact.name.split(' ')[0];

    switch (type) {
      case 'follow-up':
        generatedSubject = `Great seeing you / follow up`;
        generatedBody = `Hi ${firstName},

It was great catching up recently. I really enjoyed our conversation about ${contact.interests?.[0] || 'the industry'}.

I wanted to follow up on...

Let's grab coffee soon when things settle down.

Best,
[Your Name]`;
        break;
      case 'reconnect':
        generatedSubject = `Thinking of you / checking in`;
        generatedBody = `Hi ${firstName},

It's been a while! I was just reading about ${contact.company}'s latest updates and thought of you.

Hope you're doing well. Would love to hear what you're working on these days.

Best,
[Your Name]`;
        break;
      case 'congrats':
        generatedSubject = `Congrats on the news!`;
        generatedBody = `Hi ${firstName},

Huge congratulations on the recent news! I saw the update and am so happy for you and the team at ${contact.company}.

Well deserved.

Best,
[Your Name]`;
        break;
      case 'intro':
        generatedSubject = `Intro: ${firstName} <> [Name]`;
        generatedBody = `Hi ${firstName},

I wanted to introduce you to [Name], who is building [Company].

I think you two would really hit it off given your shared interest in ${contact.interests?.[0] || 'tech'}.

I'll let you take it from here.

Best,
[Your Name]`;
        break;
    }

    setSubject(generatedSubject);
    setBody(generatedBody);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateDraft();
    } else {
      setSubject("");
      setBody("");
    }
  }, [isOpen, type, contact]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setHasCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSend = () => {
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Email Drafter
          </DialogTitle>
          <DialogDescription>
            Drafting a <strong>{type}</strong> email to <strong>{contact.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isGenerating ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="animate-pulse">Analyzing relationship context...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  className="min-h-[200px] font-sans text-base leading-relaxed resize-none"
                />
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button variant="ghost" onClick={generateDraft} disabled={isGenerating}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
            Regenerate
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} disabled={isGenerating}>
              {hasCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy
            </Button>
            <Button onClick={handleSend} disabled={isGenerating} className="bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4 mr-2" />
              Open in Mail
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
