import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GmailService } from "./services/gmail";
import { ClusteringService } from "./services/clustering";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/url", async (req, res) => {
    try {
      const authUrl = GmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      const tokens = await GmailService.getTokens(code);
      const userInfo = await GmailService.getUserInfo(tokens.access_token!);

      let user = await storage.getUserByEmail(userInfo.email!);
      if (!user) {
        user = await storage.createUser({ email: userInfo.email! });
      }

      await storage.updateUser(user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });

      res.json({ user, tokens });
    } catch (error) {
      console.error("Error in auth callback:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email routes
  app.post("/api/emails/sync/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user || !user.accessToken) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const gmailService = new GmailService(user.accessToken);
      const gmailEmails = await gmailService.getRecentEmails(200);

      // Clear existing emails and clusters
      await storage.deleteEmailsByUserId(userId);
      await storage.deleteClustersByUserId(userId);

      // Store emails
      const storedEmails = [];
      for (const gmailEmail of gmailEmails) {
        const email = await storage.createEmail({
          userId,
          gmailId: gmailEmail.id,
          subject: gmailEmail.subject,
          sender: gmailEmail.sender,
          snippet: gmailEmail.snippet,
          timestamp: gmailEmail.timestamp,
          isArchived: false,
          clusterId: null,
          rawData: gmailEmail.rawData,
        });
        storedEmails.push(email);
      }

      // Cluster emails
      const clusterMap = ClusteringService.clusterEmails(storedEmails);
      const clusters = [];

      for (const [template, emails] of clusterMap.entries()) {
        if (emails.length > 0) {
          const cluster = await storage.createCluster({
            userId,
            name: template.name,
            description: template.description,
            color: template.color,
            emailCount: emails.length,
          });

          // Update emails with cluster ID
          for (const email of emails) {
            await storage.updateEmail(email.id, { clusterId: cluster.id });
          }

          clusters.push(cluster);
        }
      }

      res.json({ 
        emailCount: storedEmails.length, 
        clusterCount: clusters.length,
        clusters 
      });
    } catch (error) {
      console.error("Error syncing emails:", error);
      res.status(500).json({ message: "Failed to sync emails" });
    }
  });

  app.get("/api/clusters/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const clusters = await storage.getClustersByUserId(userId);
      
      const clustersWithEmails = [];
      for (const cluster of clusters) {
        const emails = await storage.getEmailsByClusterId(cluster.id);
        clustersWithEmails.push({
          ...cluster,
          emails: emails.filter(email => !email.isArchived).slice(0, 3), // Only show first 3 unarchived
        });
      }

      res.json(clustersWithEmails);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      res.status(500).json({ message: "Failed to fetch clusters" });
    }
  });

  app.post("/api/clusters/:clusterId/archive", async (req, res) => {
    try {
      const { clusterId } = req.params;
      const cluster = await storage.getClusterWithEmails(clusterId);
      
      if (!cluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }

      const user = await storage.getUser(cluster.userId);
      if (!user || !user.accessToken) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Archive emails in Gmail
      const gmailService = new GmailService(user.accessToken);
      const gmailIds = cluster.emails
        .filter(email => !email.isArchived)
        .map(email => email.gmailId);
      
      if (gmailIds.length > 0) {
        await gmailService.archiveEmails(gmailIds);
      }

      // Update local storage
      await storage.archiveEmailsByClusterId(clusterId);

      res.json({ message: "Cluster archived successfully", archivedCount: gmailIds.length });
    } catch (error) {
      console.error("Error archiving cluster:", error);
      res.status(500).json({ message: "Failed to archive cluster" });
    }
  });

  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const emails = await storage.getEmailsByUserId(userId);
      const clusters = await storage.getClustersByUserId(userId);
      const activeEmails = emails.filter(email => !email.isArchived);

      res.json({
        totalEmails: activeEmails.length,
        clusterCount: clusters.length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
