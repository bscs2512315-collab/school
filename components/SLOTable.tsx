"use client";

import React, { useState } from "react";
import { Typography } from "./ui/Typography";
import { cn } from "@/lib/utils";
import { Edit2, Save, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";

interface SLO {
    sloNumber: string;
    sloText: string;
    cognitiveLevel: string;
}

interface Subtopic {
    subtopicNumber: string;
    subtopicName: string;
    slos: SLO[];
}

interface SLOTableProps {
    subtopics: Subtopic[];
    chapterName: string;
    chapterNumber: number | string;
    isEditMode?: boolean;
    onSave?: (updatedSubtopics: Subtopic[]) => void;
}

export default function SLOTable({
    subtopics: initialSubtopics,
    chapterName,
    chapterNumber,
    isEditMode: initialEditMode = false,
    onSave,
}: SLOTableProps) {
    const [subtopics, setSubtopics] = useState<Subtopic[]>(initialSubtopics);
    const [isEditMode, setIsEditMode] = useState(initialEditMode);
    const canEdit = typeof onSave === "function";

    const handleEditSLO = (subtopicIndex: number, sloIndex: number, field: keyof SLO, value: string) => {
        const updatedSubtopics = [...subtopics];
        updatedSubtopics[subtopicIndex].slos[sloIndex][field] = value;
        setSubtopics(updatedSubtopics);
    };

    const handleToggleLevel = (subtopicIndex: number, sloIndex: number, level: string) => {
        if (!isEditMode) return;
        const updatedSubtopics = [...subtopics];
        updatedSubtopics[subtopicIndex].slos[sloIndex].cognitiveLevel = level;
        setSubtopics(updatedSubtopics);
    };

    const handleSave = () => {
        if (onSave) {
            onSave(subtopics);
        }
        setIsEditMode(false);
    };

    const addSubtopic = () => {
        const newSubtopic: Subtopic = {
            subtopicNumber: `${subtopics.length + 1}.1`,
            subtopicName: "New Subtopic",
            slos: [{ sloNumber: `${subtopics.length + 1}.1.1`, sloText: "New SLO", cognitiveLevel: "R" }]
        };
        setSubtopics([...subtopics, newSubtopic]);
    };

    const addSLO = (subtopicIndex: number) => {
        const updatedSubtopics = [...subtopics];
        const nextNumber = updatedSubtopics[subtopicIndex].slos.length + 1;
        const subtopicNumber = updatedSubtopics[subtopicIndex].subtopicNumber;
        updatedSubtopics[subtopicIndex].slos.push({
            sloNumber: `${subtopicNumber}.${nextNumber}`,
            sloText: "New SLO",
            cognitiveLevel: "R"
        });
        setSubtopics(updatedSubtopics);
    };

    const removeSubtopic = (index: number) => {
        setSubtopics(subtopics.filter((_, i) => i !== index));
    };

    const removeSLO = (subtopicIndex: number, sloIndex: number) => {
        const updatedSubtopics = [...subtopics];
        updatedSubtopics[subtopicIndex].slos = updatedSubtopics[subtopicIndex].slos.filter((_, i) => i !== sloIndex);
        if (updatedSubtopics[subtopicIndex].slos.length === 0) {
            updatedSubtopics.splice(subtopicIndex, 1);
        }
        setSubtopics(updatedSubtopics);
    };

    const isLevelMatch = (sloLevel: string | undefined, targetLevel: string): boolean => {
        const normalized = sloLevel?.trim().toUpperCase() || "";
        if (targetLevel === "R") return normalized === "R" || normalized === "K";
        if (targetLevel === "U") return normalized === "U";
        if (targetLevel === "A") return normalized === "A" || normalized === "AP" || normalized === "AN" || normalized === "E" || normalized === "C";
        if (targetLevel === "FA") return normalized === "FA" || normalized === "CA";
        return normalized === targetLevel;
    };

    const getLevelTitle = (level: string): string => {
        switch (level) {
            case "R":
            case "K":
                return "Remember (Recall / Knowledge)";
            case "U":
                return "Understand (Comprehension)";
            case "A":
                return "Application and beyond [Apply, Analyse, Evaluate, Create]";
            case "FA":
            case "CA":
                return "Formative Assessment (Not to be assessed under examination conditions)";
            default:
                return level;
        }
    };

    return (
        <div className="w-full bg-background dark:bg-card rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-sm print:shadow-none print:border-none print:rounded-none print:overflow-visible print:bg-transparent">
            <div className="bg-primary p-4 sm:p-6 print:p-6 print:bg-transparent print:rounded-none">
                <Typography variant="h3" className="text-primary-foreground font-black tracking-tight text-base sm:text-xl print:text-black print:text-2xl">
                    Unit {chapterNumber}: {chapterName}
                </Typography>
            </div>

            {/* Mobile / Small Screens Layout (< md): Merged Topics, Subtopics & SLOs */}
            <div className="block md:hidden divide-y divide-border/60 print:hidden">
                {subtopics.map((subtopic, subIndex) => (
                    <div key={subIndex} className="bg-card">
                        {/* Subtopic Header */}
                        <div className="bg-primary/5 dark:bg-muted/40 border-b border-border/70 p-3.5 sm:p-4">
                            <div className="flex items-start gap-2.5">
                                <span className="font-black text-primary text-sm shrink-0">
                                    {subtopic.subtopicNumber}
                                </span>
                                {isEditMode ? (
                                    <input
                                        value={subtopic.subtopicName}
                                        onChange={(e) => {
                                            const updated = [...subtopics];
                                            updated[subIndex].subtopicName = e.target.value;
                                            setSubtopics(updated);
                                        }}
                                        className="w-full bg-transparent border-b border-primary/20 focus:border-primary outline-none py-0.5 font-bold text-sm text-foreground"
                                        placeholder="Subtopic Title"
                                    />
                                ) : (
                                    <h4 className="font-black text-foreground text-sm leading-snug">
                                        {subtopic.subtopicName}
                                    </h4>
                                )}
                            </div>
                            {isEditMode && (
                                <div className="flex gap-3 pl-6 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => addSLO(subIndex)}
                                        className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                                    >
                                        <AddSVG className="h-3 w-3" /> Add SLO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSubtopic(subIndex)}
                                        className="text-[10px] font-black uppercase text-destructive hover:underline flex items-center gap-1"
                                    >
                                        <DeleteSVG className="h-3 w-3" /> Delete Section
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SLO Items for this Subtopic */}
                        <div className="divide-y divide-border/40">
                            {subtopic.slos.map((slo, sloIndex) => {
                                const cognitiveLevel = slo.cognitiveLevel?.trim().toUpperCase();
                                const isFA = isLevelMatch(cognitiveLevel, "FA");
                                const displayBadge = cognitiveLevel === "K" ? "R" : cognitiveLevel === "CA" ? "FA" : cognitiveLevel;
                                return (
                                    <div key={`${subIndex}-${sloIndex}`} className="p-3.5 sm:p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black italic text-primary">
                                                {slo.sloNumber}
                                            </span>
                                             {isEditMode ? (
                                                <div className="flex items-center gap-1">
                                                    {["R", "U", "A", "FA"].map((level) => {
                                                        const isMatch = isLevelMatch(cognitiveLevel, level);
                                                        return (
                                                            <button
                                                                key={level}
                                                                type="button"
                                                                onClick={() => handleToggleLevel(subIndex, sloIndex, level)}
                                                                className={cn(
                                                                    "h-6 px-1.5 rounded-md text-[10px] font-black transition-all flex items-center justify-center",
                                                                    isMatch
                                                                        ? level === "FA"
                                                                            ? "bg-slate-700 dark:bg-slate-600 text-white shadow-xs"
                                                                            : "bg-primary text-primary-foreground shadow-xs"
                                                                        : "bg-muted/60 text-muted-foreground hover:bg-muted",
                                                                )}
                                                                title={getLevelTitle(level)}
                                                            >
                                                                {level}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : cognitiveLevel ? (
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center justify-center h-6 px-2 rounded-md text-[11px] font-black shadow-xs",
                                                        isFA
                                                            ? "bg-slate-700 dark:bg-slate-600 text-white"
                                                            : "bg-primary text-primary-foreground"
                                                    )}
                                                    title={getLevelTitle(cognitiveLevel)}
                                                >
                                                    {displayBadge}
                                                </span>
                                            ) : null}
                                        </div>

                                        {isEditMode ? (
                                            <div className="relative">
                                                <textarea
                                                    value={slo.sloText}
                                                    onChange={(e) => handleEditSLO(subIndex, sloIndex, "sloText", e.target.value)}
                                                    className="w-full bg-transparent border border-primary/20 rounded-lg p-2 text-xs min-h-[50px] resize-none text-foreground outline-none focus:border-primary"
                                                    placeholder="Enter SLO description..."
                                                />
                                                {subtopic.slos.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSLO(subIndex, sloIndex)}
                                                        className="mt-1 text-[10px] text-destructive font-bold hover:underline"
                                                    >
                                                        Remove SLO
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs sm:text-sm font-medium text-foreground/90 leading-relaxed">
                                                {slo.sloText}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {isEditMode && (
                    <div className="p-3.5 text-center">
                        <button
                            type="button"
                            onClick={addSubtopic}
                            className="w-full py-3 border-2 border-dashed border-primary/20 rounded-xl text-primary font-black uppercase tracking-wider text-xs hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <AddSVG className="h-4 w-4" /> Add New Subtopic Section
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop Table Layout (>= md) */}
            <div className="hidden md:block overflow-x-auto print:block print:overflow-visible">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-primary text-primary-foreground print:bg-transparent print:text-black print:border-b-2 print:border-black/20">
                            <th className="p-4 text-left border border-primary-foreground/20 font-black uppercase tracking-widest text-[10px] w-1/3 print:border-black/10 print:text-black print:bg-transparent print:py-5">
                                Topics and Sub-topics
                            </th>
                            <th className="p-4 text-left border border-primary-foreground/20 font-black uppercase tracking-widest text-[10px] w-1/2 print:border-black/10 print:text-black print:bg-transparent print:py-5">
                                Student Learning Outcomes
                            </th>
                            <th className="p-4 text-center border border-primary-foreground/20 font-black uppercase tracking-widest text-[10px] w-36 print:border-black/10 print:text-black print:bg-transparent print:py-5">
                                Cognitive Levels
                                <div className="flex mt-2 border-t border-primary-foreground/20 pt-2 print:border-black/20 text-[9px]">
                                    <span className="flex-1 print:text-black" title="Remember">R</span>
                                    <span className="flex-1 print:text-black" title="Understand">U</span>
                                    <span className="flex-1 print:text-black" title="Application and beyond">A</span>
                                    <span className="flex-1 print:text-black" title="Formative Assessment (Not examined)">FA</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subtopics.map((subtopic, subIndex) => (
                            <React.Fragment key={subIndex}>
                                {subtopic.slos.map((slo, sloIndex) => (
                                    <tr key={`${subIndex}-${sloIndex}`} className="hover:bg-muted/30 transition-colors group print:bg-transparent">
                                        {sloIndex === 0 && (
                                            <td
                                                className="p-6 border border-border align-top print:border-primary/20 print:bg-transparent"
                                                rowSpan={subtopic.slos.length}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-3">
                                                        <span className="font-black text-primary min-w-10 print:text-base">
                                                            {subtopic.subtopicNumber}
                                                        </span>
                                                        {isEditMode ? (
                                                            <input
                                                                value={subtopic.subtopicName}
                                                                onChange={(e) => {
                                                                    const updated = [...subtopics];
                                                                    updated[subIndex].subtopicName = e.target.value;
                                                                    setSubtopics(updated);
                                                                }}
                                                                className="w-full bg-transparent border-b border-primary/20 focus:border-primary outline-none py-1 font-bold"
                                                                placeholder="Subtopic Title"
                                                            />
                                                        ) : (
                                                            <span className="font-black text-foreground print:text-black print:text-base leading-tight">
                                                                {subtopic.subtopicName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isEditMode && (
                                                        <div className="flex gap-2 pl-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => addSLO(subIndex)}
                                                                className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                <AddSVG className="h-3 w-3" /> Add SLO
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubtopic(subIndex)}
                                                                className="text-[10px] font-black uppercase text-destructive hover:underline flex items-center gap-1"
                                                            >
                                                                <DeleteSVG className="h-3 w-3" /> Delete Unit
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-6 border border-border align-top print:border-primary/20 print:bg-transparent">
                                            <div className="flex gap-3">
                                                <span className="text-primary font-black italic min-w-12 print:text-xs print:text-primary/60">
                                                    {slo.sloNumber}
                                                </span>
                                                <div className="flex-1 flex flex-col gap-2">
                                                    {isEditMode ? (
                                                        <div className="relative group/slo">
                                                            <textarea
                                                                value={slo.sloText}
                                                                onChange={(e) => handleEditSLO(subIndex, sloIndex, "sloText", e.target.value)}
                                                                className="w-full bg-transparent border border-primary/10 rounded-lg p-2 focus:border-primary outline-none text-sm min-h-[60px] resize-none"
                                                                placeholder="Enter SLO description..."
                                                            />
                                                            {subtopic.slos.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSLO(subIndex, sloIndex)}
                                                                    className="absolute top-2 right-2 text-destructive opacity-0 group-hover/slo:opacity-100 transition-opacity"
                                                                >
                                                                    <DeleteSVG className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground text-sm leading-relaxed font-medium print:text-[13px] print:text-black">
                                                            {slo.sloText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 sm:p-6 border border-border text-center print:border-primary/20 print:bg-transparent">
                                            <div className="flex h-full items-center gap-1">
                                                {["R", "U", "A", "FA"].map((level) => {
                                                    const isMatch = isLevelMatch(slo.cognitiveLevel, level);
                                                    return (
                                                        <div
                                                            key={level}
                                                            onClick={() => handleToggleLevel(subIndex, sloIndex, level)}
                                                            className={cn(
                                                                "flex-1 h-8 flex items-center justify-center rounded-lg transition-all select-none",
                                                                isMatch
                                                                    ? level === "FA"
                                                                        ? "bg-slate-700 dark:bg-slate-600 text-white font-black shadow-md shadow-slate-700/20 print:bg-black print:text-white"
                                                                        : "bg-primary text-primary-foreground font-black shadow-md shadow-primary/20 print:bg-black print:text-white print:shadow-none print:border print:border-black"
                                                                    : isEditMode
                                                                        ? "hover:bg-primary/10 cursor-pointer text-muted-foreground/40 hover:text-primary font-bold"
                                                                        : "text-transparent"
                                                            )}
                                                            title={getLevelTitle(level)}
                                                        >
                                                            {isMatch ? (
                                                                <span className="text-xs font-black tracking-wider text-primary-foreground print:text-white">
                                                                    {level}
                                                                </span>
                                                            ) : isEditMode ? (
                                                                <span className="text-[10px] font-bold">
                                                                    {level}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        {isEditMode && (
                            <tr>
                                <td colSpan={3} className="p-4 border border-border text-center">
                                    <button
                                        type="button"
                                        onClick={addSubtopic}
                                        className="w-full py-4 border-2 border-dashed border-primary/20 rounded-2xl text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <AddSVG className="h-4 w-4" /> Add New Subtopic Section
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 p-4 print:hidden">
                <Typography variant="muted" className="text-[9px] font-bold uppercase tracking-wider">
                    R = Remember, U = Understand, A = Application & beyond [Apply, Analyse, Evaluate, Create] • FA = Formative Assessment (Not examined)
                </Typography>
                {canEdit ? (
                    <div className="flex gap-2">
                        {!isEditMode ? (
                            <button
                                type="button"
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary dark:bg-muted dark:text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                            >
                                <Edit2 className="size-3.5" />
                                Edit Syllabus
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                                >
                                    <Save className="size-3.5" />
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditMode(false)}
                                    className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-muted/80"
                                >
                                    <X className="size-3.5" />
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
