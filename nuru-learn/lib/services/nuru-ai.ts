/**
 * Nuru AI Service Integration for Learning Platform
 * Provides real-time multimodal AI capabilities
 */

import { useEffect, useState } from "react";
import type { Language, Subject } from "@/lib/types/education";

// Nuru AI Configuration
const NURU_AI_BASE_URL =
  process.env.NEXT_PUBLIC_NURU_AI_URL || "http://18.206.91.76:8000";

// Core API Types
export interface NuruChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface NuruChatRequest {
  message: string;
  history?: NuruChatMessage[];
  context?: string;
  stream?: boolean;
  language?: Language;
  response_format?: "text" | "audio" | "both";
}

export interface NuruChatResponse {
  response: string;
  text: string;
  audio_base64?: string;
  history: NuruChatMessage[];
  context?: string;
  detected_language?: string;
  processing_time?: number;
  usage?: {
    tokens: number;
    cost: number;
  };
  model_info?: {
    phi?: string;
    whisper?: string;
    tts?: string;
  };
}

export interface NuruProcessRequest {
  text?: string;
  image?: File | Blob | string; // base64, File, or Blob
  audio?: File | Blob | string; // base64, File, or Blob
  mode: "text" | "image" | "audio" | "multimodal";
  language?: Language;
  task?: string;
  response_format?: "text" | "audio" | "both";
}

export interface NuruProcessResponse {
  success: boolean;
  result: string;
  text: string;
  transcription?: string;
  analysis?: any;
  confidence?: number;
  language?: string;
  detected_language?: string;
  audio_base64?: string;
  response_format: string;
  processing_time: number;
  model_info?: object;
}

export interface NuruTranscriptionRequest {
  audio: File | Blob | string; // base64, File, or Blob
  language?: Language;
  format?: "wav" | "mp3" | "ogg";
}

export interface NuruTranscriptionResponse {
  success: boolean;
  text: string;
  transcription: string;
  confidence: number;
  language: string;
  detected_language: string;
  duration: number;
  processing_time: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

export interface NuruTTSRequest {
  text: string;
  language?: Language;
  voice?: string;
  speed?: number;
  format?: "wav" | "mp3";
}

export interface NuruTTSResponse {
  audio: string; // base64
  format: string;
  duration: number;
}

export interface NuruTranslationRequest {
  text: string;
  source_language?: "en" | "kpe";
  target_language: "en" | "kpe";
  context?: string;
  include_pronunciation?: boolean;
}

export interface NuruTranslationResponse {
  translated_text: string;
  translation: string;
  pronunciation?: string;
  source_language: string;
  target_language: string;
  confidence: number;
  alternatives?: string[];
}

export interface NuruHealthResponse {
  status: "healthy" | "ok" | "unhealthy" | "error";
  version?: string;
  uptime?: number;
  kpelleReady: boolean;
  modelsLoaded: boolean;
  capabilities: string[];
  services?: {
    [key: string]: boolean;
  };
}

// Educational-specific types
export interface LessonGenerationRequest {
  subject: Subject;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: Language;
  duration_minutes?: number;
  learning_objectives?: string[];
  level?: "beginner" | "intermediate" | "advanced";
}

export interface LessonContent {
  title: string;
  description: string;
  content: string;
  activities: Array<{
    type:
      | "reading"
      | "listening"
      | "speaking"
      | "writing"
      | "quiz"
      | "practice";
    content: string;
    description: string;
    instructions: string;
    difficulty: number;
    expected_answer?: string;
  }>;
  vocabulary?: Array<{
    term: string;
    definition: string;
    pronunciation?: string;
  }>;
  cultural_notes?: string[];
  culturalContext?: string;
}

export interface PerformanceAnalysisRequest {
  user_responses: Array<{
    question: string;
    user_answer: string;
    correct_answer: string;
    response_time: number;
  }>;
  subject: Subject;
  difficulty: string;
  studentResponse?: string;
  expectedAnswer?: string;
  language?: Language;
}

export interface PerformanceAnalysis {
  overall_score: number;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestions: string[];
  next_steps: string[];
  difficulty_adjustment: "maintain" | "increase" | "decrease";
  culturalNotes?: string[];
}

// Story generation interfaces
export interface StoryGenerationRequest {
  theme: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  length: "short" | "medium" | "long";
  culturalElements?: string[];
  targetVocabulary?: string[];
  moralLesson?: string;
  characters?: string[];
  setting?: string;
  language: Language;
}

export interface GeneratedStory {
  id: string;
  title: string;
  titleKpelle: string;
  content: string;
  contentKpelle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // estimated reading time in minutes
  vocabulary: Array<{
    kpelle: string;
    english: string;
    definition: string;
    pronunciation?: string;
  }>;
  culturalContext: string[];
  moralLesson?: string;
  characters: string[];
  setting: string;
  audioUrl?: string; // URL for TTS audio
}

export interface StoryTTSRequest {
  story: GeneratedStory;
  voice?: string;
  speed?: number;
  language: Language;
}

interface NuruConfig {
  baseURL: string;
  timeout: number;
  enableStreaming: boolean;
}

/**
 * Nuru AI Service Class
 * Handles all interactions with the Nuru AI API
 */
export class NuruAIService {
  private static instance: NuruAIService;
  private config: NuruConfig;
  private isHealthy: boolean = false;
  private isConnected: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds
  private healthCheckTimer?: NodeJS.Timeout;

  private constructor(config: Partial<NuruConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || NURU_AI_BASE_URL,
      timeout: config.timeout || 30000,
      enableStreaming: config.enableStreaming || true,
      ...config,
    };
  }

  public static getInstance(config?: Partial<NuruConfig>): NuruAIService {
    if (!NuruAIService.instance) {
      NuruAIService.instance = new NuruAIService(config);
    }
    return NuruAIService.instance;
  }

  /**
   * Initialize connection and start health monitoring
   */
  public async initialize(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      this.isConnected = health.status === "healthy" || health.status === "ok";
      this.isHealthy = this.isConnected;

      if (this.isConnected) {
        // Start periodic health checks
        this.healthCheckTimer = setInterval(() => {
          this.checkHealth().catch(console.error);
        }, this.healthCheckInterval);
      }

      return this.isConnected;
    } catch (error) {
      console.error("Failed to initialize Nuru AI service:", error);
      this.isConnected = false;
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }

