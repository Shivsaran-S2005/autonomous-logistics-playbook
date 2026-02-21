import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginAsConsumer, loginAsRetailer } = useAuth();
  const [retailerEmail, setRetailerEmail] = useState("");
  const [retailerPassword, setRetailerPassword] = useState("");
  const [error, setError] = useState("");

  const handleConsumerLogin = () => {
    loginAsConsumer();
    navigate("/consumer");
  };

  const handleRetailerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = loginAsRetailer(retailerEmail, retailerPassword);
    if (result.success) {
      navigate("/retailer");
    } else {
      setError(result.error ?? "Login failed.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-neon-cyan/30">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-widest text-neon-cyan">
            SUPPLY CHAIN PORTAL — SIGN IN
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Choose your role to access the appropriate dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="retailer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 font-mono text-xs">
              <TabsTrigger value="retailer" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Retailer
              </TabsTrigger>
              <TabsTrigger value="consumer" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Supplier
              </TabsTrigger>
            </TabsList>

            <TabsContent value="retailer" className="mt-4">
              <form onSubmit={handleRetailerLogin} className="space-y-4">
                <div>
                  <Label className="text-xs font-mono">Email</Label>
                  <Input
                    type="email"
                    className="font-mono mt-1"
                    placeholder="retailer@mumbai.com"
                    value={retailerEmail}
                    onChange={(e) => setRetailerEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono">Password</Label>
                  <Input
                    type="password"
                    className="font-mono mt-1"
                    placeholder="••••••••"
                    value={retailerPassword}
                    onChange={(e) => setRetailerPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-mono">{error}</p>
                )}
                <Button type="submit" className="w-full font-mono">
                  Sign in as Retailer
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-3 font-mono">
                Demo: retailer@mumbai.com / retailer@delhi.com / retailer@bangalore.com — password: retailer123
              </p>
            </TabsContent>

            <TabsContent value="consumer" className="mt-4">
              <p className="text-sm text-muted-foreground font-mono mb-4">
                View products and high-level delivery status. No account required.
              </p>
              <Button
                type="button"
                onClick={handleConsumerLogin}
                variant="outline"
                className="w-full font-mono"
              >
                Continue as Supplier
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
