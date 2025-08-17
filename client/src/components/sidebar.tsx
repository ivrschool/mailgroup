import { Button } from "@/components/ui/button";
import { RotateCcw, Archive, Star } from "lucide-react";

interface SidebarProps {
  stats: {
    totalEmails: number;
    clusterCount: number;
    lastUpdated: string;
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export function Sidebar({ stats, onRefresh, isLoading }: SidebarProps) {
  return (
    <aside className="w-64 bg-gmail-light border-r border-gmail-border flex-shrink-0">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-sm font-inter font-medium text-gmail-gray uppercase tracking-wide mb-3">
            Email Analysis
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gmail-gray">Total Emails</span>
              <span className="font-medium" data-testid="text-total-emails">
                {stats.totalEmails}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gmail-gray">Clusters Found</span>
              <span className="font-medium" data-testid="text-cluster-count">
                {stats.clusterCount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gmail-gray">Last Updated</span>
              <span className="font-medium text-xs" data-testid="text-last-updated">
                {new Date(stats.lastUpdated).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Button
            data-testid="button-refresh"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full bg-gmail-blue hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Refresh Analysis</span>
              </div>
            )}
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-inter font-medium text-gmail-gray uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gmail-gray hover:bg-white hover:text-gray-900"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive All Read
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gmail-gray hover:bg-white hover:text-gray-900"
            >
              <Star className="h-4 w-4 mr-2" />
              Star Important
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
