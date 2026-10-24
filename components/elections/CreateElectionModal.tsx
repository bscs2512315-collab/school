"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import AppInput from "@/components/AppInput";
import AddSVG from "@/public/svgs/AddSVG";
import { Typography } from "@/components/ui/Typography";
import { slugifyElectionName } from "@/lib/elections/slug";
import { useElectionPublicUrl } from "@/hooks/elections/useElectionPublicUrl";

interface CreateElectionModalProps {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onSubmit: (form: FormData) => void;
}

export default function CreateElectionModal({
  open,
  creating,
  onClose,
  onSubmit,
}: CreateElectionModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setStartsAt("");
      setEndsAt("");
      setLogo(null);
      setLogoPreview(null);
    }
  }, [open]);

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const previewSlug = useMemo(() => {
    if (slugTouched) return slug.trim().toLowerCase();
    return slugifyElectionName(name);
  }, [name, slug, slugTouched]);
  const publicUrl = useElectionPublicUrl(previewSlug || "hpgs-elections");

  if (!open) return null;

  const handleSubmit = () => {
    const form = new FormData();
    form.append("name", name.trim());
    form.append("slug", previewSlug);
    form.append("startsAt", new Date(startsAt).toISOString());
    form.append("endsAt", new Date(endsAt).toISOString());
    if (logo) form.append("logo", logo);
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <Typography className="font-bold">New election event</Typography>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Election name
            </label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HPGS Student Council Elections"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Public URL
            </label>
            <AppInput
              value={previewSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder="hpgs-elections"
            />
            <p className="text-xs text-muted-foreground">
              {publicUrl}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Logo
            </label>
            {logoPreview ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 p-2">
                <img
                  src={logoPreview}
                  alt="Election logo preview"
                  className="mx-auto max-h-40 rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogo(null);
                    setLogoPreview(null);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }}
                  className="absolute bottom-3 right-3 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 sm:p-10"
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    setLogo(file);
                  }
                }}
              >
                <ImagePlus className="mb-3 size-8 text-primary" />
                <p className="font-semibold text-foreground">
                  Click or drag to upload logo
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG, WebP · up to 5MB
                </p>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLogo(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Starts
              </label>
              <AppDateTimePicker
                value={startsAt}
                onChange={setStartsAt}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ends
              </label>
              <AppDateTimePicker
                value={endsAt}
                onChange={setEndsAt}
              />
            </div>
          </div>
          <Typography variant="muted" className="text-xs">
            Anyone with the voting link can vote. After creating, add categories
            in Settings and share the registration link so candidates can sign
            up themselves. You can still add nominees by hand.
          </Typography>
        </div>
        <div className="flex gap-3 border-t border-border/40 p-5">
          <AppButton
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            className="flex-1 rounded-xl font-black"
            disabled={creating || !name.trim() || !startsAt || !endsAt}
            onClick={handleSubmit}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AddSVG className="size-4" />
            )}
            Create
          </AppButton>
        </div>
      </div>
    </div>
  );
}
