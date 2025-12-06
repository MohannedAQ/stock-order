import { useState, useEffect } from "react";
import { useInventory, useAuth } from "@/lib/storage";
import type { InventoryItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, ArrowLeft, Search, Image as ImageIcon, X, LogOut, Settings, Key, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().min(1, "Category is required"),
  image: z.string().optional(),
});

const credentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export default function Manager() {
  const { 
    items, addItem, deleteItem, updateItem, 
    categories, addCategory, removeCategory, 
    updateCredentials 
  } = useInventory();
  
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Check Auth
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
      toast({ title: "Signed out", description: "You have been logged out successfully." });
    } catch (error) {
      toast({ 
        title: "Logout failed", 
        description: "There was an issue logging out.", 
        variant: "destructive" 
      });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      unit: "",
      category: categories[0] || "Produce",
      image: "",
    },
  });

  const credentialsForm = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!editingItem) {
      form.setValue("category", categories[0] || "Produce");
    }
  }, [categories, editingItem, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for localStorage
        toast({ title: "File too large", description: "Please choose an image under 500KB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingItem) {
      updateItem(editingItem.id, values);
      toast({ title: "Item updated", description: `${values.name} has been updated.` });
      setEditingItem(null);
    } else {
      addItem(values);
      toast({ title: "Item added", description: `${values.name} has been added to inventory.` });
    }
    setIsAddOpen(false);
    form.reset({ name: "", unit: "", category: categories[0] || "Produce", image: "" });
  };

  const onCredentialsSubmit = async (values: z.infer<typeof credentialsSchema>) => {
    try {
      await updateCredentials(values);
      toast({ title: "Credentials Updated", description: "Please use new login details next time." });
      credentialsForm.reset({ username: "", password: "" });
    } catch (error) {
      toast({ 
        title: "Update failed", 
        description: error instanceof Error ? error.message : "Failed to update credentials", 
        variant: "destructive" 
      });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory("");
      toast({ title: "Category added", description: `${newCategory} added to list.` });
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      unit: item.unit,
      category: item.category,
      image: item.image || "",
    });
    setIsAddOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Inventory Manager</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Manager Settings</DialogTitle>
                  <DialogDescription>Manage categories and security settings</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="categories" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="categories" className="flex-1 overflow-y-auto p-1">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" /> Manage Categories
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add or remove categories available for items.
                        </p>
                      </div>
                      
                      <form onSubmit={handleAddCategory} className="flex gap-2">
                        <Input 
                          placeholder="New Category Name" 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button type="submit" size="sm" disabled={!newCategory.trim()}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </form>

                      <div className="border rounded-md divide-y">
                        {categories.map(category => (
                          <div key={category} className="flex items-center justify-between p-3 text-sm">
                            <span>{category}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (items.some(i => i.category === category)) {
                                  toast({ title: "Cannot remove", description: "Category is in use by items.", variant: "destructive" });
                                } else {
                                  removeCategory(category);
                                  toast({ title: "Category removed" });
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security" className="p-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Key className="h-4 w-4" /> Login Credentials
                        </CardTitle>
                        <CardDescription>Update the username and password for manager access.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...credentialsForm}>
                          <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-4">
                            <FormField
                              control={credentialsForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={credentialsForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full">Update Credentials</Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" onClick={handleLogout} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
            
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if(!open) {
                setEditingItem(null);
                form.reset({ name: "", unit: "", category: categories[0] || "Produce", image: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex justify-center mb-4">
                       <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2">
                              <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                                {field.value ? (
                                  <>
                                    <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                                    <div 
                                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => field.onChange("")}
                                    >
                                      <X className="w-6 h-6 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <label htmlFor="image-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
                                  </label>
                                )}
                                <input 
                                  id="image-upload" 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleImageUpload}
                                  disabled={!!field.value}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Tomatoes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. kg, pcs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full">{editingItem ? "Save Changes" : "Add Item"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search inventory..." 
                className="pl-8 bg-muted/20" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px]">Img</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                         No items found.
                       </TableCell>
                     </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(item)} className="hover:bg-primary/10 hover:text-primary">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              deleteItem(item.id);
                              toast({ title: "Item deleted", variant: "destructive" });
                            }} className="hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
