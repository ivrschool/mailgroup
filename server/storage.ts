import { type User, type InsertUser, type Email, type InsertEmail, type Cluster, type InsertCluster, type EmailWithCluster, type ClusterWithEmails } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Email methods
  getEmailsByUserId(userId: string): Promise<Email[]>;
  getEmailsByClusterId(clusterId: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, updates: Partial<Email>): Promise<Email | undefined>;
  deleteEmailsByUserId(userId: string): Promise<void>;
  archiveEmailsByClusterId(clusterId: string): Promise<void>;

  // Cluster methods
  getClustersByUserId(userId: string): Promise<Cluster[]>;
  getClusterWithEmails(clusterId: string): Promise<ClusterWithEmails | undefined>;
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  updateCluster(id: string, updates: Partial<Cluster>): Promise<Cluster | undefined>;
  deleteClustersByUserId(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emails: Map<string, Email>;
  private clusters: Map<string, Cluster>;

  constructor() {
    this.users = new Map();
    this.emails = new Map();
    this.clusters = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getEmailsByUserId(userId: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(email => email.userId === userId);
  }

  async getEmailsByClusterId(clusterId: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(email => email.clusterId === clusterId);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = randomUUID();
    const email: Email = {
      ...insertEmail,
      id,
      createdAt: new Date(),
    };
    this.emails.set(id, email);
    return email;
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;
    
    const updatedEmail = { ...email, ...updates };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async deleteEmailsByUserId(userId: string): Promise<void> {
    for (const [id, email] of this.emails.entries()) {
      if (email.userId === userId) {
        this.emails.delete(id);
      }
    }
  }

  async archiveEmailsByClusterId(clusterId: string): Promise<void> {
    for (const [id, email] of this.emails.entries()) {
      if (email.clusterId === clusterId) {
        this.emails.set(id, { ...email, isArchived: true });
      }
    }
  }

  async getClustersByUserId(userId: string): Promise<Cluster[]> {
    return Array.from(this.clusters.values()).filter(cluster => cluster.userId === userId);
  }

  async getClusterWithEmails(clusterId: string): Promise<ClusterWithEmails | undefined> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return undefined;

    const emails = await this.getEmailsByClusterId(clusterId);
    return { ...cluster, emails };
  }

  async createCluster(insertCluster: InsertCluster): Promise<Cluster> {
    const id = randomUUID();
    const cluster: Cluster = {
      ...insertCluster,
      id,
      createdAt: new Date(),
    };
    this.clusters.set(id, cluster);
    return cluster;
  }

  async updateCluster(id: string, updates: Partial<Cluster>): Promise<Cluster | undefined> {
    const cluster = this.clusters.get(id);
    if (!cluster) return undefined;
    
    const updatedCluster = { ...cluster, ...updates };
    this.clusters.set(id, updatedCluster);
    return updatedCluster;
  }

  async deleteClustersByUserId(userId: string): Promise<void> {
    for (const [id, cluster] of this.clusters.entries()) {
      if (cluster.userId === userId) {
        this.clusters.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
