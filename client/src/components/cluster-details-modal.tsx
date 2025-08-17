import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Archive, Mail, MailOpen, Clock, X } from "lucide-react";
import type { ClusterWithEmails } from "@shared/schema";

interface ClusterDetailsModalProps {
  cluster: ClusterWithEmails | null;
  isOpen: boolean;
  onClose: () => void;
  onArchiveCluster: (cluster: ClusterWithEmails) => void;
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { indicator: string; border: string; bg: string }> = {
    'blue-500': { indicator: 'bg-blue-500', border: 'border-l-blue-500', bg: 'bg-blue-50' },
    'green-500': { indicator: 'bg-green-500', border: 'border-l-green-500', bg: 'bg-green-50' },
    'orange-500': { indicator: 'bg-orange-500', border: 'border-l-orange-500', bg: 'bg-orange-50' },
    'purple-500': { indicator: 'bg-purple-500', border: 'border-l-purple-500', bg: 'bg-purple-50' },
    'pink-500': { indicator: 'bg-pink-500', border: 'border-l-pink-500', bg: 'bg-pink-50' },
  };
  
  return colorMap[color] || { indicator: 'bg-gray-500', border: 'border-l-gray-500', bg: 'bg-gray-50' };
};

export function ClusterDetailsModal({ cluster, isOpen, onClose, onArchiveCluster }: ClusterDetailsModalProps) {
  if (!cluster) return null;

  const colorClasses = getColorClasses(cluster.color || 'blue-500');
  const activeEmails = cluster.emails.filter(email => !email.isArchived);
  const archivedEmails = cluster.emails.filter(email => email.isArchived);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0" data-testid="modal-cluster-details">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${colorClasses.indicator}`}></div>
              <DialogTitle className="text-xl font-inter font-semibold" data-testid="text-cluster-modal-title">
                {cluster.name}
              </DialogTitle>
              <Badge variant="secondary" data-testid="text-cluster-modal-count">
                {cluster.emailCount} emails
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gmail-gray mt-2" data-testid="text-cluster-modal-description">
            {cluster.description}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[500px]">
            <div className="p-6 space-y-6">
              {/* Active Emails */}
              {activeEmails.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Active Emails ({activeEmails.length})
                    </h3>
                    {activeEmails.length > 0 && (
                      <Button 
                        onClick={() => onArchiveCluster(cluster)}
                        className="bg-gmail-red hover:bg-red-600 text-white"
                        data-testid="button-archive-all-emails"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive All
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {activeEmails.map((email) => (
                      <div 
                        key={email.id} 
                        className={`border-l-4 pl-4 py-3 bg-white border border-gmail-border rounded-r-lg ${colorClasses.border}`}
                        data-testid={`email-item-${email.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900" data-testid={`text-email-sender-${email.id}`}>
                                {email.sender}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1" data-testid={`text-email-subject-${email.id}`}>
                              {email.subject}
                            </p>
                            <p className="text-sm text-gmail-gray line-clamp-2" data-testid={`text-email-snippet-${email.id}`}>
                              {email.snippet}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gmail-gray ml-4">
                            <Clock className="h-3 w-3" />
                            <span data-testid={`text-email-timestamp-${email.id}`}>
                              {email.timestamp ? formatDate(email.timestamp) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Emails */}
              {archivedEmails.length > 0 && (
                <div>
                  <h3 className="font-medium text-gmail-gray flex items-center mb-4">
                    <MailOpen className="h-4 w-4 mr-2" />
                    Archived Emails ({archivedEmails.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {archivedEmails.map((email) => (
                      <div 
                        key={email.id} 
                        className="border-l-4 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-r-lg border-l-gray-400 opacity-75"
                        data-testid={`email-archived-${email.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-700" data-testid={`text-archived-sender-${email.id}`}>
                                {email.sender}
                              </span>
                              <Badge variant="outline" className="text-xs">Archived</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-1" data-testid={`text-archived-subject-${email.id}`}>
                              {email.subject}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2" data-testid={`text-archived-snippet-${email.id}`}>
                              {email.snippet}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 ml-4">
                            <Clock className="h-3 w-3" />
                            <span data-testid={`text-archived-timestamp-${email.id}`}>
                              {email.timestamp ? formatDate(email.timestamp) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {activeEmails.length === 0 && archivedEmails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gmail-gray mx-auto mb-4" />
                  <p className="text-gmail-gray">No emails in this cluster</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}