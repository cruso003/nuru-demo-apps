/**
 * Advanced Nuru AI API Client for Educational Platform
 * Leverages full multimodal capabilities: Whisper STT + Phi-4 + XTTS-v2 TTS
 */

import { Language, NuruAPIRequest, NuruAPIResponse, Subject } from '@/lib/types/education';

export class NuruEducationAPI {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL = 'http://localhost:8000', timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * Check Nuru AI system health and capabilities
   */
  async checkHealth(): Promise<{ 
    status: string; 
    capabilities: string[]; 
    kpelleReady: boolean;
    modelsLoaded: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const basicHealth = await response.json();
      
      // Check Kpelle integration
      const kpelleResponse = await fetch(`${this.baseURL}/api/kpelle/info`);
      const kpelleInfo = await kpelleResponse.json();
      
      // Check language support
      const langResponse = await fetch(`${this.baseURL}/language-support`);
      const langSupport = await langResponse.json();
      
      return {
        status: basicHealth.status,
        capabilities: [
          'whisper-stt',
          'phi4-multimodal',
          'xtts-v2-tts',
          'kpelle-translation',
          'cultural-context',
          'image-analysis'
        ],
        kpelleReady: kpelleInfo.status === 'available',
        modelsLoaded: langSupport.current?.speech_synthesis || []
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        capabilities: [],
        kpelleReady: false,
        modelsLoaded: []
      };
    }
  }

  /**
   * Process speech input using Whisper STT
   */
  async transcribeAudio(
    audioBlob: Blob, 
    language: Language = 'en',
    context?: { subject: Subject; objective: string }
  ): Promise<NuruAPIResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (language) formData.append('language', language);
      
      const response = await fetch(`${this.baseURL}/api/transcribe`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: {
          text: {
            content: result.text,
            language: result.detected_language || language,
            confidence: result.confidence || 0.9
          }
        },
        processingTime: result.processing_time || 0
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        processingTime: 0,
        error: `Transcription error: ${error}`
      };
    }
  }

  /**
   * Generate speech using XTTS-v2 TTS with Kpelle support
   */
  async synthesizeSpeech(
    text: string, 
    language: Language = 'en',
    voiceStyle: 'standard' | 'expressive' | 'cultural' = 'standard'
  ): Promise<NuruAPIResponse> {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);
      formData.append('voice_style', voiceStyle);
      
      const endpoint = language === 'kpe' ? '/api/tts/kpelle' : '/api/synthesize-speech';
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      let audioUrl = '';
      if (result.audio_base64) {
        // Convert base64 to blob URL
        const audioBytes = atob(result.audio_base64);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
      } else if (response.headers.get('content-type')?.includes('audio')) {
        // Direct audio stream
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      }

      return {
        success: true,
        data: {
          audio: {
            url: audioUrl,
            duration: result.duration || 0,
            quality: result.quality || 1.0
          }
        },
        processingTime: result.processing_time || 0
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        processingTime: 0,
        error: `TTS error: ${error}`
      };
    }
  }

  /**
   * Translate text between English and Kpelle
   */
  async translateText(
    text: string, 
    sourceLanguage: Language, 
    targetLanguage: Language,
    context?: { subject: Subject; culturalLevel: string }
  ): Promise<NuruAPIResponse> {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('source_language', sourceLanguage);
      formData.append('target_language', targetLanguage);
      
      if (context) {
        formData.append('subject', context.subject);
        formData.append('cultural_level', context.culturalLevel);
      }

      const response = await fetch(`${this.baseURL}/api/translate`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        data: {
          text: {
            content: result.translation,
            language: targetLanguage,
            confidence: result.confidence || 0.9
          },
          culturalInsights: result.cultural_context ? {
            context: result.cultural_context.background || '',
            modernRelevance: result.cultural_context.modern_relevance || '',
            relatedConcepts: result.cultural_context.related_concepts || []
          } : undefined
        },
        processingTime: result.processing_time || 0
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        processingTime: 0,
        error: `Translation error: ${error}`
      };
    }
  }

  /**
   * Analyze images using Phi-4 vision capabilities
   */
  async analyzeImage(
    imageBlob: Blob, 
    prompt: string = "Describe this image",
    language: Language = 'en',
    educationalContext?: { subject: Subject; objective: string }
  ): Promise<NuruAPIResponse> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('prompt', prompt);
      formData.append('language', language);
      
      if (educationalContext) {
        formData.append('subject', educationalContext.subject);
        formData.append('objective', educationalContext.objective);
      }

      const response = await fetch(`${this.baseURL}/api/analyze-image`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Image analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        data: {
          text: {
            content: result.description,
            language: language,
            confidence: result.confidence || 0.9
          },
          analysis: {
            accuracy: result.analysis_score || 0.9,
            culturalRelevance: result.cultural_relevance || 0.8,
            pronunciation: 0, // N/A for image analysis
            fluency: 0
          },
          suggestions: result.educational_insights || []
        },
        processingTime: result.processing_time || 0
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        processingTime: 0,
        error: `Image analysis error: ${error}`
      };
    }
  }

  /**
   * Complete multimodal interaction processing
   */
  async processMultimodalInteraction(
    input: {
      text?: string;
      audio?: Blob;
      image?: Blob;
    },
    config: {
      language: Language;
      responseLanguage: Language;
      mode: 'educational' | 'conversational' | 'assessment';
      subject: Subject;
      learningObjective: string;
    }
  ): Promise<NuruAPIResponse> {
    try {
      const formData = new FormData();
      
      if (input.text) formData.append('text', input.text);
      if (input.audio) formData.append('audio', input.audio);
      if (input.image) formData.append('image', input.image);
      
      formData.append('language', config.language);
      formData.append('response_language', config.responseLanguage);
      formData.append('mode', config.mode);
      formData.append('subject', config.subject);
      formData.append('learning_objective', config.learningObjective);

      const response = await fetch(`${this.baseURL}/api/process`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Multimodal processing failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Process audio response if provided
      let audioUrl = '';
      if (result.audio_base64) {
        const audioBytes = atob(result.audio_base64);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
      }

      return {
        success: true,
        data: {
          text: {
            content: result.text_response,
            language: config.responseLanguage,
            confidence: result.confidence || 0.9
          },
          audio: audioUrl ? {
            url: audioUrl,
            duration: result.audio_duration || 0,
            quality: result.audio_quality || 1.0
          } : undefined,
          analysis: {
            accuracy: result.accuracy_score || 0.9,
            pronunciation: result.pronunciation_score || 0.8,
            fluency: result.fluency_score || 0.8,
            culturalRelevance: result.cultural_relevance || 0.9
          },
          suggestions: result.educational_feedback || [],
          culturalInsights: result.cultural_insights ? {
            context: result.cultural_insights.context || '',
            modernRelevance: result.cultural_insights.modern_relevance || '',
            relatedConcepts: result.cultural_insights.related_concepts || []
          } : undefined
        },
        processingTime: result.processing_time || 0
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        processingTime: 0,
        error: `Multimodal processing error: ${error}`
      };
    }
  }

  /**
   * Detect language of input text
   */
  async detectLanguage(text: string): Promise<{
    language: Language;
    confidence: number;
    allScores: Record<string, number>;
  }> {
    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await fetch(`${this.baseURL}/api/detect-language`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        language: result.detected_language as Language,
        confidence: result.confidence,
        allScores: result.all_scores || {}
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'en',
        confidence: 0.5,
        allScores: {}
      };
    }
  }

  /**
   * Get Kpelle language information and cultural context
   */
  async getKpelleInfo(): Promise<{
    available: boolean;
    features: string[];
    culturalData: any;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/kpelle/info`);
      const result = await response.json();
      
      return {
        available: result.status === 'available',
        features: Object.keys(result.features || {}),
        culturalData: result.info || {}
      };
    } catch (error) {
      return {
        available: false,
        features: [],
        culturalData: {}
      };
    }
  }

  /**
   * Stream real-time conversation
   */
  async *streamConversation(
    input: AsyncGenerator<{ audio?: Blob; text?: string }, void, unknown>,
    config: {
      language: Language;
      responseLanguage: Language;
      subject: Subject;
    }
  ): AsyncGenerator<NuruAPIResponse, void, unknown> {
    // Implementation for real-time streaming would go here
    // This would use WebSocket or Server-Sent Events for real-time communication
    throw new Error('Streaming not implemented yet');
  }
}

// Singleton instance
export const nuruAPI = new NuruEducationAPI();

// Utility functions
export const audioUtils = {
  /**
   * Record audio from microphone
   */
  async recordAudio(durationMs: number = 5000): Promise<Blob> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        resolve(blob);
      };

      mediaRecorder.onerror = reject;

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), durationMs);
    });
  },

  /**
   * Convert image file to blob
   */
  async imageToBlob(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
        resolve(blob);
      };
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Play audio from URL
   */
  async playAudio(url: string): Promise<void> {
    const audio = new Audio(url);
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = reject;
      audio.play();
    });
  }
};
