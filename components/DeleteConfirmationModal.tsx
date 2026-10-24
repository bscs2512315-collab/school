"use client";

import ConfirmationModal from "@/components/ConfirmationModal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item?",
  itemName,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const fullMessage = itemName
    ? `${message}\n\n"${itemName}"`
    : message;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={`${fullMessage}\n\nThis action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
