import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleAuthCallback(code);
    }
  }, []);

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/callback', { code });
      const data = await response.json();
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast({
        title: "Authentication successful",
        description: "You have been successfully authenticated with Gmail.",
      });
      
      setLocation('/dashboard');
    } catch (error) {
      console.error('Auth callback error:', error);
      toast({
        title: "Authentication failed",
        description: "Failed to authenticate with Gmail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/auth/url');
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate sign in. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gmail-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Inbox className="h-12 w-12 text-gmail-blue" />
          </div>
          <CardTitle className="text-2xl font-inter font-semibold">
            Inbox Triage Assistant
          </CardTitle>
          <CardDescription>
            Sign in with your Gmail account to start organizing your inbox into actionable clusters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            data-testid="button-signin"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-gmail-blue hover:bg-blue-600 text-white"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              "Sign in with Gmail"
            )}
          </Button>
          <p className="text-xs text-gmail-gray text-center mt-4">
            We only access your inbox to help organize your emails. Your data is never stored permanently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
