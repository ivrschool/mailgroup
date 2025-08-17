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

  // Handle OAuth callback from Google (GET request with code in query params)
  app.get("/api/auth/callback", async (req, res) => {
    try {
      const { code, error } = req.query;
      
      if (error) {
        console.error("OAuth error:", error);
        return res.redirect("/auth?error=" + encodeURIComponent(error as string));
      }
      
      if (!code) {
        return res.redirect("/auth?error=no_code");
      }

      const tokens = await GmailService.getTokens(code as string);
      console.log('Tokens received:', { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date 
      });
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }
      
      const userInfo = await GmailService.getUserInfo(tokens.access_token!);
      console.log('User info retrieved:', { email: userInfo.email, hasEmail: !!userInfo.email });

      let user = await storage.getUserByEmail(userInfo.email!);
      if (!user) {
        user = await storage.createUser({ email: userInfo.email! });
      }

      await storage.updateUser(user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });

      // Redirect to dashboard with user data as URL params (temporary solution)
      const userData = encodeURIComponent(JSON.stringify(user));
      res.redirect(`/auth?success=true&user=${userData}`);
    } catch (error) {
      console.error("Error in auth callback:", error);
      res.redirect("/auth?error=auth_failed");
    }
  });

  // Keep POST endpoint for frontend callback handling
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
      let gmailEmails;
      
      try {
        gmailEmails = await gmailService.getRecentEmails(200);
      } catch (error) {
        if (error.message?.includes('Gmail API has not been used') || error.message?.includes('disabled')) {
          return res.status(403).json({ 
            message: "Gmail API not enabled", 
            details: "Please enable the Gmail API in Google Cloud Console and try again. Click the link in the error to enable it.",
            action: "enable_gmail_api",
            enableUrl: `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${process.env.GOOGLE_CLIENT_ID?.split('-')[0] || '934711419323'}`
          });
        }
        throw error;
      }

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

      for (const [template, emails] of Array.from(clusterMap.entries())) {
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

  // Demo mode - show sample clustered emails
  app.post("/api/emails/demo/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create demo emails
      const demoEmails = [
        // Work emails
        { id: nanoid(), subject: "Q4 Planning Meeting Tomorrow", from: "manager@company.com", snippet: "Please prepare your quarterly reports...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { id: nanoid(), subject: "RE: Project Update", from: "team@company.com", snippet: "Thanks for the update on the new feature...", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) },
        { id: nanoid(), subject: "Sprint Review Notes", from: "scrum@company.com", snippet: "Action items from today's sprint review...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) },
        
        // Newsletter emails  
        { id: nanoid(), subject: "TechCrunch Daily: AI Breakthrough", from: "newsletters@techcrunch.com", snippet: "Today's top tech stories including...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
        { id: nanoid(), subject: "Morning Brew: Market Updates", from: "crew@morningbrew.com", snippet: "Stock futures are up this morning...", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        
        // Financial emails
        { id: nanoid(), subject: "Your Credit Card Statement is Ready", from: "statements@bank.com", snippet: "Your December statement is now available...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16) },
        { id: nanoid(), subject: "Payment Confirmation - $89.99", from: "billing@service.com", snippet: "Thank you for your payment of $89.99...", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20) },
        
        // Social emails
        { id: nanoid(), subject: "John shared a photo with you", from: "notifications@instagram.com", snippet: "John posted a new photo from vacation...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
        { id: nanoid(), subject: "You have 3 new connections", from: "invitations@linkedin.com", snippet: "Connect with professionals in your network...", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10) },
        
        // Shopping emails
        { id: nanoid(), subject: "Your Amazon order has shipped", from: "shipment-tracking@amazon.com", snippet: "Your order #123-4567890 has been shipped...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14) },
        { id: nanoid(), subject: "Flash Sale: 50% Off Everything", from: "deals@retailer.com", snippet: "Limited time offer - save big on your favorites...", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18) }
      ];

      // Clear existing demo data
      await storage.deleteEmailsByUserId(userId);
      
      // Store demo emails
      for (const emailData of demoEmails) {
        await storage.createEmail({
          ...emailData,
          userId,
          clusterId: null,
        });
      }

      // Cluster the demo emails
      const emails = await storage.getEmailsByUserId(userId);
      const clusteringService = new ClusteringService();
      const clusters = await clusteringService.clusterEmails(emails);
      
      // Store clusters and update emails
      for (const clusterData of clusters) {
        const cluster = await storage.createCluster({
          name: clusterData.name,
          description: clusterData.description,
          userId,
        });
        
        for (const email of clusterData.emails) {
          await storage.updateEmail(email.id, { clusterId: cluster.id });
        }
      }

      res.json({ 
        message: "Demo data loaded successfully", 
        emailCount: demoEmails.length,
        clusterCount: clusters.length 
      });
    } catch (error) {
      console.error("Error creating demo data:", error);
      res.status(500).json({ message: "Failed to create demo data" });
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
