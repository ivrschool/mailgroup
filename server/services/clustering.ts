import { type Email } from "@shared/schema";

export interface ClusterTemplate {
  name: string;
  description: string;
  color: string;
  keywords: string[];
  senderPatterns: string[];
}

const clusterTemplates: ClusterTemplate[] = [
  {
    name: "Work Communications",
    description: "Project updates, meeting invites, and team communications from colleagues and stakeholders.",
    color: "blue-500",
    keywords: ["meeting", "project", "deadline", "standup", "review", "team", "work", "office", "schedule", "conference"],
    senderPatterns: ["@company", ".com", "noreply", "team", "hr", "admin"]
  },
  {
    name: "Newsletters & Updates",
    description: "Industry newsletters, product updates, and promotional content from various subscriptions.",
    color: "green-500",
    keywords: ["newsletter", "update", "news", "announcement", "feature", "release", "blog", "article", "digest"],
    senderPatterns: ["newsletter", "news", "updates", "marketing", "blog"]
  },
  {
    name: "Financial & Bills",
    description: "Bank statements, credit card bills, invoices, and financial notifications requiring attention.",
    color: "orange-500",
    keywords: ["payment", "invoice", "bill", "statement", "due", "account", "transaction", "balance", "charge", "receipt"],
    senderPatterns: ["bank", "card", "payment", "billing", "invoice", "finance", "stripe", "paypal"]
  },
  {
    name: "Social & Personal",
    description: "Personal messages, social media notifications, and communications from friends and family.",
    color: "purple-500",
    keywords: ["like", "comment", "follow", "connection", "friend", "family", "personal", "social"],
    senderPatterns: ["facebook", "twitter", "linkedin", "instagram", "social", "personal"]
  },
  {
    name: "Shopping & Services",
    description: "Order confirmations, shipping notifications, and service-related communications from various providers.",
    color: "pink-500",
    keywords: ["order", "shipping", "delivery", "shipped", "confirmed", "receipt", "purchase", "tracking"],
    senderPatterns: ["amazon", "ebay", "shop", "store", "order", "shipping", "delivery", "uber", "lyft"]
  }
];

export class ClusteringService {
  static clusterEmails(emails: Email[]): Map<ClusterTemplate, Email[]> {
    const clusters = new Map<ClusterTemplate, Email[]>();
    
    // Initialize clusters
    clusterTemplates.forEach(template => {
      clusters.set(template, []);
    });

    emails.forEach(email => {
      let bestMatch: ClusterTemplate | null = null;
      let bestScore = 0;

      clusterTemplates.forEach(template => {
        const score = this.calculateClusterScore(email, template);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = template;
        }
      });

      if (bestMatch && bestScore > 0) {
        clusters.get(bestMatch)!.push(email);
      } else {
        // Default to first cluster if no match
        clusters.get(clusterTemplates[0])!.push(email);
      }
    });

    return clusters;
  }

  private static calculateClusterScore(email: Email, template: ClusterTemplate): number {
    let score = 0;
    const emailText = `${email.subject} ${email.snippet} ${email.sender}`.toLowerCase();

    // Check keywords
    template.keywords.forEach(keyword => {
      if (emailText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });

    // Check sender patterns
    template.senderPatterns.forEach(pattern => {
      if (email.sender?.toLowerCase().includes(pattern.toLowerCase())) {
        score += 3;
      }
    });

    return score;
  }

  static getClusterTemplates(): ClusterTemplate[] {
    return clusterTemplates;
  }
}
