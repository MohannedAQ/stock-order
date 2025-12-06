import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertInventoryItemSchema, insertCategorySchema } from "@shared/schema";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const credentials = await storage.getCredentials();
      
      if (!credentials) {
        return res.status(500).json({ message: "No credentials configured" });
      }
      
      const isValid = await bcrypt.compare(password, credentials.password);
      
      if (credentials.username === username && isValid) {
        req.session.isAuthenticated = true;
        return res.json({ success: true });
      }
      
      return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  
  app.get("/api/session", (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAuthenticated });
  });
  
  // Inventory item routes
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error("Get items error:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  
  app.post("/api/items", requireAuth, async (req, res) => {
    try {
      const data = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createItem(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      console.error("Create item error:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });
  
  app.patch("/api/items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(id, data);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      console.error("Update item error:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  
  app.delete("/api/items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete item error:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });
  
  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categoriesList = await storage.getCategories();
      res.json(categoriesList);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Manager credentials route
  app.patch("/api/credentials", requireAuth, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const credentials = await storage.updateCredentials({
        username,
        password: hashedPassword
      });
      
      res.json({ success: true, username: credentials.username });
    } catch (error) {
      console.error("Update credentials error:", error);
      res.status(500).json({ message: "Failed to update credentials" });
    }
  });

  return httpServer;
}
