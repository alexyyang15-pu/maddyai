import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertNudgeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed mock data on startup
  await storage.seed();

  // Stats API
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    const query = req.query.q as string;
    const category = req.query.category as string;
    const industry = req.query.industry as string;

    if (query || category || industry) {
      const results = await storage.getContacts({ query, category, industry });
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

  app.post("/api/contacts/bulk", async (req, res) => {
    try {
      const contacts = req.body;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ message: "Request body must be an array of contacts" });
      }

      const result = await storage.createContactsBulk(contacts);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // New LinkedIn ZIP import endpoint
  app.post("/api/linkedin/import-zip", async (req, res) => {
    try {
      // Expect base64 encoded ZIP file in request body
      const { zipData } = req.body;

      if (!zipData) {
        return res.status(400).json({ message: "No ZIP data provided" });
      }

      // Import parser and matcher
      const { extractZipFiles, parseProfile, parsePositions, parseConnections } = await import("./linkedin-parser");
      const { addSmartTagsToContacts } = await import("./matcher");

      // Decode base64 and extract files
      const buffer = Buffer.from(zipData, 'base64');
      const files = extractZipFiles(buffer);

      let profileData: any = {};
      let contactsToImport: any[] = [];

      // Parse Profile.csv if available
      if (files.profile) {
        profileData = parseProfile(files.profile);
      }

      // Parse Positions.csv if available
      if (files.positions) {
        const positionsData = parsePositions(files.positions);
        profileData = { ...profileData, ...positionsData };
      }

      // Save or update user profile
      let userProfile;
      if (Object.keys(profileData).length > 0) {
        userProfile = await storage.createOrUpdateUserProfile(profileData);
      }

      // Parse Connections.csv if available
      if (files.connections) {
        contactsToImport = parseConnections(files.connections);

        // Apply smart matching if we have a user profile
        if (userProfile) {
          contactsToImport = addSmartTagsToContacts(userProfile, contactsToImport);
        }
      }

      // Import contacts
      const importResult = contactsToImport.length > 0
        ? await storage.createContactsBulk(contactsToImport)
        : { created: 0, skipped: 0, failed: 0, skippedEmails: [] };

      res.status(201).json({
        ...importResult,
        profileCreated: !!userProfile,
        filesProcessed: {
          profile: !!files.profile,
          positions: !!files.positions,
          connections: !!files.connections,
        },
      });
    } catch (error: any) {
      console.error("LinkedIn ZIP import error:", error);
      res.status(500).json({
        message: "Failed to process LinkedIn ZIP file",
        error: error.message
      });
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
