import { Button } from "@/components/ui/button";
import { Inbox, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
}

export function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gmail-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Inbox className="text-gmail-blue text-2xl" />
            <h1 className="text-xl font-inter font-semibold text-gray-900">
              Inbox Triage Assistant
            </h1>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gmail-gray">
              <CheckCircle className="h-4 w-4 text-gmail-green" />
              <span data-testid="text-user-email">{user.email}</span>
            </div>
            <Button
              data-testid="button-signout"
              onClick={onSignOut}
              variant="outline"
              size="sm"
              className="border-gmail-border hover:bg-gmail-light"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
