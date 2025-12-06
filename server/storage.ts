import {
  type InventoryItem,
  type InsertInventoryItem,
  type Category,
  type InsertCategory,
  type ManagerCredentials,
  type InsertManagerCredentials,
  inventoryItems,
  categories,
  managerCredentials,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getItems(): Promise<InventoryItem[]>;
  createItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteItem(id: string): Promise<boolean>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  getCredentials(): Promise<ManagerCredentials | undefined>;
  updateCredentials(credentials: InsertManagerCredentials): Promise<ManagerCredentials>;
}

export class DrizzleStorage implements IStorage {
  async getItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async createItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async updateItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db
      .update(inventoryItems)
      .set(item)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCredentials(): Promise<ManagerCredentials | undefined> {
    const [creds] = await db.select().from(managerCredentials).limit(1);
    return creds;
  }

  async updateCredentials(credentials: InsertManagerCredentials): Promise<ManagerCredentials> {
    const existing = await this.getCredentials();
    
    if (existing) {
      const [updated] = await db
        .update(managerCredentials)
        .set(credentials)
        .where(eq(managerCredentials.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(managerCredentials).values(credentials).returning();
      return created;
    }
  }
}

export const storage = new DrizzleStorage();
