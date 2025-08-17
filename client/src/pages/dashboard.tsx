import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ClusterCard } from "@/components/cluster-card";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, ClusterWithEmails } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithEmails | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setLocation('/auth');
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data: clusters = [], isLoading: clustersLoading } = useQuery<ClusterWithEmails[]>({
    queryKey: ['/api/clusters', user?.id],
    enabled: !!user?.id,
  });

  const { data: stats = { totalEmails: 0, clusterCount: 0, lastUpdated: new Date().toISOString() } } = useQuery<{
    totalEmails: number;
    clusterCount: number;
    lastUpdated: string;
  }>({
    queryKey: ['/api/stats', user?.id],
    enabled: !!user?.id,
  });

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const response = await apiRequest('POST', `/api/emails/sync/${user.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clusters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', user?.id] });
      toast({
        title: "Sync completed",
        description: "Your emails have been refreshed and re-clustered.",
      });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync emails. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveClusterMutation = useMutation({
    mutationFn: async (clusterId: string) => {
      const response = await apiRequest('POST', `/api/clusters/${clusterId}/archive`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clusters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', user?.id] });
      setShowConfirmModal(false);
      setSelectedCluster(null);
      toast({
        title: "Cluster archived",
        description: `Successfully archived ${data.archivedCount} emails.`,
      });
    },
    onError: (error) => {
      console.error('Archive error:', error);
      toast({
        title: "Archive failed",
        description: "Failed to archive cluster. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setLocation('/auth');
  };

  const handleRefresh = () => {
    syncEmailsMutation.mutate();
  };

  const handleArchiveCluster = (cluster: ClusterWithEmails) => {
    setSelectedCluster(cluster);
    setShowConfirmModal(true);
  };

  const handleConfirmArchive = () => {
    if (selectedCluster) {
      archiveClusterMutation.mutate(selectedCluster.id);
    }
  };

  const handleViewCluster = (cluster: ClusterWithEmails) => {
    // TODO: Navigate to detailed cluster view
    console.log('View cluster:', cluster.name);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onSignOut={handleSignOut} />
      
      <div className="flex h-screen">
        <Sidebar 
          stats={stats} 
          onRefresh={handleRefresh} 
          isLoading={syncEmailsMutation.isPending}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-inter font-semibold text-gray-900 mb-2">
                Email Clusters
              </h2>
              <p className="text-gmail-gray">
                Your last 200 emails organized into actionable groups
              </p>
            </div>

            {clustersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gmail-blue"></div>
                <p className="text-gmail-gray mt-4">Loading your email clusters...</p>
              </div>
            ) : clusters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gmail-gray mb-4">No email clusters found.</p>
                <p className="text-gmail-gray text-sm mb-6">
                  Click "Refresh Analysis" to sync your emails and create clusters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {clusters.map((cluster) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    onArchive={handleArchiveCluster}
                    onViewAll={handleViewCluster}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedCluster(null);
        }}
        onConfirm={handleConfirmArchive}
        cluster={selectedCluster}
        isLoading={archiveClusterMutation.isPending}
      />
    </div>
  );
}
