"use client";

import React, { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import { Landmark, Edit2, Loader2, UploadCloud, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import apiInstance from "@/lib/api-instance";
import { toast } from "sonner";
import Image from "next/image";
import AppLoader from "@/components/AppLoader";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

interface Board {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Deletion modal state
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = (await apiInstance.get('/admin/boards')) as { success: boolean; data: Board[] };
      if (res.success) {
        setBoards(res.data);
      }
    } catch (error) {
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedBoard(null);
    setName("");
    setLogoBase64("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Board) => {
    setModalMode("edit");
    setSelectedBoard(b);
    setName(b.name);
    setLogoBase64(b.logo_url || "");
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalLogoUrl = selectedBoard?.logo_url || "";

    try {
      // 1. Upload new image if it's a base64 string
      if (logoBase64 && logoBase64.startsWith("data:image")) {
        const uploadRes = (await apiInstance.post('/upload/cloudinary', {
          image: logoBase64,
          folder: 'zentix/boards',
        })) as { success: boolean; url: string };
        if (uploadRes.success) {
          finalLogoUrl = uploadRes.url;
        } else {
          toast.error("Image upload failed");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Add or Update Board
      if (modalMode === "add") {
        await apiInstance.post("/admin/boards", {
          name,
          logo_url: finalLogoUrl,
        });
        toast.success("Board created successfully!");
      } else if (modalMode === "edit" && selectedBoard) {
        await apiInstance.patch(`/admin/boards/${selectedBoard.id}`, {
          name,
          logo_url: finalLogoUrl || null,
        });
        toast.success("Board updated successfully!");
      }

      setIsModalOpen(false);
      fetchBoards();
    } catch (error: any) {
      toast.error(error?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;
    setIsDeleting(true);
    try {
      await apiInstance.delete(`/admin/boards/${boardToDelete.id}`);
      toast.success("Board deleted successfully!");
      setBoardToDelete(null);
      fetchBoards();
    } catch (error) {
      toast.error("Failed to delete board.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Manage Boards"
        actions={
          <AppButton
            onClick={handleOpenAdd}
            className="rounded-xl h-11 sm:h-12 px-6 font-bold shadow-lg shadow-primary/20"
          >
            <AddSVG className="mr-2 size-5" />
            Add New Board
          </AppButton>
        }
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <AppLoader className="min-h-0" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <div key={board.id} className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-primary/20 transition-all"></div>
               
               <div className="flex justify-end gap-2 mb-2 relative z-10">
                  <button onClick={() => handleOpenEdit(board)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-slate-500 cursor-pointer">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setBoardToDelete(board)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-slate-500 cursor-pointer">
                     <DeleteSVG className="w-4 h-4" />
                  </button>
               </div>

               <div className="flex flex-col items-center justify-center text-center mt-2 relative z-10">
                  {board.logo_url ? (
                     <div className="w-20 h-20 mb-4 bg-white rounded-2xl shadow-sm border border-border/50 p-2">
                        <img src={board.logo_url} alt={board.name} className="w-full h-full object-contain" />
                     </div>
                  ) : (
                     <div className="w-20 h-20 mb-4 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
                        <Landmark className="w-8 h-8" />
                     </div>
                  )}
                  <Typography variant="h3" className="text-xl font-bold tracking-tight mb-1 break-words w-full">{board.name}</Typography>
                  <Typography variant="muted" className="text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                     ID: {board.id.substring(0, 8)}
                  </Typography>
               </div>
            </div>
          ))}
          {boards.length === 0 && (
             <div className="col-span-full py-20 text-center border border-dashed border-border/50 rounded-3xl bg-card/30">
                <Typography variant="h4" className="text-muted-foreground">No Boards Configured</Typography>
             </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors cursor-pointer">
               <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <Typography variant="h3" className="mb-6 font-bold">{modalMode === "add" ? "Create Board" : "Edit Board"}</Typography>
            
            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <Typography variant="muted" className="font-bold text-muted-foreground ml-1 mb-1 block">Board Name</Typography>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-12 bg-background border border-border/50 rounded-xl px-4 focus:outline-none focus:border-primary"
                    placeholder="e.g. Aga Khan University Examination Board"
                  />
               </div>
               
               <div>
                  <Typography variant="muted" className="font-bold text-muted-foreground ml-1 mb-1 block">Board Logo</Typography>
                  
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-20 shrink-0 bg-background border border-border/50 rounded-xl flex items-center justify-center overflow-hidden">
                        {logoBase64 ? (
                           <img src={logoBase64} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                           <UploadCloud className="w-6 h-6 text-muted-foreground" />
                        )}
                     </div>
                     <div className="flex-1">
                        <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
                           <span className="text-sm font-bold text-primary">Upload New Logo</span>
                           <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                     </div>
                  </div>
               </div>

               <div className="pt-4">
                  <AppButton type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl text-md">
                     {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (modalMode === "add" ? "Save Board" : "Update Board")}
                  </AppButton>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(boardToDelete)}
        onClose={() => {
          if (!isDeleting) setBoardToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Board"
        message="Are you sure you want to delete this educational board?"
        itemName={boardToDelete?.name}
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
