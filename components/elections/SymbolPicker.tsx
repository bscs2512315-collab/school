"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import AppInput from "@/components/AppInput";
import {
  DEFAULT_ELECTION_SYMBOLS,
  toEmojiSymbol,
  type ElectionSymbolOption,
} from "@/lib/elections/symbols";
import { cn } from "@/lib/utils";
import ImageSVG from "@/public/svgs/ImageSVG";

const SYMBOL_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export type SymbolSelection =
  | { type: "emoji"; emoji: string; name: string }
  | { type: "image"; src: string; name: string }
  | { type: "upload"; file: File; name: string };

interface SymbolPickerProps {
  initialName?: string | null;
  initialValue?: string | null;
  onChange: (selection: SymbolSelection | null) => void;
}

export default function SymbolPicker({
  initialName = null,
  initialValue = null,
  onChange,
}: SymbolPickerProps) {
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName ?? "");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nameEdited, setNameEdited] = useState(false);

  useEffect(() => {
    if (initialValue) {
      if (initialValue.startsWith("emoji:")) {
        setSelectedEmoji(initialValue.slice("emoji:".length));
        setSelectedImage(null);
        setCustomFile(null);
        setCustomPreview(null);
      } else {
        setSelectedEmoji(null);
        setSelectedImage(initialValue);
        setCustomFile(null);
        setCustomPreview(null);
      }
    } else {
      setSelectedEmoji(null);
      setSelectedImage(null);
      setCustomFile(null);
      setCustomPreview(null);
    }
    setName(initialName ?? "");
    setNameEdited(false);
  }, [initialName, initialValue]);

  useEffect(() => {
    if (!customFile) return;
    const url = URL.createObjectURL(customFile);
    setCustomPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [customFile]);

  const clear = () => {
    setSelectedEmoji(null);
    setSelectedImage(null);
    setCustomFile(null);
    setCustomPreview(null);
    setName("");
    setNameEdited(false);
    if (symbolInputRef.current) symbolInputRef.current.value = "";
    onChange(null);
  };

  const pickOption = (option: ElectionSymbolOption) => {
    setSelectedEmoji(option.emoji ?? null);
    setSelectedImage(option.image ?? null);
    setCustomFile(null);
    setCustomPreview(null);
    if (symbolInputRef.current) symbolInputRef.current.value = "";
    const nextName = nameEdited ? name.trim() : option.name;
    setName(nextName);
    if (option.image) {
      onChange({ type: "image", src: option.image, name: nextName });
    } else if (option.emoji) {
      onChange({ type: "emoji", emoji: option.emoji, name: nextName });
    }
  };

  const applyCustom = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedEmoji(null);
    setSelectedImage(null);
    setCustomFile(file);
    const nextName = nameEdited ? name.trim() : file.name.replace(/\.[^.]+$/, "");
    setName(nextName);
    onChange({ type: "upload", file, name: nextName });
  };

  const renderSymbolPreview = (option: ElectionSymbolOption) => {
    if (option.image) {
      return (
        <img
          src={option.image}
          alt={option.name}
          className="max-h-5 max-w-5 object-contain"
        />
      );
    }
    return <span className="leading-none">{option.emoji}</span>;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 pt-1">
        {DEFAULT_ELECTION_SYMBOLS.map((option) => (
          <button
            key={option.name}
            type="button"
            onClick={() => pickOption(option)}
            title={option.name}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border text-xl transition-all",
              ((option.emoji && selectedEmoji === option.emoji) ||
                (option.image && selectedImage === option.image)) &&
                !customFile
                ? "border-primary bg-primary/10 ring-2 ring-primary"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted",
            )}
          >
            {renderSymbolPreview(option)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => symbolInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            applyCustom(e.dataTransfer.files?.[0]);
          }}
          className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/40 hover:bg-muted/60"
        >
          <span className="flex flex-col items-center gap-1.5 px-2 text-center">
            {customFile ? (
              <img
                src={customPreview ?? ""}
                alt="Custom symbol"
                className="max-h-16 max-w-full rounded object-contain"
              />
            ) : (
              <>
                <Upload className="size-5 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground">
                  Upload your own
                </span>
              </>
            )}
          </span>
        </button>

        <div className="flex h-28 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-border/60 bg-card p-2 text-center">
          {selectedEmoji && !customFile ? (
            <span className="text-4xl leading-none">{selectedEmoji}</span>
          ) : selectedImage && !customFile ? (
            <img
              src={selectedImage}
              alt="Selected symbol"
              className="max-h-16 max-w-full rounded object-contain"
            />
          ) : customPreview ? (
            <img
              src={customPreview}
              alt="Selected symbol"
              className="max-h-16 max-w-full rounded object-contain"
            />
          ) : (
            <ImageSVG className="size-6 text-muted-foreground/40" />
          )}
          {name ? (
            <p className="max-w-full text-[10px] font-bold text-muted-foreground break-all">
              {name}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={symbolInputRef}
        type="file"
        accept={SYMBOL_ACCEPT}
        className="hidden"
        onChange={(e) => applyCustom(e.target.files?.[0])}
      />

      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Symbol name {customFile ? "*" : ""}
        </label>
        <div className="relative">
          <AppInput
            value={name}
            onChange={(e) => {
              setNameEdited(true);
              setName(e.target.value);
              if (customFile) {
                onChange({ type: "upload", file: customFile, name: e.target.value });
              } else if (selectedEmoji) {
                onChange({
                  type: "emoji",
                  emoji: selectedEmoji,
                  name: e.target.value,
                });
              } else if (selectedImage) {
                onChange({
                  type: "image",
                  src: selectedImage,
                  name: e.target.value,
                });
              }
            }}
            placeholder="e.g. Ducati, Star"
            className={customFile && !name.trim() ? "border-destructive" : ""}
          />
          {name ? (
            <button
              type="button"
              onClick={clear}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Clear symbol"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {customFile && !name.trim() ? (
          <p className="text-[11px] text-destructive">Symbol name is required for custom symbols</p>
        ) : null}
      </div>
    </div>
  );
}