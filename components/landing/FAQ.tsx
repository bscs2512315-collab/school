"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQS } from "@/lib/faq-data";
import StarSVG from "@/public/svgs/StarSVG";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { cn } from "@/lib/utils";

export { FAQS };
export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="relative scroll-mt-28 overflow-hidden bg-muted/20 px-4 py-16 sm:scroll-mt-32 sm:px-6 sm:py-20 md:py-24 border-t border-border/50"
    >
      <div className="mx-auto max-w-4xl">
        <ScrollReveal animation="fade-up" className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary dark:text-logo-green">
            <HelpCircle className="size-3.5" /> Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-3xl font-black leading-[1.1] tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl">
            Everything you need to know about{" "}
            <span className="relative inline-block whitespace-nowrap text-primary dark:text-logo-green pb-1 sm:pb-1.5">
              ExBoard AI
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
              />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
            Got questions about AKUEB &amp; Sindh Board preparation, AI grading, or classroom tools? We&apos;ve got answers.
          </p>
        </ScrollReveal>

        <div className="mt-10 sm:mt-12 space-y-3 sm:space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal
                key={faq.question}
                animation="fade-up"
                delay={index * 60}
              >
                <div
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:border-primary/40 shadow-xs hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between gap-4 p-4.5 sm:p-5 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isOpen
                        ? "bg-primary text-primary-foreground rotate-180 scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                      <ChevronDown className="size-4" />
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border/50 px-4.5 pb-5 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4 text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left gap-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary dark:text-logo-green shrink-0">
                <StarSVG />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">Have a specific question or school inquiry?</h4>
                <p className="text-xs text-muted-foreground">Our academic team is here to support students and institutions.</p>
              </div>
            </div>
            <a
              href="mailto:support@exboardai.tech"
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 sm:mt-0 whitespace-nowrap hover:-translate-y-0.5"
            >
              Contact Academic Support
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
