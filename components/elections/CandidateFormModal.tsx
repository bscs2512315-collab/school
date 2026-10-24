"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppSelect from "@/components/AppSelect";
import { Typography } from "@/components/ui/Typography";
import CameraSVG from "@/public/svgs/CameraSVG";
import ImageSVG from "@/public/svgs/ImageSVG";
import SymbolPicker, { type SymbolSelection } from "@/components/elections/SymbolPicker";
import { CANDIDATE_GENDER_OPTIONS } from "@/lib/elections/format";
import type { ElectionCandidate } from "@/types/election";
import { Gender } from "@/types/enums";
import { compressImageFile } from "@/lib/utils/image-compressor";

const PROFILE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface CandidateFormModalProps {
  open: boolean;
  saving: boolean;
  candidate?: ElectionCandidate | null;
  onClose: () => void;
  onSubmit: (form: FormData) => void;
}

export default function CandidateFormModal({
  open,
  saving,
  candidate,
  onClose,
  onSubmit,
}: CandidateFormModalProps) {
  const isEdit = Boolean(candidate);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<SymbolSelection | null>(null);
  const [symbolTouched, setSymbolTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setCategory("");
      setGender("");
      setClassLevel("");
      setProfile(null);
      setPreview(null);
      setSymbol(null);
      setSymbolTouched(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setName(candidate?.name ?? "");
    setCategory(candidate?.category ?? "");
    setGender(candidate?.gender ?? "");
    setClassLevel(candidate?.classLevel ?? "");
    setProfile(null);
    setPreview(candidate?.profileImageUrl ?? null);
    setSymbol(null);
    setSymbolTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, candidate]);

  useEffect(() => {
    if (!profile) return;
    const url = URL.createObjectURL(profile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profile]);

  if (!open) return null;

  const canSave =
    name.trim() &&
    category.trim() &&
    (gender === Gender.MALE || gender === Gender.FEMALE) &&
    classLevel.trim() &&
    (isEdit || profile);

  const applyFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setProfile(file);
  };

  const handleSubmit = async () => {
    if (!isEdit && !profile) return;
    const form = new FormData();
    form.append("name", name.trim());
    form.append("category", category.trim());
    form.append("gender", gender);
    form.append("classLevel", classLevel.trim());
    if (profile) {
      const compressedProfile = await compressImageFile(profile, {
        maxDimension: 600,
        quality: 0.85,
      });
      form.append("profile", compressedProfile);
    }
    if (symbol) {
      form.append("symbolName", symbol.name);
      if (symbol.type === "emoji") {
        form.append("symbol", `emoji:${symbol.emoji}`);
      } else if (symbol.type === "image") {
        form.append("symbol", symbol.src);
      } else {
        const compressedSymbol = await compressImageFile(symbol.file, {
          maxDimension: 400,
          quality: 0.85,
        });
        form.append("symbol", compressedSymbol);
      }
    } else if (symbolTouched && isEdit && candidate?.symbolName) {
      form.append("removeSymbol", "1");
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <Typography className="font-bold">
            {isEdit ? "Edit candidate" : "Add candidate"}
          </Typography>
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
              Profile photo *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={PROFILE_ACCEPT}
              className="hidden"
              onChange={(e) => applyFile(e.target.files?.[0])}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    applyFile(e.dataTransfer.files?.[0]);
                  }}
                  className="flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-muted shadow-sm sm:size-36"
                  aria-label="Upload profile photo"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Candidate preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center px-3 text-center">
                      <ImageSVG className="mb-1 size-7 text-primary" />
                      <p className="text-[10px] font-bold leading-tight">
                        Upload photo
                      </p>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                  aria-label="Change photo"
                >
                  <CameraSVG className="size-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {profile ? profile.name : "JPEG, PNG, or WebP"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Candidate symbol (optional)
            </label>
            <SymbolPicker
              initialName={candidate?.symbolName ?? null}
              initialValue={candidate?.symbolUrl ?? null}
              onChange={(selection) => {
                setSymbol(selection);
                setSymbolTouched(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Name *
            </label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Candidate name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Category *
            </label>
            <AppInput
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="President, Vice President"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Gender *
            </label>
            <AppSelect
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Select gender"
              options={CANDIDATE_GENDER_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Class *
            </label>
            <AppInput
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              placeholder="XII"
            />
          </div>
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
            disabled={saving || !canSave}
            onClick={handleSubmit}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save" : "Add"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
