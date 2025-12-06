import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem, Category } from "@shared/schema";

// API helper functions
async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export async function login(username: string, password: string) {
  return fetchAPI("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return fetchAPI("/api/logout", { method: "POST" });
}

export async function checkSession() {
  return fetchAPI("/api/session");
}

// Items API
async function getItems(): Promise<InventoryItem[]> {
  return fetchAPI("/api/items");
}

async function createItem(item: Omit<InventoryItem, "id">) {
  return fetchAPI("/api/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

async function updateItem(id: string, updates: Partial<Omit<InventoryItem, "id">>) {
  return fetchAPI(`/api/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

async function deleteItem(id: string) {
  return fetchAPI(`/api/items/${id}`, { method: "DELETE" });
}

// Categories API
async function getCategories(): Promise<Category[]> {
  return fetchAPI("/api/categories");
}

async function createCategory(name: string) {
  return fetchAPI("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

async function deleteCategory(id: string) {
  return fetchAPI(`/api/categories/${id}`, { method: "DELETE" });
}

// Credentials API
async function updateCredentials(username: string, password: string) {
  return fetchAPI("/api/credentials", {
    method: "PATCH",
    body: JSON.stringify({ username, password }),
  });
}

// Auth hook
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: checkSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  return {
    isAuthenticated: session?.isAuthenticated || false,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Inventory hook
export function useInventory() {
  const queryClient = useQueryClient();

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Convert categories to string array for compatibility
  const categories = categoriesData.map((c) => c.name).sort();

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<InventoryItem, "id">> }) =>
      updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Update credentials mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      updateCredentials(username, password),
  });

  return {
    items,
    addItem: (item: Omit<InventoryItem, "id">) => addItemMutation.mutateAsync(item),
    updateItem: (id: string, updates: Partial<InventoryItem>) =>
      updateItemMutation.mutateAsync({ id, updates }),
    deleteItem: (id: string) => deleteItemMutation.mutateAsync(id),
    categories,
    addCategory: (category: string) => addCategoryMutation.mutateAsync(category),
    removeCategory: (categoryName: string) => {
      // Find category by name and delete by id
      const categoryToDelete = categoriesData.find((c) => c.name === categoryName);
      if (categoryToDelete) {
        return deleteCategoryMutation.mutateAsync(categoryToDelete.id);
      }
    },
    credentials: { username: "", password: "" }, // Not used in current implementation
    updateCredentials: (newCreds: { username: string; password: string }) =>
      updateCredentialsMutation.mutateAsync(newCreds),
  };
}
