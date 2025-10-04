import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { deleteInvoice } from "../lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  id: string | null;
  onDeleteSuccess: () => void;
}

export default function DeleteConfirmationModal({
  open,
  onClose,
  id,
  onDeleteSuccess,
}: DeleteModalProps) {
  // const router = useRouter();
  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteInvoice(id); //delete the invoice by id
      onDeleteSuccess();
      toast("Deleted Invoice sucessfully!");
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you wanna delete this?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            invoice and remove this data from our servers.
          </DialogDescription>{" "}
          <DialogFooter className="mt-4">
            <Button onClick={handleDelete}>Yes</Button>
            <Button variant="outline" onClick={onClose}>
              No
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
