import { InventoryItem } from "./storage";

export function generateWhatsAppLink(items: { item: InventoryItem; quantity: number }[]) {
  const date = new Date().toLocaleDateString();
  let message = `*Kitchen Order - ${date}*\n\n`;

  // Group by category
  const grouped = items.reduce((acc, curr) => {
    const cat = curr.item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, typeof items>);

  Object.entries(grouped).forEach(([category, categoryItems]) => {
    message += `*${category}*\n`;
    categoryItems.forEach(({ item, quantity }) => {
      message += `- ${item.name}: ${quantity} ${item.unit}\n`;
    });
    message += "\n";
  });

  message += "\nSent via KitchenSync";

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