  /**
   * Health check for Nuru AI service
   */
  public async checkHealth(): Promise<NuruHealthResponse> {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();

      // Check Kpelle capabilities
      let kpelleReady = false;
      try {
        const kpelleResponse = await fetch(
          `${this.config.baseURL}/api/kpelle/info`
        );
        if (kpelleResponse.ok) {
          const kpelleInfo = await kpelleResponse.json();
          kpelleReady = kpelleInfo.status === "available";
        }
      } catch {
        // Kpelle not available
      }

      const healthData: NuruHealthResponse = {
        status: result.status === "ok" ? "healthy" : result.status || "healthy",
        version: result.version,
        uptime: result.uptime,
        kpelleReady,
        modelsLoaded: true,
        capabilities: [
          "chat",
          "transcription",
          "tts",
          "multimodal",
          "streaming",
          ...(kpelleReady ? ["kpelle-translation"] : []),
        ],
        services: result.services,
      };

      this.isHealthy = healthData.status === "healthy";
      this.isConnected = this.isHealthy;
      this.lastHealthCheck = Date.now();

      return healthData;
    } catch (error) {
      console.error("Nuru AI health check failed:", error);
      this.isHealthy = false;
      this.isConnected = false;
      return {
        status: "error",
        kpelleReady: false,
        modelsLoaded: false,
        capabilities: [],
      };
    }
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): boolean {
    // Check if we need a fresh health check
    if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {
      this.checkHealth();
    }
    return this.isHealthy;
  }

  /**
   * Get connection status
   */
  public isConnectedToNuru(): boolean {
    return this.isConnected;
  }

  /**
   * Get comprehensive service status for UI components
   */
  public async getStatus(): Promise<{
    isHealthy: boolean;
    isConnected: boolean;
    kpelleReady: boolean;
    capabilities: string[];
    version?: string;
    uptime?: number;
  }> {
    try {
      const health = await this.checkHealth();
      return {
        isHealthy: health.status === "healthy" || health.status === "ok",
        isConnected: this.isConnected,
        kpelleReady: health.kpelleReady,
        capabilities: health.capabilities,
        version: health.version,
        uptime: health.uptime,
      };
    } catch (error) {
      console.error("Failed to get Nuru AI status:", error);
      return {
        isHealthy: false,
        isConnected: false,
        kpelleReady: false,
        capabilities: [],
      };
    }
  }

  /**
   * Get service configuration
   */
  public getConfig(): NuruConfig {
    return { ...this.config };
  }

  /**
   * Chat with Nuru AI
   */
  public async chat(request: NuruChatRequest): Promise<NuruChatResponse> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      // Transform the request to match API expectations
      const apiRequest = {
        text: request.message,
        ...request,
        message: undefined,
      };

      console.log(
        "📤 Sending chat request to API:",
        JSON.stringify(apiRequest, null, 2)
      );

      // Use a longer timeout for chat requests, especially for content generation
      const timeoutMs =
        request.context === "lesson_content_generation"
          ? 90000
          : this.config.timeout;

      const response = await fetch(`${this.config.baseURL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequest),
        signal: AbortSignal.timeout(timeoutMs), // Dynamic timeout based on request type
      });

      console.log(
        "📡 API Response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error(
            "AI service timeout - the request is taking longer than expected"
          );
        }
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📥 Raw API response:", JSON.stringify(result, null, 2));

      // Normalize response format
      const normalizedResponse = {
        response: result.response || result.text || "",
        text: result.text || result.response || "",
        audio_base64: result.audio_base64,
        history: result.history || [],
        context: result.context,
        detected_language: result.detected_language,
        processing_time: result.processing_time,
        usage: result.usage,
        model_info: result.model_info,
      };

      console.log(
        "🔄 Normalized response:",
        JSON.stringify(normalizedResponse, null, 2)
      );

      return normalizedResponse;
    } catch (error) {
      console.error("Nuru AI chat error:", error);

      // Handle specific error types
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(
          "Request timeout - AI service is taking too long to respond"
        );
      }

      if (error instanceof Error && error.message?.includes("timeout")) {
        throw new Error("AI service timeout - please try again");
      }

      throw error;
    }
  }

  /**
   * Process multimodal content
   */
  public async process(
    request: NuruProcessRequest
  ): Promise<NuruProcessResponse> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      const formData = new FormData();

      if (request.text) {
        formData.append("text", request.text);
      }

      if (request.image) {
        if (request.image instanceof File) {
          formData.append("image", request.image);
        } else {
          formData.append("image", request.image);
        }
      }

      if (request.audio) {
        if (request.audio instanceof File || request.audio instanceof Blob) {
          formData.append("audio", request.audio);
        } else {
          formData.append("audio", request.audio);
        }
      }

      formData.append("mode", request.mode);
      if (request.language) formData.append("language", request.language);
      if (request.task) formData.append("task", request.task);
      if (request.response_format)
        formData.append("response_format", request.response_format);

      const response = await fetch(`${this.config.baseURL}/api/process`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Process request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response format
      return {
        success: result.success !== false,
        result: result.result || result.text || "",
        text: result.text || result.result || "",
        transcription: result.transcription,
        analysis: result.analysis,
        confidence: result.confidence,
        language: result.language,
        detected_language: result.detected_language,
        audio_base64: result.audio_base64,
        response_format: result.response_format || "text",
        processing_time: result.processing_time || 0,
        model_info: result.model_info,
      };
    } catch (error) {
      console.error("Nuru AI process error:", error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text
   */
  public async transcribe(
    request: NuruTranscriptionRequest
  ): Promise<NuruTranscriptionResponse> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      const formData = new FormData();

      if (request.audio instanceof File) {
        formData.append("audio", request.audio);
      } else {
        formData.append("audio", request.audio);
      }

      if (request.language) formData.append("language", request.language);
      if (request.format) formData.append("format", request.format);

      const response = await fetch(`${this.config.baseURL}/api/transcribe`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Transcription request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response format
      return {
        success: result.success !== false,
        text: result.text || result.transcription || "",
        transcription: result.transcription || result.text || "",
        confidence: result.confidence || 0,
        language: result.language || result.detected_language || "unknown",
        detected_language:
          result.detected_language || result.language || "unknown",
        duration: result.duration || 0,
        processing_time: result.processing_time || 0,
        segments: result.segments,
      };
    } catch (error) {
      console.error("Nuru AI transcription error:", error);
      throw error;
    }
  }

  /**
   * Synthesize speech from text
   */
  public async synthesizeSpeech(
    request: NuruTTSRequest
  ): Promise<NuruTTSResponse | Blob> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      const formData = new FormData();
      formData.append("text", request.text);
      if (request.language) formData.append("language", request.language);
      if (request.voice) formData.append("voice", request.voice);
      if (request.speed) formData.append("speed", request.speed.toString());
      if (request.format) formData.append("format", request.format);

      const response = await fetch(
        `${this.config.baseURL}/api/synthesize-speech`,
        {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        // JSON response with base64 audio
        return (await response.json()) as NuruTTSResponse;
      } else {
        // Direct audio blob response
        return await response.blob();
      }
    } catch (error) {
      console.error("Nuru AI TTS error:", error);
      throw error;
    }
  }

  /**
   * Text-to-Speech with improved speaker configuration
   */
  public async textToSpeech(
    text: string,
    language: "en" | "kpe" = "en",
    speaker?: string
  ): Promise<NuruTTSResponse | Blob> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      console.log("🔊 TTS Request:", { text, language, speaker });

      const formData = new FormData();
      formData.append("text", text);
      formData.append("language", language);

      // Add speaker configuration for XTTS-v2 model
      if (speaker) {
        formData.append("speaker", speaker);
      } else {
        // Default speakers for different languages
        const defaultSpeakers = {
          en: "Claribel Dervla", // English speaker
          kpe: "Claribel Dervla", // Fallback for Kpelle
        };
        formData.append("speaker", defaultSpeakers[language]);
      }

      // Specify audio format to avoid format issues
      formData.append("format", "wav");

      const response = await fetch(`${this.config.baseURL}/api/tts`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚫 TTS Error Response:", errorText);
        throw new Error(
          `TTS request failed: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      console.log("🎵 TTS Response Content-Type:", contentType);

      if (contentType?.includes("application/json")) {
        // JSON response with base64 audio
        const result = await response.json();
        console.log("🎵 TTS JSON Response received");
        return result as NuruTTSResponse;
      } else if (contentType?.includes("audio/")) {
        // Direct audio blob response
        const audioBlob = await response.blob();
        console.log("🎵 TTS Audio Blob received:", audioBlob.size, "bytes");
        return audioBlob;
      } else {
        throw new Error(`Unexpected TTS response content type: ${contentType}`);
      }
    } catch (error) {
      console.error("🚫 Nuru AI TTS error:", error);
      throw error;
    }
  }

  /**
   * Translate text to/from Kpelle
   */
  public async translateToKpelle(
    request: NuruTranslationRequest
  ): Promise<NuruTranslationResponse> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      const formData = new FormData();
      formData.append("text", request.text);
      formData.append("source_language", request.source_language || "en");
      formData.append("target_language", request.target_language);
      if (request.context) formData.append("context", request.context);
      if (request.include_pronunciation !== undefined) {
        formData.append(
          "include_pronunciation",
          request.include_pronunciation.toString()
        );
      }

      const response = await fetch(
        `${this.config.baseURL}/api/translate/kpelle`,
        {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response format
      return {
        translated_text: result.translated_text || result.translation || "",
        translation: result.translation || result.translated_text || "",
        pronunciation: result.pronunciation,
        source_language:
          result.source_language || request.source_language || "en",
        target_language: result.target_language || request.target_language,
        confidence: result.confidence || 0,
        alternatives: result.alternatives,
      };
    } catch (error) {
      console.error("Nuru AI translation error:", error);
      throw error;
    }
  }

  /**
   * Stream chat responses
   */
  public async streamChat(
    request: NuruChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: NuruChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      const streamRequest = { ...request, stream: true };

      const response = await fetch(`${this.config.baseURL}/api/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(streamRequest),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullResponse += data.chunk;
                onChunk(data.chunk);
              } else if (data.complete) {
                onComplete({
                  response: fullResponse,
                  text: fullResponse,
                  history: data.history || [],
                  context: data.context,
                  usage: data.usage,
                });
                return;
              }
            } catch (parseError) {
              console.warn("Failed to parse stream chunk:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Nuru AI stream error:", error);
      onError(error as Error);
    }
  }

  /**
   * Generate lesson content using AI
   */
  public async generateLessonContent(
    request: LessonGenerationRequest
  ): Promise<LessonContent> {
    try {
      const chatRequest: NuruChatRequest = {
        message: `Generate a comprehensive lesson for ${
          request.subject
        } on the topic "${request.topic}" 
               for ${request.difficulty} level students in ${request.language}. 
               ${
                 request.duration_minutes
                   ? `The lesson should be approximately ${request.duration_minutes} minutes long.`
                   : ""
               }
               ${
                 request.learning_objectives
                   ? `Learning objectives: ${request.learning_objectives.join(
                       ", "
                     )}`
                   : ""
               }
               ${
                 request.language === "kpe"
                   ? "Include Kpelle cultural context where relevant."
                   : ""
               }
               
               Please respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
               {
                 "title": "Brief lesson title",
                 "description": "A clear description of what this lesson covers",
                 "content": "The main lesson content that students will read and learn from. This should be educational text content, not JSON.",
                 "activities": [
                   {
                     "type": "reading",
                     "content": "What students should read or review",
                     "description": "Brief description of this activity",
                     "instructions": "Clear instructions for the student",
                     "difficulty": 1,
                     "expected_answer": "What response is expected if applicable"
                   }
                 ],
                 "vocabulary": [
                   {
                     "term": "Kpelle word",
                     "definition": "English meaning",
                     "pronunciation": "How to pronounce it"
                   }
                 ],
                 "cultural_notes": ["Important cultural context", "Respectful usage"],
                 "culturalContext": "Brief cultural background for this lesson"
               }`,
        context: "educational_content_generation",
        language: request.language,
      };

      console.log(
        "🚀 Lesson Generation Request:",
        JSON.stringify(chatRequest, null, 2)
      );

      const response = await this.chat(chatRequest);

      console.log("🤖 Raw AI Response:", response);
      console.log("📝 Response Text:", response.response);
      console.log("📊 Response Length:", response.response?.length);

      try {
        // Try to parse the response as JSON
        console.log("🔍 Attempting to parse JSON...");
        let lessonContent;

        // First, clean the response text
        let cleanedResponse = response.response.trim();

        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith("```json")) {
          console.log("🔧 Removing markdown wrapper...");
          cleanedResponse = cleanedResponse
            .replace(/^```json\s*/i, "")
            .replace(/\s*```$/, "");
        } else if (cleanedResponse.startsWith("```")) {
          console.log("🔧 Removing generic markdown wrapper...");
          cleanedResponse = cleanedResponse
            .replace(/^```\s*/, "")
            .replace(/\s*```$/, "");
        }

        // Try direct JSON parsing on cleaned response
        try {
          lessonContent = JSON.parse(cleanedResponse);
          console.log("✅ Successfully parsed cleaned JSON!");
        } catch (directParseError) {
          console.log(
            "🔧 Direct parsing failed, trying to extract and repair JSON from text..."
          );

          // Try to extract JSON from the response text
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            let jsonText = jsonMatch[0];
            console.log(
              "📦 Found JSON block:",
              jsonText.substring(0, 200) + "..."
            );

            // Try to repair truncated JSON
            try {
              lessonContent = JSON.parse(jsonText);
            } catch (repairError) {
              console.log("🔧 JSON appears truncated, attempting to repair...");
              const repairedJsonString = this.repairTruncatedJSON(
                jsonText,
                request
              );
              if (repairedJsonString) {
                lessonContent = JSON.parse(repairedJsonString);
              } else {
                throw new Error("Could not repair truncated JSON");
              }
            }
          } else {
            throw new Error("No JSON structure found in response");
          }
        }

        console.log(
          "✅ Successfully parsed lesson content:",
          JSON.stringify(lessonContent, null, 2)
        );

        // Ensure the lesson content has the required structure
        if (lessonContent && typeof lessonContent === "object") {
          return {
            title:
              lessonContent.title || `${request.subject}: ${request.topic}`,
            description:
              lessonContent.description ||
              `A ${request.difficulty} level lesson on ${request.topic}`,
            content:
              lessonContent.content || "Lesson content will be displayed here.",
            activities: Array.isArray(lessonContent.activities)
              ? lessonContent.activities
              : [
                  {
                    type: "reading" as const,
                    content:
                      lessonContent.content ||
                      "Read through the lesson material.",
                    description: "Read and understand the main concepts",
                    instructions:
                      "Read through the lesson content and take notes on key concepts.",
                    difficulty:
                      request.difficulty === "beginner"
                        ? 1
                        : request.difficulty === "intermediate"
                        ? 2
                        : 3,
                  },
                ],
            vocabulary: lessonContent.vocabulary || [],
            cultural_notes: lessonContent.cultural_notes || [],
            culturalContext:
              lessonContent.culturalContext ||
              (request.language === "kpe"
                ? "Content adapted for Kpelle cultural context"
                : undefined),
          };
        } else {
          throw new Error("Invalid lesson content structure");
        }
      } catch (parseError) {
        console.warn("❌ JSON parsing failed:", parseError);
        console.log("🔧 Creating fallback structured response...");

        // If parsing fails, create a structured response from the text
        const fallbackContent = {
          title: `${request.subject}: ${request.topic}`,
          description: `A ${request.difficulty} level lesson on ${request.topic}`,
          content:
            "This lesson will teach you the basics of " +
            request.topic +
            ". Please review the cultural context and vocabulary provided.",
          activities: [
            {
              type: "reading" as const,
              content:
                "Review the lesson materials and cultural context provided.",
              description: "Read and understand the main concepts",
              instructions:
                "Read through the lesson content and take notes on key concepts.",
              difficulty:
                request.difficulty === "beginner"
                  ? 1
                  : request.difficulty === "intermediate"
                  ? 2
                  : 3,
            },
            {
              type: "practice" as const,
              content: "Practice the vocabulary words and their meanings.",
              description: "Learn key vocabulary",
              instructions:
                "Study the vocabulary words and practice their pronunciation.",
              difficulty:
                request.difficulty === "beginner"
                  ? 1
                  : request.difficulty === "intermediate"
                  ? 2
                  : 3,
            },
          ],
          vocabulary: [
            {
              term: "Kollie",
              definition: "Hello/Peace",
              pronunciation: "KOH-lee",
            },
            {
              term: "Kwa kii",
              definition: "Good morning",
              pronunciation: "kwah KEE",
            },
            {
              term: "Kwa kelee",
              definition: "Good evening",
              pronunciation: "kwah KEH-lee",
            },
          ],
          cultural_notes: [
            "Greetings are important in Kpelle culture",
            "They express respect and community bonds",
          ],
          culturalContext:
            request.language === "kpe"
              ? "Content adapted for Kpelle cultural context"
              : undefined,
        };

        console.log(
          "📋 Fallback lesson content:",
          JSON.stringify(fallbackContent, null, 2)
        );
        return fallbackContent;
      }
    } catch (error) {
      console.error("Lesson generation error:", error);
      throw error;
    }
  }

  /**
   * Repair truncated JSON responses
   */
  private repairTruncatedJSON(
    jsonText: string,
    request?: LessonGenerationRequest
  ): string | null {
    try {
      console.log("🛠️ Attempting to repair truncated JSON...");
      console.log("📏 JSON text length:", jsonText.length);
      console.log("🔍 Last 100 characters:", jsonText.slice(-100));

      // Count opening and closing braces to understand structure
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;

      console.log("📊 Structure analysis:", {
        openBraces,
        closeBraces,
        openBrackets,
        closeBrackets,
      });

      // Try to complete the JSON structure
      let repairedJson = jsonText.trim();

      // Remove any trailing commas that might break JSON
      repairedJson = repairedJson.replace(/,(\s*[}\]])/g, "$1");

      // If we're in the middle of a string, try to close it
      if (repairedJson.match(/"[^"]*$/)) {
        console.log("🔧 Detected unclosed string, adding closing quote");
        repairedJson += '"';
      }

      // If we're in an array, close it
      if (openBrackets > closeBrackets) {
        const missingCloseBrackets = openBrackets - closeBrackets;
        console.log(
          `🔧 Adding ${missingCloseBrackets} missing closing brackets`
        );
        repairedJson += "]".repeat(missingCloseBrackets);
      }

      // If we're in an object, close it
      if (openBraces > closeBraces) {
        const missingCloseBraces = openBraces - closeBraces;
        console.log(`🔧 Adding ${missingCloseBraces} missing closing braces`);
        repairedJson += "}".repeat(missingCloseBraces);
      }

      console.log("🔧 Repaired JSON attempt:", repairedJson);

      // Test if the repaired JSON is valid
      try {
        JSON.parse(repairedJson);
        console.log("✅ Successfully repaired JSON!");
        return repairedJson;
      } catch (parseError) {
        console.log("❌ Repair attempt failed");
        return null;
      }
    } catch (error) {
      console.error("🚨 JSON repair failed completely:", error);
      return null;
    }
  }

  /**
   * Analyze student performance and provide recommendations
   */
  public async analyzePerformance(
    request: PerformanceAnalysisRequest
  ): Promise<PerformanceAnalysis> {
    try {
      let chatMessage = "";

      if (request.user_responses && request.user_responses.length > 0) {
        chatMessage = `Analyze the following student performance data for ${
          request.subject
        } at ${request.difficulty} level:
                     
                     Student Responses:
                     ${request.user_responses
                       .map(
                         (resp, index) => `
                     ${index + 1}. Question: ${resp.question}
                        Student Answer: ${resp.user_answer}
                        Correct Answer: ${resp.correct_answer}
                        Response Time: ${resp.response_time}ms
                     `
                       )
                       .join("\n")}`;
      } else if (request.studentResponse && request.expectedAnswer) {
        chatMessage = `Analyze this student response for ${request.subject}:
                      Expected: "${request.expectedAnswer}"
                      Student answered: "${request.studentResponse}"`;
      }

      chatMessage += `
                     
                     Please provide analysis in JSON format:
                     {
                       "overall_score": 0-100,
                       "score": 0-100,
                       "feedback": "constructive feedback",
                       "strengths": ["strength1", "strength2"],
                       "weaknesses": ["weakness1", "weakness2"],
                       "recommendations": ["recommendation1", "recommendation2"],
                       "suggestions": ["suggestion1", "suggestion2"],
                       "next_steps": ["step1", "step2"],
                       "difficulty_adjustment": "maintain|increase|decrease"
                       ${
                         request.language === "kpe"
                           ? ',"culturalNotes": ["cultural note if applicable"]'
                           : ""
                       }
                     }`;

      const chatRequest: NuruChatRequest = {
        message: chatMessage,
        context: "performance_analysis",
        language: request.language,
      };

      const response = await this.chat(chatRequest);

      try {
        const analysis = JSON.parse(response.response);
        // Ensure both score fields are present
        analysis.score = analysis.score || analysis.overall_score;
        analysis.overall_score = analysis.overall_score || analysis.score;
        return analysis;
      } catch (parseError) {
        // Fallback analysis if parsing fails
        let score = 50; // Default score

        if (request.user_responses && request.user_responses.length > 0) {
          const correctAnswers = request.user_responses.filter(
            (resp) =>
              resp.user_answer.toLowerCase().trim() ===
              resp.correct_answer.toLowerCase().trim()
          ).length;
          score = (correctAnswers / request.user_responses.length) * 100;
        }

        return {
          overall_score: Math.round(score),
          score: Math.round(score),
          feedback: response.response,
          strengths: score > 70 ? ["Good understanding of concepts"] : [],
          weaknesses: score < 70 ? ["Needs more practice"] : [],
          recommendations: [
            score < 50 ? "Review fundamental concepts" : "Continue practicing",
            "Focus on areas with incorrect answers",
          ],
          suggestions: ["Review the key concepts", "Practice similar problems"],
          next_steps: ["Practice more exercises", "Review lesson materials"],
          difficulty_adjustment:
            score > 80 ? "increase" : score < 50 ? "decrease" : "maintain",
          culturalNotes:
            request.language === "kpe" ? ["Cultural context note"] : undefined,
        };
      }
    } catch (error) {
      console.error("Performance analysis error:", error);
      throw error;
    }
  }

  /**
   * Get cultural context for Kpelle language learning
   */
  public async getKpelleCulturalContext(topic: string): Promise<string> {
    try {
      const response = await this.chat({
        message: `Provide cultural context about the Kpelle people of Liberia related to "${topic}". 
                 Include historical background, traditions, and cultural significance that would help 
                 language learners understand the context better.`,
        context: "kpelle_cultural_education",
        language: "kpe",
      });

      return response.response;
    } catch (error) {
      console.error("Cultural context error:", error);
      return `Cultural context for "${topic}" is not available at the moment.`;
    }
  }

  /**
   * Generate practice exercises
   */
  public async generatePracticeExercises(
    subject: Subject,
    difficulty: string,
    count: number = 5
  ): Promise<
    Array<{
      question: string;
      options?: string[];
      correct_answer: string;
      explanation: string;
      type: "multiple_choice" | "fill_blank" | "true_false" | "short_answer";
    }>
  > {
    try {
      const response = await this.chat({
        message: `Generate ${count} practice exercises for ${subject} at ${difficulty} level.
                 Return as JSON array with format:
                 [
                   {
                     "question": "question text",
                     "options": ["option1", "option2", "option3", "option4"], // only for multiple choice
                     "correct_answer": "correct answer",
                     "explanation": "why this is correct",
                     "type": "multiple_choice|fill_blank|true_false|short_answer"
                   }
                 ]`,
        context: "practice_exercise_generation",
      });

      try {
        return JSON.parse(response.response);
      } catch (parseError) {
        // Fallback exercises if parsing fails
        return Array.from({ length: count }, (_, i) => ({
          question: `Practice question ${i + 1} for ${subject}`,
          correct_answer: "Sample answer",
          explanation: "This is a sample explanation.",
          type: "short_answer" as const,
        }));
      }
    } catch (error) {
      console.error("Practice exercise generation error:", error);
      throw error;
    }
  }

  /**
   * Generate culturally-aware practice exercises for Kpelle learning
   */
  public async generateKpellePracticeExercises(
    topic: string,
    difficulty: "beginner" | "intermediate" | "advanced",
    count: number = 5,
    includeAudio: boolean = false
  ): Promise<
    Array<{
      id: string;
      type:
        | "pronunciation"
        | "translation"
        | "listening"
        | "cultural"
        | "vocabulary";
      content: {
        text: string;
        kpelle?: string;
        english?: string;
        audio?: string;
        culturalNote?: string;
        targetPhrase?: string;
        sourceLanguage?: string;
        targetLanguage?: string;
        options?: string[];
        image?: string;
        instructions?: string;
      };
      expectedAnswer: string;
      points: number;
      timeLimit: number;
      culturalContext?: string;
    }>
  > {
    try {
      console.log("🎯 Generating Kpelle practice exercises:", {
        topic,
        difficulty,
        count,
      });

      const prompt = `Generate ${count} practice exercises for learning Kpelle language, focused on "${topic}" at ${difficulty} level.
      
      Create diverse exercise types:
      1. Pronunciation - practice saying Kpelle phrases with cultural context
      2. Translation - translate between Kpelle and English
      3. Vocabulary - learn important Kpelle words with cultural significance
      4. Cultural - understand when and how to use phrases appropriately
      5. Listening - recognize spoken Kpelle phrases (audio will be generated separately)
      
      Include authentic Kpelle cultural context and respectful communication patterns.
      
      Return ONLY a JSON array in this exact format:
      [
        {
          "type": "pronunciation|translation|vocabulary|cultural|listening",
          "content": {
            "text": "Exercise instruction in English",
            "kpelle": "Kpelle phrase if applicable", 
            "english": "English translation if applicable",
            "targetPhrase": "What they should say for pronunciation",
            "sourceLanguage": "kpelle|english",
            "targetLanguage": "english|kpelle",
            "options": ["option1", "option2", "option3", "option4"],
            "culturalNote": "Cultural context explanation",
            "instructions": "Specific instructions for this exercise"
          },
          "expectedAnswer": "correct answer",
          "points": 10,
          "timeLimit": 30,
          "culturalContext": "Why this is culturally important"
        }
      ]`;

      const response = await this.chat({
        message: prompt,
        context: "kpelle_practice_generation",
        language: "en",
      });

      console.log(
        "🔄 Raw AI Response for practice:",
        response.response.substring(0, 200) + "..."
      );

      let exercises;
      try {
        // Try to parse the response directly
        exercises = JSON.parse(response.response);
      } catch (parseError) {
        console.log("🔧 Attempting to repair JSON...");
        // Try to repair truncated JSON
        const repairedJSON = this.repairTruncatedJSON(response.response);
        if (repairedJSON) {
          exercises = JSON.parse(repairedJSON);
        } else {
          throw new Error("Could not repair JSON response");
        }
      }

      // Validate and enhance the exercises
      const enhancedExercises = exercises.map(
        (exercise: any, index: number) => ({
          id: `kpelle-ex-${Date.now()}-${index}`,
          type: exercise.type || "vocabulary",
          content: {
            text: exercise.content?.text || `Practice exercise ${index + 1}`,
            kpelle: exercise.content?.kpelle,
            english: exercise.content?.english,
            targetPhrase: exercise.content?.targetPhrase,
            sourceLanguage: exercise.content?.sourceLanguage || "kpelle",
            targetLanguage: exercise.content?.targetLanguage || "english",
            options: exercise.content?.options || [],
            culturalNote: exercise.content?.culturalNote,
            instructions: exercise.content?.instructions,
            // Add audio placeholder for pronunciation exercises
            audio:
              exercise.type === "pronunciation" && includeAudio
                ? `/audio/kpelle-${index + 1}.mp3`
                : undefined,
          },
          expectedAnswer: exercise.expectedAnswer || "Sample answer",
          points: exercise.points || 10,
          timeLimit: exercise.timeLimit || 30,
          culturalContext: exercise.culturalContext,
        })
      );

      console.log(
        "✅ Generated enhanced Kpelle exercises:",
        enhancedExercises.length
      );

      // If audio is requested, generate TTS for pronunciation exercises
      if (includeAudio) {
        for (const exercise of enhancedExercises) {
          if (exercise.type === "pronunciation" && exercise.content.kpelle) {
            try {
              const audioResult = await this.textToSpeech(
                exercise.content.kpelle,
                "kpe",
                "Claribel Dervla" // Default speaker for Kpelle
              );

              if (audioResult instanceof Blob) {
                // Convert blob to base64 for storage
                const reader = new FileReader();
                reader.onload = () => {
                  exercise.content.audio = reader.result as string;
                };
                reader.readAsDataURL(audioResult);
              } else if (audioResult.audio) {
                exercise.content.audio = `data:audio/wav;base64,${audioResult.audio}`;
              }
            } catch (audioError) {
              console.warn(
                "⚠️ Audio generation failed for exercise:",
                exercise.id,
                audioError
              );
              // Continue without audio
            }
          }
        }
      }

      return enhancedExercises;
    } catch (error) {
      console.error("🚫 Kpelle practice generation error:", error);

      // Return fallback exercises if AI generation fails
      return this.getFallbackKpelleExercises(topic, difficulty, count);
    }
  }

  /**
   * Get fallback Kpelle exercises when AI generation fails
   */
  private getFallbackKpelleExercises(
    topic: string,
    difficulty: string,
    count: number
  ): Array<any> {
    const fallbackExercises = [
      {
        id: `fallback-1`,
        type: "pronunciation",
        content: {
          text: 'Practice saying "Kwa kii" (Good morning)',
          kpelle: "Kwa kii",
          english: "Good morning",
          targetPhrase: "Kwa kii",
          culturalNote: "Used for respectful morning greetings",
          instructions: "Listen and repeat the pronunciation carefully",
        },
        expectedAnswer: "kwa kii",
        points: 10,
        timeLimit: 30,
        culturalContext: "Morning greetings are important in Kpelle culture",
      },
      {
        id: `fallback-2`,
        type: "translation",
        content: {
          text: 'Translate to English: "Nyuma"',
          kpelle: "Nyuma",
          sourceLanguage: "kpelle",
          targetLanguage: "english",
          culturalNote: "Expression of gratitude",
          instructions: "Type the English translation",
        },
        expectedAnswer: "thank you",
        points: 15,
        timeLimit: 20,
        culturalContext: "Gratitude expressions strengthen community bonds",
      },
      {
        id: `fallback-3`,
        type: "cultural",
        content: {
          text: 'When is "Kwa kelee" appropriately used?',
          options: ["Morning", "Afternoon", "Evening", "Night"],
          culturalNote: "Different greetings for different times",
          instructions: "Select the appropriate time",
        },
        expectedAnswer: "Evening",
        points: 10,
        timeLimit: 15,
        culturalContext: "Time-appropriate greetings show cultural awareness",
      },
    ];

    return fallbackExercises.slice(0, count).map((ex, index) => ({
      ...ex,
      id: `fallback-${index + 1}`,
    }));
  }

  /**
   * Generate a Kpelle story using Nuru AI
   */
  public async generateKpelleStory(
    request: StoryGenerationRequest
  ): Promise<GeneratedStory> {
    if (!this.isConnected) {
      return this.getFallbackStory(request);
    }

    try {
      const storyPrompt = this.buildStoryPrompt(request);

      const chatResponse = await this.chat({
        message: storyPrompt,
        language: request.language,
        context: `Story generation for Kpelle language learning. Theme: ${request.theme}, Difficulty: ${request.difficulty}`,
        response_format: "text",
      });

      return this.parseStoryResponse(chatResponse.text, request);
    } catch (error) {
      console.error("Failed to generate story with AI:", error);
      return this.getFallbackStory(request);
    }
  }

  /**
   * Generate TTS audio for a story
   */
  public async generateStoryAudio(
    story: GeneratedStory,
    language: Language = "kpe"
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Nuru AI service not connected");
    }

    try {
      // Generate audio for the Kpelle version of the story
      const ttsRequest: NuruTTSRequest = {
        text: story.contentKpelle || story.content,
        language: language,
        voice: "default",
        speed: 1.0,
        format: "mp3",
      };

      const audioResponse = await this.synthesizeSpeech(ttsRequest);

      if (audioResponse instanceof Blob) {
        // Convert blob to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioResponse);
        });
      } else {
        // NuruTTSResponse with base64 audio
        return audioResponse.audio;
      }
    } catch (error) {
      console.error("Failed to generate story audio:", error);
      throw error;
    }
  }

  /**
   * Build story generation prompt
   */
  private buildStoryPrompt(request: StoryGenerationRequest): string {
    const lengthMap = {
      short: "300-500 words",
      medium: "500-800 words",
      long: "800-1200 words",
    };

    let prompt = `Generate a ${
      request.difficulty
    } level Kpelle story for language learning.

Requirements:
- Theme: ${request.theme}
- Length: ${lengthMap[request.length]}
- Difficulty: ${request.difficulty}
- Include both Kpelle and English versions
- Include 8-12 vocabulary words with definitions
- Cultural context: ${
      request.culturalElements?.join(", ") || "traditional Kpelle values"
    }`;

    if (request.targetVocabulary?.length) {
      prompt += `\n- Include these vocabulary words: ${request.targetVocabulary.join(
        ", "
      )}`;
    }

    if (request.moralLesson) {
      prompt += `\n- Moral lesson: ${request.moralLesson}`;
    }

    if (request.characters?.length) {
      prompt += `\n- Characters: ${request.characters.join(", ")}`;
    }

    if (request.setting) {
      prompt += `\n- Setting: ${request.setting}`;
    }

    prompt += `

Format the response as JSON with this structure:
{
  "title": "English title",
  "titleKpelle": "Kpelle title", 
  "content": "English story content",
  "contentKpelle": "Kpelle story content",
  "vocabulary": [
    {
      "kpelle": "word",
      "english": "translation", 
      "definition": "detailed definition"
    }
  ],
  "culturalContext": ["cultural element 1", "cultural element 2"],
  "moralLesson": "lesson learned",
  "characters": ["character names"],
  "setting": "story setting"
}`;

    return prompt;
  }

  /**
   * Parse AI story response into structured format
   */
  private parseStoryResponse(
    response: string,
    request: StoryGenerationRequest
  ): GeneratedStory {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        id: `generated-${Date.now()}`,
        title: parsed.title || `Generated Story: ${request.theme}`,
        titleKpelle: parsed.titleKpelle || parsed.title || "Woli-kɛlɛɛ",
        content: parsed.content || "Story content not available",
        contentKpelle:
          parsed.contentKpelle || parsed.content || "Woli-kɛlɛɛ content",
        difficulty: request.difficulty,
        duration: this.estimateReadingTime(parsed.content || ""),
        vocabulary: parsed.vocabulary || [],
        culturalContext:
          parsed.culturalContext || request.culturalElements || [],
        moralLesson: parsed.moralLesson,
        characters: parsed.characters || [],
        setting: parsed.setting || "",
        audioUrl: undefined, // Will be set when TTS is generated
      };
    } catch (error) {
      console.error("Failed to parse story response:", error);
      return this.getFallbackStory(request);
    }
  }

  /**
   * Get fallback story when AI is unavailable
   */
  private getFallbackStory(request: StoryGenerationRequest): GeneratedStory {
    const fallbackStories = {
      wisdom: {
        title: "The Wise Spider",
        titleKpelle: "Kɛlɛɛ-Mɛni Kpɔlɔɔ",
        content:
          "Long ago, there lived a wise spider in the forest who taught all the animals important lessons about sharing and cooperation.",
        contentKpelle:
          "Kɛlɛɛ tɛɛŋ, kɛlɛɛ-mɛni kpɔlɔɔ kɛ to ɓa ɓoŋ la. A kɛ kaa-mɛni kɛlɛɛ tii wolo koo.",
        moralLesson: "Wisdom should be shared with everyone",
        characters: ["Spider", "Forest Animals"],
        setting: "Ancient Forest",
      },
      family: {
        title: "The Market Day",
        titleKpelle: "Kɔi-Ŋwɛɛ",
        content:
          "A young girl accompanies her mother to the market for the first time and learns about community and trade.",
        contentKpelle:
          "Kpaa-mɛni tɛɛ kɛ maa kɔi-tɛɛ pai loo kɛlɛɛ ŋwɛɛ a ma nɛɛ.",
        moralLesson: "Family bonds strengthen through shared experiences",
        characters: ["Young Girl", "Mother", "Market Vendors"],
        setting: "Village Market",
      },
    };

    const storyTemplate =
      fallbackStories[request.theme as keyof typeof fallbackStories] ||
      fallbackStories["wisdom"];

    return {
      id: `fallback-${Date.now()}`,
      ...storyTemplate,
      difficulty: request.difficulty,
      duration: this.estimateReadingTime(storyTemplate.content),
      vocabulary: [
        {
          kpelle: "kpɔlɔɔ",
          english: "wise/beautiful",
          definition: "Having good judgment and knowledge",
        },
        {
          kpelle: "kɛlɛɛ-mɛni",
          english: "spider",
          definition: "Small eight-legged creature, often wise in folklore",
        },
        {
          kpelle: "ɓoŋ",
          english: "forest",
          definition: "Large area covered with trees and plants",
        },
      ],
      culturalContext: [
        "traditional values",
        "community cooperation",
        "oral tradition",
      ],
      audioUrl: undefined,
    };
  }

  /**
   * Estimate reading time for story content
   */
  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

