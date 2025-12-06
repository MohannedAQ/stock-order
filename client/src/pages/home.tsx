import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChefHat, ClipboardList, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
             <div />
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight text-primary">KitchenSync</h1>
          <p className="text-muted-foreground text-lg">Restaurant Order Management System</p>
        </div>

        <div className="grid gap-4 w-full">
          <Link href="/staff">
            <Card className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group">
              <CardContent className="flex items-center p-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg">Staff Access</h3>
                  <p className="text-sm text-muted-foreground">Create a new order list</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/manager">
            <Card className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group">
              <CardContent className="flex items-center p-6">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg">Manager Access</h3>
                  <p className="text-sm text-muted-foreground">Manage inventory items</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
