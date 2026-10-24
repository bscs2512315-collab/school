"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Headphones,
  Check,
  MessageCircle,
  History,
  Activity,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { UserRole } from "@/types/enums";
import HeartSVG from "@/public/svgs/HeartSVG";
import Link from "next/link";

type AssistantStatus = "idle" | "requesting_mic" | "listening" | "analyzing" | "speaking";
type ActiveTab = "commands" | "viva";

interface CommandResult {
  transcribedText?: string;
  intent: string;
  spokenResponse: string;
  subject?: string | null;
  topic?: string | null;
  grade?: string | null;
  action?: {
    type: "LINK" | "VIVA" | "NONE";
    title: string;
    url: string | null;
    badge: string;
  };
  conceptSummary?: string | null;
}

interface VivaQuestion {
  question: string;
  spokenIntro: string;
  topic: string;
  subject: string;
  difficulty: "Easy" | "Medium" | "Challenging";
  keyExpectedPoints: string[];
  hint?: string;
}

interface VivaEvaluation {
  transcribedAnswer?: string;
  score: number;
  verdict: "MASTERED" | "GOOD_PROGRESS" | "NEEDS_REVISION";
  spokenFeedback: string;
  praise: string[];
  missingPoints: string[];
  examTip: string;
  followUpQuestion?: string;
}

interface IWindowSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

const PRESET_TOPICS: Record<string, string[]> = {
  Chemistry: [
    "Chemical Equilibrium & Le Chatelier's Principle",
    "Bohr's Atomic Theory & Rutherford Drawbacks",
    "Periodic Trends: Ionization Energy & Electronegativity",
    "Electrolysis & Electrochemistry",
  ],
  Physics: [
    "Newton's Laws of Motion & Momentum",
    "Ohm's Law & Electric Resistance",
    "Total Internal Reflection & Critical Angle",
    "Simple Harmonic Motion (SHM)",
  ],
  Biology: [
    "Photosynthesis Light & Dark Reactions",
    "DNA Replication & Transcription",
    "Enzyme Action & Lock and Key Model",
    "Osmosis and Cell Turgor",
  ],
  Mathematics: [
    "Quadratic Equations & Quadratic Formula",
    "Matrices & Determinants",
    "Trigonometric Identities & Applications",
  ],
  "Computer Science": [
    "Object-Oriented Programming (OOP) Pillars",
    "Database Normalization (1NF, 2NF, 3NF)",
    "Binary Search vs Linear Search",
  ],
};

const SUGGESTED_VOICE_COMMANDS = [
  "Generate a 20-mark Chemistry paper for Class 10",
  "Open Past Papers 1 for MCQs",
  "Explain Bohr's Atomic Model in simple terms",
  "Take me to the Papers Bank",
];