/**
 * React Hook for using Nuru AI service
 */
export function useNuruAI(config?: Partial<NuruConfig>) {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nuruAI = NuruAIService.getInstance(config);

  useEffect(() => {
    const initializeService = async () => {
      const initialized = await nuruAI.initialize();
      setIsHealthy(initialized);
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      nuruAI.destroy();
    };
  }, [nuruAI]);

  const executeWithLoading = async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nuruAI,
    isHealthy,
    isLoading,
    error,

    // Service status methods
    isConnected: nuruAI.isConnectedToNuru(),
    getConfig: () => nuruAI.getConfig(),

    // Wrapped methods with loading states
    chat: (request: NuruChatRequest) =>
      executeWithLoading(() => nuruAI.chat(request)),
    process: (request: NuruProcessRequest) =>
      executeWithLoading(() => nuruAI.process(request)),
    transcribe: (request: NuruTranscriptionRequest) =>
      executeWithLoading(() => nuruAI.transcribe(request)),
    synthesizeSpeech: (request: NuruTTSRequest) =>
      executeWithLoading(() => nuruAI.synthesizeSpeech(request)),
    translateToKpelle: (request: NuruTranslationRequest) =>
      executeWithLoading(() => nuruAI.translateToKpelle(request)),
    generateLessonContent: (request: LessonGenerationRequest) =>
      executeWithLoading(() => nuruAI.generateLessonContent(request)),
    analyzePerformance: (request: PerformanceAnalysisRequest) =>
      executeWithLoading(() => nuruAI.analyzePerformance(request)),
    getKpelleCulturalContext: (topic: string) =>
      executeWithLoading(() => nuruAI.getKpelleCulturalContext(topic)),
    generatePracticeExercises: (
      subject: Subject,
      difficulty: string,
      count?: number
    ) =>
      executeWithLoading(() =>
        nuruAI.generatePracticeExercises(subject, difficulty, count)
      ),

    // Story generation methods
    generateKpelleStory: (request: StoryGenerationRequest) =>
      executeWithLoading(() => nuruAI.generateKpelleStory(request)),
    generateStoryAudio: (story: GeneratedStory, language?: Language) =>
      executeWithLoading(() => nuruAI.generateStoryAudio(story, language)),

    // Utility methods
    checkHealth: () => executeWithLoading(() => nuruAI.checkHealth()),
    streamChat: nuruAI.streamChat.bind(nuruAI),

    // Additional convenience methods
    transcribeAudio: (audioBlob: Blob, language?: Language) =>
      executeWithLoading(() =>
        nuruAI.transcribe({ audio: audioBlob, language })
      ),

    processMultimodal: (input: {
      text?: string;
      audio?: Blob;
      image?: Blob;
      language?: Language;
      responseFormat?: "text" | "audio" | "both";
    }) =>
      executeWithLoading(() =>
        nuruAI.process({
          text: input.text,
          audio: input.audio,
          image: input.image,
          mode: "multimodal",
          language: input.language,
          response_format: input.responseFormat,
        })
      ),

    simpleChat: (
      text: string,
      language: Language = "en",
      responseFormat: "text" | "audio" | "both" = "both"
    ) =>
      executeWithLoading(() =>
        nuruAI.chat({
          message: text,
          language,
          response_format: responseFormat,
        })
      ),

    translateText: (
      text: string,
      sourceLanguage: "en" | "kpe" = "en",
      targetLanguage: "en" | "kpe" = "kpe",
      includePronunciation: boolean = true
    ) =>
      executeWithLoading(() =>
        nuruAI.translateToKpelle({
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          include_pronunciation: includePronunciation,
        })
      ),
  };
}

