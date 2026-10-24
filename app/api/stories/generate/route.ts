import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { rateLimitDistributed } from "@/lib/security/rate-limit";
import {
  generateStoryEpisodeFromAI,
  ALL_SAMPLE_EPISODES
} from "@/lib/ai/storyboard-generator";
import type { GenerateStoryRequest } from "@/types/story";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get("id");

    if (episodeId) {
      const found = ALL_SAMPLE_EPISODES.find((e) => e.id === episodeId);
      if (found) {
        return successResponse(found, "Story episode retrieved successfully");
      }
    }

    return successResponse(ALL_SAMPLE_EPISODES, "All sample episodes retrieved");
  } catch (error) {
    console.error("Error fetching story episodes:", error);
    return errorResponse("Failed to fetch story episodes", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!(await rateLimitDistributed(`story:generate:${user.userId}`, 10, 60))) {
      return errorResponse("Rate limit exceeded. Please wait a moment before generating another story.", 429);
    }

    const body = (await request.json()) as GenerateStoryRequest;

    if (!body.topicOrSlo || typeof body.topicOrSlo !== "string") {
      return errorResponse("Topic or SLO description is required", 400);
    }

    if (body.topicOrSlo.trim().length > 500) {
      return errorResponse("Topic or SLO description cannot exceed 500 characters", 400);
    }

    // Curated samples are available through GET and the studio preset picker.
    // A generation request always runs the requested topic through the AI model.
    const episode = await generateStoryEpisodeFromAI(body);

    return successResponse(episode, "AI Story Episode and Storyboard generated successfully");
  } catch (error) {
    console.error("Error generating story episode:", error);
    return errorResponse("Could not generate the story episode. Please try again.", 500);
  }
}