function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code ticks
      .replace(/`([^`]+)`/g, "$1")
      // Remove URLs
      .replace(/https?:\/\/\S+/g, "")
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, "")
      // Format fractions like 8/10 to 8 out of 10
      .replace(/(\d+)\/(\d+)/g, "$1 out of $2")
      // Remove markdown bold and italics: **text**, *text*, __text__, _text_
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Convert chemical/math arrows -> or => or -->
      .replace(/-->|->|=>/g, " yields ")
      // Convert common symbols for clear pronunciation
      .replace(/\+/g, " plus ")
      .replace(/%/g, " percent ")
      .replace(/°C/g, " degrees Celsius ")
      .replace(/°F/g, " degrees Fahrenheit ")
      .replace(/&/g, " and ")
      // Remove markdown bullet points (- or * or + at line start)
      .replace(/^\s*[-*+]\s+/gm, "")
      // Remove markdown blockquotes
      .replace(/^\s*>\s+/gm, "")
      // Remove citation tags like [1] or [Note]
      .replace(/\[\d+\]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove horizontal dividers
      .replace(/[-=_]{3,}/g, "")
      // Remove emojis and decorative Unicode symbols that distort speech synthesis
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      // Normalize pauses and line breaks
      .replace(/\n+/g, ". ")
      .replace(/\.+/g, ".")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export default function AnnaVoiceAssistant({ className }: { className?: string }) {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();

  const [activeTab, setActiveTab] = useState<ActiveTab>("commands");
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voiceLang, setVoiceLang] = useState<"en" | "ur">("en");
  const [selectedVoice, setSelectedVoice] = useState<string>("en-IN-NeerjaExpressiveNeural");
  const [currentSpokenText, setCurrentSpokenText] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Command Assistant State
  const [commandHistory, setCommandHistory] = useState<
    Array<{
      query: string;
      result: CommandResult;
      timestamp: Date;
    }>
  >([]);
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);

  // Viva Mode State
  const [selectedSubject, setSelectedSubject] = useState("Chemistry");
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS.Chemistry[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<VivaQuestion | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<VivaEvaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [vivaHistory, setVivaHistory] = useState<string[]>([]);

  // Audio References
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hardware Audio & Speech Recording References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  // Check user authorization
  const isAuthorized =
    profile?.role === UserRole.QA ||
    profile?.role === UserRole.ADMIN ||
    profile?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com";

  const studentName = profile?.name ? profile.name.split(" ")[0] : "Student";

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
    setIsPlayingAudio(false);
    setStatus((prev) => (prev === "speaking" ? "idle" : prev));
  }, []);

  const cleanupMicrophone = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Pre-warm browser voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!text || !autoSpeak) return;

      try {
        stopAudio();
        setStatus("analyzing");

        const cleanText = cleanTextForSpeech(text).slice(0, 2500);
        if (!cleanText) {
          setStatus("idle");
          return;
        }

        setCurrentSpokenText(cleanText);

        const voiceToUse =
          selectedVoice ||
          (voiceLang === "ur" ? "ur-PK-UzmaNeural" : "en-IN-NeerjaExpressiveNeural");

        // 1. High-Definition Studio Neural Voice (/api/tts with Neerja / Uzma at 96kbps mono MP3)
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: cleanText,
              lang: voiceLang,
              gender: "female",
              voice: voiceToUse,
              speed: voiceSpeed,
            }),
          });

          if (res.ok) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            audio.playbackRate = voiceSpeed;
            audioPlayerRef.current = audio;

            audio.onplay = () => {
              setStatus("speaking");
              setIsPlayingAudio(true);
            };

            audio.onended = () => {
              setIsPlayingAudio(false);
              setStatus("idle");
              URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = (e) => {
              console.error("[Audio playback error]:", e);
              setIsPlayingAudio(false);
              setStatus("idle");
            };

            try {
              await audio.play();
            } catch (playErr) {
              console.warn("[Autoplay deferred]:", playErr);
              setStatus("speaking");
              setIsPlayingAudio(false);
            }
            return;
          } else {
            const errData = await res.json().catch(() => ({}));
            console.error("[TTS API Error]:", res.status, errData);
            toast.error("Audio generation error. Retrying...");
            setIsPlayingAudio(false);
            setStatus("idle");
          }
        } catch (neuralErr) {
          console.error("[Neural TTS network error]:", neuralErr);
          toast.error("Network issue connecting to voice server.");
          setIsPlayingAudio(false);
          setStatus("idle");
        }
      } catch (err) {
        console.error("[TTS Error]:", err);
        setIsPlayingAudio(false);
        setStatus("idle");
      }
    },
    [autoSpeak, selectedVoice, voiceLang, voiceSpeed, stopAudio]
  );

  const handlePreviewVoice = useCallback(() => {
    const sample =
      voiceLang === "ur"
        ? "السلام علیکم! میں انا ہوں، آپ کی مطالعہ کی ساتھی۔ آئیے مل کر امتحان کی تیاری کرتے ہیں۔"
        : "Assalamu alaykum! I'm Anna, your AI study partner for ExBoard AI. Let's practice your board exam questions together!";
    speakText(sample);
  }, [voiceLang, speakText]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startListening = async () => {
    stopAudio();
    setTranscript("");
    if (activeTab === "viva") {
      setStudentAnswer("");
    }
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    setStatus("requesting_mic");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported by your browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      mediaStreamRef.current = stream;

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = audioCtx;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (err) {
        console.warn("Audio meter skipped:", err);
      }

      let mediaRecorder: MediaRecorder | null = null;
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      } catch (recorderErr) {
        console.warn("MediaRecorder fallback error:", recorderErr);
      }

      interface WindowWithSpeech extends Window {
        SpeechRecognition?: new () => IWindowSpeechRecognition;
        webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
      }

      const windowWithSpeech = window as unknown as WindowWithSpeech;
      const SpeechRecognitionClass =
        windowWithSpeech.SpeechRecognition ||
        windowWithSpeech.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = voiceLang === "ur" ? "ur-PK" : "en-US";

          recognition.onresult = (event: ISpeechRecognitionEvent) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            const trimmed = fullText.trim();
            if (trimmed) {
              setTranscript(trimmed);
              if (activeTab === "viva") {
                setStudentAnswer(trimmed);
              }
            }
          };

          recognition.onerror = (errEvent) => {
            console.warn("SpeechRecognition notice:", errEvent.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (recErr) {
          console.warn("Web Speech API error:", recErr);
        }
      }

      setStatus("listening");

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      cleanupMicrophone();
      setStatus("idle");
      const errMessage = err instanceof Error ? err.message : String(err);

      if (errMessage.includes("Permission") || errMessage.includes("NotAllowedError") || errMessage.includes("denied")) {
        toast.error("Microphone access is blocked! Please click the lock or camera icon in your browser address bar to allow microphone permissions.");
      } else {
        toast.error(`Unable to start microphone: ${errMessage}`);
      }
    }
  };

  const stopListeningAndSubmit = async () => {
    setStatus("analyzing");

    let audioBlob: Blob | null = null;
    let base64Audio: string | null = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) return resolve();
        mediaRecorderRef.current.onstop = () => resolve();
        mediaRecorderRef.current.stop();
      });

      if (audioChunksRef.current.length > 0) {
        audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current.mimeType || "audio/webm",
        });
        try {
          base64Audio = await blobToBase64(audioBlob);
        } catch {
          // ignore
        }
      }
    }

    cleanupMicrophone();
    const currentTranscriptText = transcript.trim();

    if (activeTab === "commands") {
      if (currentTranscriptText) {
        await handleProcessCommand(currentTranscriptText);
      } else if (base64Audio) {
        await handleProcessAudioCommand(base64Audio, audioBlob?.type || "audio/webm");
      } else {
        toast.error("No speech detected. Please speak into your microphone and try again.");
        setStatus("idle");
      }
    } else {
      if (currentTranscriptText) {
        setStudentAnswer(currentTranscriptText);
        await handleEvaluateAnswer(currentTranscriptText, null, null);
      } else if (base64Audio) {
        await handleEvaluateAnswer("", base64Audio, audioBlob?.type || "audio/webm");
      } else {
        toast.error("No answer recorded. Please speak or type your answer.");
        setStatus("idle");
      }
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    stopAudio();
    setIsSubmittingCommand(true);
    setStatus("analyzing");

    try {
      const res = await fetch("/api/qa/anna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "command",
          transcript: commandText,
          userContext: {
            class: profile?.class || "10",
            board: profile?.board || "AKUEB",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse command");
      }

      const result: CommandResult = await res.json();

      setCommandHistory((prev) => [
        { query: commandText, result, timestamp: new Date() },
        ...prev,
      ]);

      setTranscript("");
      setTypedInput("");

      if (result.intent === "START_VIVA") {
        setActiveTab("viva");
        if (result.topic) setSelectedTopic(result.topic);
        if (result.subject && PRESET_TOPICS[result.subject]) setSelectedSubject(result.subject);
      }

      if (result.spokenResponse) {
        speakText(result.spokenResponse);
      } else {
        setStatus("idle");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to process voice command";
      toast.error(msg);
      setStatus("idle");
    } finally {
      setIsSubmittingCommand(false);
    }
  };

  const handleProcessAudioCommand = async (audioBase64: string, audioMimeType: string) => {
    stopAudio();
    setIsSubmittingCommand(true);
    setStatus("analyzing");

    try {
      const res = await fetch("/api/qa/anna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "command",
          audioBase64,
          audioMimeType,
          userContext: {
            class: profile?.class || "10",
            board: profile?.board || "AKUEB",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process spoken audio");
      }

      const result: CommandResult = await res.json();

      setCommandHistory((prev) => [
        { query: result.transcribedText || "Spoken Voice Command", result, timestamp: new Date() },
        ...prev,
      ]);

      setTranscript("");
      setTypedInput("");

      if (result.intent === "START_VIVA") {
        setActiveTab("viva");
        if (result.topic) setSelectedTopic(result.topic);
        if (result.subject && PRESET_TOPICS[result.subject]) setSelectedSubject(result.subject);
      }

      if (result.spokenResponse) {
        speakText(result.spokenResponse);
      } else {
        setStatus("idle");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to process voice command";
      toast.error(msg);
      setStatus("idle");
    } finally {
      setIsSubmittingCommand(false);
    }
  };

  const handleGenerateQuestion = async (overrideTopic?: string) => {
    const topicToUse = overrideTopic || customTopic.trim() || selectedTopic;
    if (!topicToUse) {
      toast.error("Please choose or enter a topic first.");
      return;
    }

    stopAudio();
    cleanupMicrophone();
    setIsLoadingQuestion(true);
    setEvaluation(null);
    setStudentAnswer("");
    setShowHint(false);
    setStatus("analyzing");

    try {
      const res = await fetch("/api/qa/anna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "viva_question",
          subject: selectedSubject,
          topic: topicToUse,
          grade: profile?.class || "10",
          board: profile?.board || "AKUEB",
          previousQuestions: vivaHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate viva question");
      }

      const questionData: VivaQuestion = await res.json();
      setCurrentQuestion(questionData);
      setVivaHistory((prev) => [...prev, questionData.question]);

      if (questionData.spokenIntro) {
        speakText(questionData.spokenIntro);
      } else {
        setStatus("idle");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load question";
      toast.error(msg);
      setStatus("idle");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleEvaluateAnswer = async (
    textAnswer?: string,
    audioBase64?: string | null,
    audioMimeType?: string | null
  ) => {
    if (!currentQuestion) return;
    const answerToEval = (textAnswer ?? studentAnswer).trim();

    if (!answerToEval && !audioBase64) {
      toast.error("Please speak or type your answer before submitting.");
      return;
    }

    stopAudio();
    cleanupMicrophone();
    setIsEvaluating(true);
    setStatus("analyzing");

    try {
      const res = await fetch("/api/qa/anna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "viva_evaluate",
          question: currentQuestion.question,
          topic: currentQuestion.topic,
          subject: currentQuestion.subject,
          studentAnswer: answerToEval,
          audioBase64,
          audioMimeType,
          keyExpectedPoints: currentQuestion.keyExpectedPoints,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to evaluate answer");
      }

      const evalData: VivaEvaluation = await res.json();
      setEvaluation(evalData);

      if (evalData.transcribedAnswer && !studentAnswer) {
        setStudentAnswer(evalData.transcribedAnswer);
      }

      if (evalData.spokenFeedback) {
        speakText(evalData.spokenFeedback);
      } else {
        setStatus("idle");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to evaluate answer";
      toast.error(msg);
      setStatus("idle");
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanupMicrophone();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [cleanupMicrophone]);

  if (isProfileLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">QA Team Exclusive Feature</h2>
          <p className="text-xs text-muted-foreground">
            Anna Voice AI is currently undergoing internal QA verification.
          </p>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-1 overflow-hidden border border-border/60 bg-background sm:rounded-3xl sm:shadow-md",
        className
      )}
    >
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR: VOICE HISTORY & MODE SWITCHER (MATCHING NOVA SESSIONS PANEL)*/}
      {/* ========================================================================= */}
      <div className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card md:flex lg:w-80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Voice History</p>
              <p className="text-[10px] text-muted-foreground">
                {commandHistory.length} actions &middot; {vivaHistory.length} viva tests
              </p>
            </div>
          </div>
        </div>

        {/* New Session Button */}
        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={() => {
              setCommandHistory([]);
              setCurrentQuestion(null);
              setEvaluation(null);
              setStudentAnswer("");
              stopAudio();
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99] cursor-pointer"
          >
            <Plus className="size-4 shrink-0" />
            <span>New voice session</span>
          </button>
        </div>

        {/* Auto delete notice */}
        <div className="mb-2 italic flex items-center justify-center px-2 py-1 text-[10px] font-medium text-muted-foreground text-center">
          <span>Voice interactions auto-cleared upon session reset</span>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="px-3 pb-3">
          <div className="flex rounded-xl bg-muted/70 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab("commands");
                cleanupMicrophone();
                stopAudio();
              }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition text-center cursor-pointer",
                activeTab === "commands"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Voice Actions
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("viva");
                cleanupMicrophone();
                stopAudio();
              }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition text-center cursor-pointer",
                activeTab === "viva"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Oral Viva
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {commandHistory.length === 0 && vivaHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Mic className="size-8 opacity-30 mb-2" />
              <p className="text-xs font-medium text-foreground">No recent voice commands</p>
              <p className="text-[11px] max-w-[200px] mt-0.5">
                Speak or tap a suggestion on the right to start talking with Anna.
              </p>
            </div>
          ) : (
            <>
              {commandHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-background/50 p-2.5 text-left text-xs transition hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  onClick={() => speakText(item.result.spokenResponse)}
                >
                  <p className="font-semibold text-foreground truncate">&ldquo;{item.query}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {item.result.spokenResponse}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT MAIN PANEL: ACTIVE STAGE (MATCHING NOVA CHAT PANEL)                 */}
      {/* ========================================================================= */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        {/* Top Header inside panel (matching Nova header) */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-4 text-primary" />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary dark:text-white">Anna</p>
              <p className="truncate text-xs text-muted-foreground">
                AI Voice Tutor &middot; Listening to {studentName}
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auto Speak Toggle */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Headphones className="size-3.5 text-primary" />
              <span>Voice</span>
              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors",
                  autoSpeak ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-3 transform rounded-full bg-white shadow-xs transition",
                    autoSpeak ? "translate-x-3" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Voice Persona Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2 py-0.5 text-xs">
              <Sparkles className="size-3 text-primary shrink-0" />
              <select
                aria-label="Anna Voice Persona"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-xs pr-1"
                title="Choose Anna's AI voice persona"
              >
                {voiceLang === "en" ? (
                  <>
                    <option value="en-IN-NeerjaExpressiveNeural">Anna (Urdu + English • Most Realistic)</option>
                    <option value="en-IN-NeerjaNeural">Neerja (Academic Accent)</option>
                    <option value="ur-PK-UzmaNeural">Uzma (Urdu Native)</option>
                    <option value="en-US-AvaMultilingualNeural">Ava (US Accent)</option>
                    <option value="en-US-JennyNeural">Jenny (US Academic)</option>
                  </>
                ) : (
                  <>
                    <option value="ur-PK-UzmaNeural">Uzma (Pakistani Urdu • Best)</option>
                    <option value="en-IN-NeerjaExpressiveNeural">Anna (Bilingual Urdu + English)</option>
                    <option value="ur-IN-GulNeural">Gul (Melodic Urdu)</option>
                    <option value="ur-PK-AsadNeural">Asad (Urdu Male)</option>
                  </>
                )}
              </select>

              {/* Preview Voice Button */}
              <button
                type="button"
                onClick={handlePreviewVoice}
                disabled={isPlayingAudio}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                title="Preview voice pronunciation"
              >
                <Volume2 className={cn("size-3.5", isPlayingAudio && "text-primary animate-pulse")} />
              </button>
            </div>

            {/* Voice Speed */}
            <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
              {[1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setVoiceSpeed(speed)}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-medium transition cursor-pointer",
                    voiceSpeed === speed
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Language Switch */}
            <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setVoiceLang("en");
                  setSelectedVoice("en-IN-NeerjaExpressiveNeural");
                }}
                className={cn(
                  "rounded-md px-2 py-0.5 font-medium transition cursor-pointer",
                  voiceLang === "en"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceLang("ur");
                  setSelectedVoice("ur-PK-UzmaNeural");
                }}
                className={cn(
                  "rounded-md px-2 py-0.5 font-medium transition cursor-pointer",
                  voiceLang === "ur"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                UR
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Stage Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
          {/* ===================================================================== */}
          {/* MODE 1: VOICE ACTIONS (SIRI FOR EXBOARD)                              */}
          {/* ===================================================================== */}
          {activeTab === "commands" && (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Hero Banner (matching NovaStartPanel) */}
              <div className="space-y-2">
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  AI Voice Assistant
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Hi {studentName}, I&apos;m Anna
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your voice-powered exam companion. Speak your commands to generate past papers,
                  navigate the app, or ask for instant conceptual explanations.
                </p>
                <p className="text-xs text-muted-foreground">
                  I&apos;m Anna — trained on your board curriculum and past papers, and built with{" "}
                  <HeartSVG className="mx-0.5 inline size-3.5 text-[#ef4444]" /> by{" "}
                  <span className="font-semibold text-foreground">Muhammad Taha Talib</span> for students.
                </p>
              </div>

              {/* Main Interactive Mic Card (ExBoard Forest Green Palette) */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                {/* Voice Orb */}
                <div className="relative flex size-28 items-center justify-center">
                  {status === "listening" && (
                    <div
                      className="absolute inset-0 rounded-full bg-primary/20 transition-all duration-75"
                      style={{
                        transform: `scale(${1 + audioLevel * 0.008})`,
                        opacity: 0.4 + audioLevel * 0.006,
                      }}
                    />
                  )}

                  <div
                    className={cn(
                      "relative z-10 flex size-20 items-center justify-center rounded-full text-white shadow-md transition-all duration-300",
                      status === "idle" && "bg-primary shadow-primary/20",
                      status === "requesting_mic" && "bg-primary/80 animate-pulse",
                      status === "listening" && "bg-emerald-600 ring-4 ring-emerald-500/20 shadow-emerald-600/30",
                      status === "analyzing" && "bg-amber-600 animate-pulse",
                      status === "speaking" && "bg-primary ring-4 ring-primary/20"
                    )}
                  >
                    {status === "requesting_mic" || status === "analyzing" ? (
                      <Loader2 className="size-8 animate-spin" />
                    ) : status === "speaking" ? (
                      <Volume2 className="size-8 animate-pulse" />
                    ) : status === "listening" ? (
                      <Activity className="size-8 animate-pulse" />
                    ) : (
                      <Mic className="size-8" />
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    {status === "idle" && "Anna is Ready"}
                    {status === "requesting_mic" && "Connecting Microphone..."}
                    {status === "listening" && `Listening... (${recordingSeconds}s)`}
                    {status === "analyzing" && "Processing your command..."}
                    {status === "speaking" && "Anna is speaking..."}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {status === "idle" && "Tap the button below and speak your command naturally."}
                    {status === "listening" && "Speak clearly into your microphone. Tap stop when finished."}
                    {status === "analyzing" && "Extracting curriculum intent and preparing actions."}
                    {status === "speaking" && "Listen to Anna's response. Tap mute anytime."}
                  </p>
                </div>

                {/* Soundwave Meter & Live Words */}
                {status === "listening" && (
                  <div className="w-full max-w-md space-y-2 pt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-75"
                        style={{ width: `${Math.max(10, audioLevel)}%` }}
                      />
                    </div>
                    {transcript && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs font-semibold text-primary">
                        &ldquo;{transcript}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* Spoken Response Preview in Center Stage */}
                {currentSpokenText && (
                  <div className="w-full max-w-md rounded-xl border border-primary/20 bg-primary/5 p-3 text-center space-y-1 animate-in fade-in">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Anna says</p>
                    <p className="text-xs text-foreground font-medium italic leading-relaxed">&ldquo;{currentSpokenText}&rdquo;</p>
                  </div>
                )}

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {status === "listening" ? (
                    <button
                      type="button"
                      onClick={stopListeningAndSubmit}
                      className="flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-98 cursor-pointer"
                    >
                      <MicOff className="size-4" />
                      Stop & Send Command ({recordingSeconds}s)
                    </button>
                  ) : status === "requesting_mic" ? (
                    <button
                      type="button"
                      disabled
                      className="flex h-11 items-center gap-2 rounded-xl bg-muted px-5 text-xs font-bold text-muted-foreground shadow-xs cursor-not-allowed"
                    >
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Connecting Mic...
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startListening}
                      disabled={isSubmittingCommand}
                      className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      <Mic className="size-4" />
                      Start Talking to Anna
                    </button>
                  )}

                  {currentSpokenText && (
                    <button
                      type="button"
                      onClick={() => speakText(currentSpokenText)}
                      className="flex h-11 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary hover:bg-primary/20 transition active:scale-98 cursor-pointer"
                    >
                      <Play className="size-4 fill-current" />
                      Listen to Voice
                    </button>
                  )}

                  {isPlayingAudio && (
                    <button
                      type="button"
                      onClick={stopAudio}
                      className="flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                    >
                      <VolumeX className="size-4 text-rose-500" />
                      Mute Audio
                    </button>
                  )}
                </div>
              </div>

              {/* Try Asking Suggestions (matching Nova's 2-column cards) */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Try asking
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SUGGESTED_VOICE_COMMANDS.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleProcessCommand(sample)}
                      disabled={isSubmittingCommand}
                      className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3.5 text-left text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>{sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Latest Command Action Card */}
              {commandHistory.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Latest Response
                  </p>
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          A
                        </div>
                        <span className="text-xs font-bold text-foreground">Anna</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText(commandHistory[0].result.spokenResponse)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                      >
                        <Play className="size-3" />
                        Replay Voice
                      </button>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">
                      {commandHistory[0].result.spokenResponse}
                    </p>

                    {commandHistory[0].result.action && commandHistory[0].result.action.url && (
                      <div className="pt-2 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => router.push(commandHistory[0].result.action!.url!)}
                          className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap className="size-3.5" />
                            {commandHistory[0].result.action.title}
                          </span>
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* MODE 2: VIVA VOCE & ORAL EXAMINER                                     */}
          {/* ===================================================================== */}
          {activeTab === "viva" && (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Oral Examination (Viva Voce)
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Active Recall & Verbal Testing
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pick a topic below. Anna will ask you authentic board questions, listen to your
                  spoken answer, and critique what you explained well versus what you missed.
                </p>
              </div>

              {/* Subject Selector Pills (Matching Past Papers 1) */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select Subject
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PRESET_TOPICS).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(subj);
                        setSelectedTopic(PRESET_TOPICS[subj][0]);
                      }}
                      className={cn(
                        "rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer",
                        selectedSubject === subj
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border/80 bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selector & Ask Button */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  High-Yield {selectedSubject} Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS[selectedSubject]?.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(topic);
                        setCustomTopic("");
                        handleGenerateQuestion(topic);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                        selectedTopic === topic && !customTopic
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Or type a custom topic (e.g., Simple Harmonic Motion)..."
                    className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateQuestion()}
                    disabled={isLoadingQuestion}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingQuestion ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    Ask Oral Question
                  </button>
                </div>
              </div>

              {/* Question Card */}
              {currentQuestion && (
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {currentQuestion.subject} &middot; {currentQuestion.topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(currentQuestion.spokenIntro || currentQuestion.question)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                    >
                      <Volume2 className="size-3.5" />
                      Read Aloud
                    </button>
                  </div>

                  <p className="text-base font-bold text-foreground leading-snug">
                    &ldquo;{currentQuestion.question}&rdquo;
                  </p>

                  {currentQuestion.hint && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <HelpCircle className="size-3.5" />
                        {showHint ? "Hide hint" : "Show hint"}
                      </button>
                      {showHint && (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          {currentQuestion.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Student Spoken Answer Card */}
              {currentQuestion && (
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mic className="size-4 text-primary" />
                      Your Spoken Answer
                    </h4>
                    {recordingSeconds > 0 && status === "listening" && (
                      <span className="text-xs font-bold text-primary animate-pulse">
                        Recording: {recordingSeconds}s
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Click 'Record Answer' and speak into your microphone, or type your explanation here..."
                    className="w-full rounded-xl border border-border bg-muted/20 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary leading-relaxed"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      {status === "listening" ? (
                        <button
                          type="button"
                          onClick={stopListeningAndSubmit}
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer"
                        >
                          <MicOff className="size-3.5" />
                          Stop Recording ({recordingSeconds}s)
                        </button>
                      ) : status === "requesting_mic" ? (
                        <button
                          type="button"
                          disabled
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-muted px-4 text-xs font-bold text-muted-foreground cursor-not-allowed"
                        >
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                          Connecting Mic...
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startListening}
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                        >
                          <Mic className="size-3.5" />
                          {studentAnswer ? "Record Again" : "Record Answer"}
                        </button>
                      )}

                      {studentAnswer && (
                        <button
                          type="button"
                          onClick={() => setStudentAnswer("")}
                          className="flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <RotateCcw className="size-3" />
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEvaluateAnswer()}
                      disabled={!studentAnswer.trim() || isEvaluating}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Submit for Critique
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Examiner Critique Scorecard */}
              {evaluation && (
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                          evaluation.verdict === "MASTERED" && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                          evaluation.verdict === "GOOD_PROGRESS" && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                          evaluation.verdict === "NEEDS_REVISION" && "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        )}
                      >
                        {evaluation.verdict === "MASTERED" ? "Concept Mastered" : evaluation.verdict === "GOOD_PROGRESS" ? "Good Understanding" : "Needs Revision"}
                      </span>
                      <span className="text-xs font-bold text-foreground">Score: {evaluation.score}/100</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(evaluation.spokenFeedback)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                    >
                      <Play className="size-3" />
                      Replay Feedback
                    </button>
                  </div>

                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-foreground italic leading-relaxed">
                    &ldquo;{evaluation.spokenFeedback}&rdquo;
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="size-3.5" /> What You Got Right
                      </p>
                      <ul className="text-xs text-foreground/90 space-y-1">
                        {evaluation.praise.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">&bull;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="size-3.5" /> Missing Points & Gaps
                      </p>
                      <ul className="text-xs text-foreground/90 space-y-1">
                        {evaluation.missingPoints.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">&bull;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {evaluation.examTip && (
                    <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-foreground">
                      <span className="font-bold text-primary block mb-0.5">Board Exam Tip:</span>
                      {evaluation.examTip}
                    </div>
                  )}

                  {evaluation.followUpQuestion && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Follow-up Question</p>
                        <p className="text-xs font-medium text-foreground">&ldquo;{evaluation.followUpQuestion}&rdquo;</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (evaluation.followUpQuestion) {
                            setCurrentQuestion({
                              question: evaluation.followUpQuestion,
                              spokenIntro: `Here is your follow up: ${evaluation.followUpQuestion}`,
                              topic: currentQuestion?.topic || "Revision",
                              subject: currentQuestion?.subject || selectedSubject,
                              difficulty: "Challenging",
                              keyExpectedPoints: [],
                            });
                            setStudentAnswer("");
                            setEvaluation(null);
                            speakText(`Here is your follow up: ${evaluation.followUpQuestion}`);
                          }
                        }}
                        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                      >
                        Answer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Input Bar (Matching NovaChatPanel Input Bar) */}
        <div className="border-t border-border/60 bg-card px-4 py-3 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedInput.trim()) {
                handleProcessCommand(typedInput);
              }
            }}
            className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 shadow-2xs"
          >
            <button
              type="button"
              onClick={status === "listening" ? stopListeningAndSubmit : startListening}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition cursor-pointer",
                status === "listening" ? "bg-rose-500 text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title={status === "listening" ? "Stop recording" : "Speak to Anna"}
            >
              <Mic className="size-4" />
            </button>

            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Ask Anna anything or type a voice command..."
              className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />

            <button
              type="submit"
              disabled={!typedInput.trim() || isSubmittingCommand}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              {isSubmittingCommand ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Anna can make mistakes. Consider checking important curriculum information.
          </p>
        </div>
      </div>
      <audio ref={audioPlayerRef} className="hidden" preload="auto" playsInline />
    </div>
  );
}
