import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/lib/storage";
import logo from "@assets/generated_images/minimalist_linear_icon_of_a_chef's_knife_and_a_fork_crossed.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isLoggingIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ username, password });
      toast({ 
        title: "Welcome back", 
        description: "Successfully signed in as Manager." 
      });
      setLocation("/manager");
    } catch (error) {
      toast({ 
        title: "Access Denied", 
        description: error instanceof Error ? error.message : "Invalid username or password.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2 shadow-lg">
             <img src={logo} alt="Logo" className="w-10 h-10 object-contain invert brightness-0 filter" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-primary">Manager Portal</h1>
          <p className="text-muted-foreground">Sign in to manage inventory and settings</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Enter username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4 bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Use your configured credentials. <br/>(Default: <strong>admin</strong> / <strong>admin</strong>)
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
