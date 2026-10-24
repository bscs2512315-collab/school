import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import ApiDocsClient from "./ApiDocsClient";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Developer documentation and API reference for the ExBoard AI platform.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: { canonical: "/api-docs" },
  openGraph: {
    title: "ExBoard AI API Documentation",
    description: "Developer documentation and API reference for the ExBoard AI platform.",
    url: `${SITE.url}/api-docs`,
    type: "website",
  },
};

export default function ApiDocs() {
  return <ApiDocsClient />;
}
