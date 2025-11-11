import { getLoginUrl } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to access BKI Tools Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin} 
            className="w-full"
          >
            Sign in with BKI Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}