// Export singleton instance for direct usage
export const nuruAI = NuruAIService.getInstance();

// Convenience function to get the service instance
export function getNuruService(config?: Partial<NuruConfig>): NuruAIService {
  return NuruAIService.getInstance(config);
}

// Additional utility functions
export function createAudioBlob(
  base64Audio: string,
  format: string = "wav"
): Blob {
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: `audio/${format}` });
}

export function playAudioBlob(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);

    audio.onended = () => {
      URL.revokeObjectURL(audio.src);
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audio.src);
      reject(error);
    };

    audio.play().catch(reject);
  });
}

export function playBase64Audio(
  base64Audio: string,
  format: string = "wav"
): Promise<void> {
  const audioBlob = createAudioBlob(base64Audio, format);
  return playAudioBlob(audioBlob);
}

// Type guards
export function isNuruChatResponse(
  response: any
): response is NuruChatResponse {
  return (
    response &&
    (typeof response.response === "string" || typeof response.text === "string")
  );
}

export function isNuruProcessResponse(
  response: any
): response is NuruProcessResponse {
  return (
    response &&
    typeof response.success === "boolean" &&
    (typeof response.result === "string" || typeof response.text === "string")
  );
}

export function isNuruTranscriptionResponse(
  response: any
): response is NuruTranscriptionResponse {
  return (
    response &&
    typeof response.success === "boolean" &&
    (typeof response.text === "string" ||
      typeof response.transcription === "string")
  );
}

// Error handling utilities
export class NuruAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "NuruAIError";
  }
}

export function handleNuruError(error: any): NuruAIError {
  if (error instanceof NuruAIError) {
    return error;
  }

  if (error.name === "AbortError" || error.message.includes("timeout")) {
    return new NuruAIError(
      "Request timeout - Nuru AI service is taking too long to respond",
      "TIMEOUT"
    );
  }

  if (
    error.message.includes("not connected") ||
    error.message.includes("network")
  ) {
    return new NuruAIError(
      "Cannot connect to Nuru AI service",
      "CONNECTION_ERROR"
    );
  }

  return new NuruAIError(
    error.message || "Unknown error occurred",
    "UNKNOWN_ERROR",
    undefined,
    error
  );
}

// Configuration helpers
export function createNuruConfig(
  overrides: Partial<NuruConfig> = {}
): NuruConfig {
  return {
    baseURL: process.env.NEXT_PUBLIC_NURU_AI_URL || "http://18.206.91.76:8000",
    timeout: 30000,
    enableStreaming: true,
    ...overrides,
  };
}

// Export default hook for convenience
export default useNuruAI;
