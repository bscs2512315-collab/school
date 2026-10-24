"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

interface SwaggerSpec {
    openapi?: string;
    swagger?: string;
    info?: {
        title?: string;
        version?: string;
    };
    paths?: Record<string, unknown>;
    [key: string]: unknown;
}

export default function ApiDocsClient() {
    const [spec, setSpec] = useState<SwaggerSpec | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSpec() {
            try {
                const res = await fetch("/api/swagger");
                const data = await res.json();
                setSpec(data);
            } catch (error) {
                console.error("Failed to fetch swagger spec:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSpec();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900">
                <div className="text-xl font-medium animate-pulse">Loading API Documentation...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {spec ? (
                <SwaggerUI spec={spec} />
            ) : (
                <div className="p-8 text-center text-red-600">
                    Failed to load API specification. Ensure /api/swagger endpoint is working.
                </div>
            )}
        </div>
    );
}
