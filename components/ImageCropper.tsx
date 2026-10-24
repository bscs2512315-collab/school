"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";
import AppButton from "./AppButton";
import { Typography } from "./ui/Typography";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
    aspect?: number;
}

export default function ImageCropper({ image, onCropComplete, onCancel, aspect = 1 }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        try {
            if (croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
                if (croppedBlob) {
                    onCropComplete(croppedBlob);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-[2.5rem] border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <Typography variant="h3" className="text-xl font-black uppercase tracking-tight">Edit Photo</Typography>
                    <button onClick={onCancel} className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper area */}
                <div className="relative h-[400px] w-full bg-muted overflow-hidden">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>

                {/* Footer / Controls */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-6">
                        <ZoomOut size={18} className="text-muted-foreground shrink-0" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <ZoomIn size={18} className="text-muted-foreground shrink-0" />
                    </div>

                    <div className="flex gap-4">
                        <AppButton
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 rounded-2xl py-3 font-black uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </AppButton>
                        <AppButton
                            onClick={handleCrop}
                            className="flex-1 rounded-2xl py-3 font-black uppercase tracking-widest text-[10px]"
                        >
                            Save Selection
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
