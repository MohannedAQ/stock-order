import { useState, useMemo } from "react";
import { useInventory, InventoryItem } from "@/lib/storage";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, ShoppingCart, Search, Send, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";

export default function Staff() {
  const { items, categories } = useInventory();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const orderItems = useMemo(() => {
    return Object.entries(quantities).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return item ? { item, quantity: qty } : null;
    }).filter((i): i is { item: InventoryItem; quantity: number } => i !== null);
  }, [quantities, items]);

  const whatsappLink = generateWhatsAppLink(orderItems);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = categories.reduce((acc, cat) => {
    const catItems = filteredItems.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, InventoryItem[]>);
  
  // Handle items with deleted categories by putting them in "Uncategorized" if needed
  const categorizedIds = new Set(Object.values(groupedItems).flat().map(i => i.id));
  const uncategorizedItems = filteredItems.filter(i => !categorizedIds.has(i.id));
  
  if (uncategorizedItems.length > 0) {
    groupedItems["Uncategorized"] = uncategorizedItems;
  }

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-heading font-bold">New Order</h1>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button className="relative" disabled={totalItems === 0}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Review Order
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Order Summary</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto py-4">
                {orderItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Your cart is empty.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map(({ item, quantity }) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.category}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold">{quantity}</span>
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <SheetFooter className="pt-4 border-t">
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white" asChild disabled={orderItems.length === 0}>
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <Send className="h-4 w-4" /> Send to WhatsApp
                  </a>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full pb-24">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            className="pl-10 py-6 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-heading font-bold text-muted-foreground uppercase tracking-wider border-b pb-1">
                {category}
              </h2>
              <div className="grid gap-3">
                {items.map((item) => {
                  const qty = quantities[item.id] || 0;
                  return (
                    <Card key={item.id} className={`transition-colors ${qty > 0 ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-lg">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.unit}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-background rounded-full border p-1 shadow-sm">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold font-mono text-lg">
                            {qty}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
          
          {Object.keys(groupedItems).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No items found matching "{searchTerm}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
