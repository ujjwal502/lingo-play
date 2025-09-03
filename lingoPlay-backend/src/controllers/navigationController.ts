import { Request, Response } from "express";
import { NavigationResponse } from "../types";
import { transcriptionStore } from "./transcriptionController";

export const navigateToTimestamp = async (req: Request, res: Response) => {
  try {
    const { timestamp } = req.body;

    if (typeof timestamp !== "number" || timestamp < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid timestamp in seconds is required",
      });
    }

    const response: NavigationResponse = {
      success: true,
      timestamp,
      message: `Navigate to ${timestamp} seconds`,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error navigating to timestamp:", error);
    return res.status(500).json({
      success: false,
      timestamp: 0,
      message: "Failed to navigate to timestamp",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

export const navigateToPhrase = async (req: Request, res: Response) => {
  try {
    const { videoId, phrase } = req.body;

    if (!videoId || !phrase) {
      return res.status(400).json({
        success: false,
        timestamp: 0,
        message: "Video ID and phrase are required",
      });
    }

    const transcriptionData = transcriptionStore.get(videoId);
    if (!transcriptionData) {
      return res.status(404).json({
        success: false,
        timestamp: 0,
        message: "No transcription found for this video",
      });
    }

    // Search phrase across word-level timings when available for precise timestamp
    const searchPhrase = phrase.toLowerCase().trim();
    const tokens = searchPhrase.split(/\s+/).filter(Boolean);

    let matchTimestamp: number | null = null;
    let matchedText = "";

    outer: for (const segment of transcriptionData.segments) {
      const segmentText = (segment.text || "").toLowerCase();

      // If we have word timings, attempt token sequence match
      if (
        segment.words &&
        Array.isArray(segment.words) &&
        segment.words.length
      ) {
        const wordTexts = segment.words.map((w: any) =>
          (w.text || "").toLowerCase()
        );
        for (let i = 0; i <= wordTexts.length - tokens.length; i++) {
          let ok = true;
          for (let j = 0; j < tokens.length; j++) {
            if (wordTexts[i + j] !== tokens[j]) {
              ok = false;
              break;
            }
          }
          if (ok) {
            matchTimestamp = segment.words[i].startTime;
            matchedText = segment.words
              .slice(i, i + tokens.length)
              .map((w: any) => w.text)
              .join(" ");
            break outer;
          }
        }
      }

      // Fallback: substring match at segment level
      if (segmentText.includes(searchPhrase)) {
        matchTimestamp = segment.startTime;
        matchedText = segment.text;
        break;
      }
    }

    if (matchTimestamp === null) {
      return res.status(404).json({
        success: false,
        timestamp: 0,
        message: `Phrase "${phrase}" not found in transcription`,
      });
    }

    const response: NavigationResponse = {
      success: true,
      timestamp: matchTimestamp,
      message: `Found "${phrase}" at ${matchTimestamp.toFixed(1)} seconds`,
      matchedText: matchedText || undefined,
    };

    console.log(
      `Phrase search: "${phrase}" found at ${matchTimestamp.toFixed(
        3
      )}s in video ${videoId}`
    );
    return res.json(response);
  } catch (error) {
    console.error("Error navigating to phrase:", error);
    return res.status(500).json({
      success: false,
      timestamp: 0,
      message: "Failed to search for phrase",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};
