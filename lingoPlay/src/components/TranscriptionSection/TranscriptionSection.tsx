import { useState } from "react";
import {
  apiService,
  type TranscriptionSegment,
} from "../../services/apiService";
import styles from "./TranscriptionSection.module.css";

interface TranscriptionSectionProps {
  videoId?: string;
  transcription: TranscriptionSegment[];
  summary: string;
  isTranscribing: boolean;
  onStartTranscription: () => void;
}

const TranscriptionSection = ({
  videoId,
  transcription,
  summary,
  isTranscribing,
  onStartTranscription,
}: TranscriptionSectionProps) => {
  const [activeTab, setActiveTab] = useState<"transcription" | "summary">(
    "transcription"
  );
  const [error, setError] = useState<string | null>(null);

  const handleStartTranscription = async () => {
    if (!videoId) {
      setError("No video uploaded");
      return;
    }

    try {
      setError(null);
      onStartTranscription();

      // Start transcription process
      await apiService.startTranscription(videoId);

      console.log("Transcription started successfully");
    } catch (error) {
      console.error("Failed to start transcription:", error);
      setError(
        error instanceof Error ? error.message : "Failed to start transcription"
      );
    }
  };

  // Format transcription segments for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `[${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}]`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Transcription & Summary</h3>

      {!videoId && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📝</div>
          <p>Upload a video to see transcription and summary</p>
        </div>
      )}

      {videoId && (
        <>
          {/* Show start button if no transcription exists */}
          {!transcription.length && !isTranscribing && (
            <div className={styles.startSection}>
              <p>Video uploaded successfully! Ready to transcribe.</p>
              <button
                onClick={handleStartTranscription}
                className={styles.startButton}
              >
                Start Transcription
              </button>
            </div>
          )}

          {/* Show error message if any */}
          {error && (
            <div className={styles.errorMessage}>
              <p>❌ {error}</p>
            </div>
          )}

          {/* Show tabs and content when transcription exists or is in progress */}
          {(transcription.length > 0 || isTranscribing || summary) && (
            <>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${
                    activeTab === "transcription" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("transcription")}
                >
                  Transcription
                  {isTranscribing && (
                    <span className={styles.loadingIndicator}>⏳</span>
                  )}
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "summary" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("summary")}
                >
                  Summary
                  {isTranscribing && (
                    <span className={styles.loadingIndicator}>⏳</span>
                  )}
                </button>
              </div>

              <div className={styles.content}>
                {activeTab === "transcription" && (
                  <div className={styles.transcriptionContent}>
                    {isTranscribing ? (
                      <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>
                          Transcribing audio... This may take a few minutes.
                        </p>
                      </div>
                    ) : transcription.length > 0 ? (
                      <div className={styles.transcriptionText}>
                        {transcription.map((segment, index) => (
                          <p key={index} className={styles.transcriptionLine}>
                            <span className={styles.timestamp}>
                              {formatTime(segment.startTime)}
                            </span>
                            {segment.text}
                            <span className={styles.confidence}>
                              ({Math.round(segment.confidence * 100)}%)
                            </span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noContent}>
                        No transcription available
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "summary" && (
                  <div className={styles.summaryContent}>
                    {isTranscribing ? (
                      <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Generating summary...</p>
                      </div>
                    ) : summary ? (
                      <div className={styles.summaryText}>
                        {summary.split("\n").map((line, index) => (
                          <p key={index} className={styles.summaryLine}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noContent}>No summary available</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export { TranscriptionSection };
export type { TranscriptionSectionProps };
