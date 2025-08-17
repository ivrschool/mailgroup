import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive } from "lucide-react";
import type { ClusterWithEmails } from "@shared/schema";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cluster: ClusterWithEmails | null;
  isLoading: boolean;
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cluster, 
  isLoading 
}: ConfirmationModalProps) {
  if (!cluster) return null;

  const activeEmailCount = cluster.emails.filter(email => !email.isArchived).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="modal-archive-confirmation">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <Archive className="h-5 w-5 text-gmail-red" />
            <DialogTitle className="font-inter font-semibold">Archive Cluster</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to archive all{" "}
            <span className="font-medium" data-testid="text-modal-email-count">
              {activeEmailCount}
            </span>{" "}
            emails in the "{" "}
            <span className="font-medium" data-testid="text-modal-cluster-name">
              {cluster.name}
            </span>
            " cluster? This action will move them to your Gmail archive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-3">
          <Button
            data-testid="button-cancel-archive"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            data-testid="button-confirm-archive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-gmail-red hover:bg-red-600 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Archiving...</span>
              </div>
            ) : (
              "Archive All"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
