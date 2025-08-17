import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, Eye } from "lucide-react";
import type { ClusterWithEmails } from "@shared/schema";

interface ClusterCardProps {
  cluster: ClusterWithEmails;
  onArchive: (cluster: ClusterWithEmails) => void;
  onViewAll: (cluster: ClusterWithEmails) => void;
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { indicator: string; border: string }> = {
    'blue-500': { indicator: 'bg-blue-500', border: 'border-l-blue-500' },
    'green-500': { indicator: 'bg-green-500', border: 'border-l-green-500' },
    'orange-500': { indicator: 'bg-orange-500', border: 'border-l-orange-500' },
    'purple-500': { indicator: 'bg-purple-500', border: 'border-l-purple-500' },
    'pink-500': { indicator: 'bg-pink-500', border: 'border-l-pink-500' },
  };
  
  return colorMap[color] || { indicator: 'bg-gray-500', border: 'border-l-gray-500' };
};

export function ClusterCard({ cluster, onArchive, onViewAll }: ClusterCardProps) {
  const colorClasses = getColorClasses(cluster.color || 'blue-500');
  const activeEmails = cluster.emails.filter(email => !email.isArchived);

  return (
    <Card className="bg-white border border-gmail-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${colorClasses.indicator}`}></div>
            <h3 className="font-inter font-semibold text-gray-900" data-testid={`text-cluster-name-${cluster.id}`}>
              {cluster.name}
            </h3>
          </div>
          <span 
            className="text-sm text-gmail-gray bg-gray-100 px-2 py-1 rounded-full"
            data-testid={`text-cluster-count-${cluster.id}`}
          >
            {cluster.emailCount} emails
          </span>
        </div>
        
        <p className="text-sm text-gmail-gray mb-4" data-testid={`text-cluster-description-${cluster.id}`}>
          {cluster.description}
        </p>

        {/* Email Preview List */}
        <div className="space-y-3 mb-4">
          {activeEmails.slice(0, 3).map((email, index) => (
            <div key={email.id} className={`border-l-2 pl-3 ${colorClasses.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" data-testid={`text-email-sender-${email.id}`}>
                    {email.sender}
                  </p>
                  <p className="text-sm text-gmail-gray truncate" data-testid={`text-email-subject-${email.id}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-gmail-gray mt-1" data-testid={`text-email-snippet-${email.id}`}>
                    {email.snippet}
                  </p>
                </div>
                <span className="text-xs text-gmail-gray ml-2" data-testid={`text-email-time-${email.id}`}>
                  {email.timestamp ? new Date(email.timestamp).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          ))}
          
          {activeEmails.length === 0 && (
            <div className="text-center py-4 text-gmail-gray text-sm">
              All emails in this cluster have been archived
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            data-testid={`button-view-cluster-${cluster.id}`}
            onClick={() => onViewAll(cluster)}
            variant="outline"
            className="flex-1 border-gmail-border hover:bg-gmail-light"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
          <Button
            data-testid={`button-archive-cluster-${cluster.id}`}
            onClick={() => onArchive(cluster)}
            disabled={activeEmails.length === 0}
            className="bg-gmail-red hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
