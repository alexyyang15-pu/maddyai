import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertNudgeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed mock data on startup
  await storage.seed();

  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    const query = req.query.q as string;
    if (query) {
      const results = await storage.searchContacts(query);
      res.json(results);
    } else {
      const contacts = await storage.getContacts();
      res.json(contacts);
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const contact = await storage.getContact(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(contact);
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = insertContactSchema.parse(req.body);
      const created = await storage.createContact(contact);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    try {
      const updateData = insertContactSchema.partial().parse(req.body);
      const updated = await storage.updateContact(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    await storage.deleteContact(id);
    res.status(204).send();
  });

  // Nudges API
  app.get("/api/nudges", async (req, res) => {
    const nudges = await storage.getNudges();
    res.json(nudges);
  });

  app.post("/api/nudges", async (req, res) => {
    try {
      const nudge = insertNudgeSchema.parse(req.body);
      const created = await storage.createNudge(nudge);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid nudge data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/nudges/:id/status", async (req, res) => {
    const id = parseInt(req.params.id);
    const status = req.body.status;
    
    if (isNaN(id) || !status) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const updated = await storage.updateNudgeStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: "Nudge not found" });
    }
    res.json(updated);
  });

  const httpServer = createServer(app);
  return httpServer;
}
