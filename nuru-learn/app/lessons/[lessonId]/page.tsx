// app/lessons/[lessonId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Star,
  Clock,
  Target,
  Zap,
  Sparkles,
  MessageCircle,
  Camera,
  Mic,
  MicOff,
  Award,
  TreePine,
  Globe,
  Lightbulb,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useParams } from "next/navigation";
import { useEnhancedLearningStore } from "@/lib/stores/enhanced-learning";
import { NuruAIService } from "@/lib/services/nuru-ai";

interface LessonActivity {
  id: string;
  type:
    | "introduction"
    | "vocabulary"
    | "reading"
    | "listening"
    | "speaking"
    | "cultural"
    | "practice"
    | "assessment";
  title: string;
  instructions: string;
  content: {
    text?: string;
    kpelleText?: string;
    audio?: string;
    image?: string;
    vocabulary?: Array<{
      kpelle: string;
      english: string;
      pronunciation: string;
      definition: string;
    }>;
    question?: string;
    options?: string[];
    correctAnswer?: string;
    culturalNote?: string;
    hints?: string[];
  };
  completed: boolean;
  score?: number;
  userAnswer?: string;
  timeSpent: number;
  nuruFeatures: string[];
}

interface LessonData {
  id: string;
  title: string;
  titleKpelle: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  culturalContext: string;
  learningObjectives: string[];
  activities: LessonActivity[];
  totalActivities: number;
  xpReward: number;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;

  const { currentUser, addNotification, completeActivity, addXP } =
    useEnhancedLearningStore();
  const nuruAIService = NuruAIService.getInstance();

  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [activityStartTime, setActivityStartTime] = useState<number>(
    Date.now()
  );
  const [nuruStatus, setNuruStatus] = useState<"ready" | "error">("ready");
  const [aiResponse, setAIResponse] = useState<string>("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    loadLessonData();
    checkNuruStatus();
  }, [lessonId]);

  const checkNuruStatus = async () => {
    try {
      const status = await nuruAIService.getStatus();
      setNuruStatus(status.isHealthy ? "ready" : "error");
    } catch (error) {
      setNuruStatus("error");
    }
  };

  const loadLessonData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse lesson ID to determine subject and lesson details
      const lessonInfo = parseLessonId(lessonId);

      if (nuruStatus === "ready") {
        // Show a progress message to the user
        addNotification({ message: "Generating lesson content with AI...", type: "info" });

        try {
          const aiLessonData = await generateAILessonContent(lessonInfo);
          setLessonData(aiLessonData);
          addNotification({ message: "Lesson loaded successfully!", type: "success" });
        } catch (error) {
          console.error("AI lesson generation failed:", error);

          let errorMessage = "Failed to generate lesson content.";
          let errorType: "error" | "success" | "warning" | "info" = "error";

          if (error instanceof Error) {
            if (
              error.message.includes("timeout") ||
              error.message.includes("taking longer")
            ) {
              errorMessage =
                "AI service is currently busy. Please try again in a moment.";
              errorType = "warning";
            } else if (
              error.message.includes("network") ||
              error.message.includes("connection")
            ) {
              errorMessage =
                "Network connection issue. Please check your internet and try again.";
              errorType = "warning";
            } else if (
              error.message.includes("incomplete") ||
              error.message.includes("try again")
            ) {
              errorMessage = error.message;
              errorType = "warning";
            }
          }

          addNotification({ message: errorMessage, type: errorType });
          setError(errorMessage);
          setLessonData(null);
          return;
        }
      } else {
        setError(
          "AI service is currently unavailable. Please try again later."
        );
        setLessonData(null);
      }

      setActivityStartTime(Date.now());
    } catch (error) {
      console.error("Failed to load lesson:", error);
      setError(
        "Failed to load lesson. Please check your connection and try again."
      );
      setLessonData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const parseLessonId = (id: string) => {
    // Parse IDs like "science-w1-l1" or "language-arts-w2-l3"
    const parts = id.split("-");
    const subject = parts[0] === "language" ? "language-arts" : parts[0];
    const week = parts.find((p) => p.startsWith("w"))?.substring(1) || "1";
    const lesson = parts.find((p) => p.startsWith("l"))?.substring(1) || "1";

    return { subject, week: parseInt(week), lesson: parseInt(lesson) };
  };

  // Improved generateAILessonContent with progressive timeouts and better prompting
  const generateAILessonContent = async (
    lessonInfo: any
  ): Promise<LessonData> => {
    try {
      // Simplified, more focused prompt
      const prompt = `Create a ${lessonInfo.subject} lesson (Week ${lessonInfo.week}, Lesson ${lessonInfo.lesson}) with Kpelle cultural context.

IMPORTANT: Respond with ONLY valid JSON, no extra text:

{
  "title": "Brief lesson title",
  "titleKpelle": "Kpelle translation", 
  "culturalContext": "One sentence about Kpelle cultural relevance",
  "learningObjectives": ["Learn X", "Practice Y"],
  "activities": [
    {
      "type": "vocabulary",
      "title": "Activity name",
      "instructions": "What students should do",
      "content": {
        "text": "Brief explanation",
        "vocabulary": [{"kpelle": "word", "english": "meaning", "pronunciation": "sound", "definition": "description"}],
        "question": "Simple question?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      },
      "nuruFeatures": ["Voice Practice"]
    }
  ]
}`;

      console.log("🚀 Starting optimized AI lesson generation...");

      // Start with a shorter timeout and progressive fallback
      const response = await generateWithProgressiveTimeout(prompt);

      return parseAndConstructLesson(response, lessonInfo);
    } catch (error) {
      console.error("💥 AI lesson generation failed:", error);
      throw error;
    }
  };

  // Progressive timeout strategy
  const generateWithProgressiveTimeout = async (prompt: string) => {
    const timeouts = [30000, 60000, 90000]; // 30s, 1m, 1.5m

    for (let i = 0; i < timeouts.length; i++) {
      try {
        console.log(
          `⏱️ Attempt ${i + 1} with ${timeouts[i] / 1000}s timeout...`
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeouts[i]);

        const response = await nuruAIService.chat({
          message: prompt,
          context: "lesson_content_generation",
          language: "en",
        });

        clearTimeout(timeoutId);

        // Check if we got a reasonable response
        if (response.response && response.response.length > 100) {
          console.log(`✅ Success on attempt ${i + 1}`);
          return response;
        } else {
          throw new Error("Response too short");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log(`❌ Attempt ${i + 1} failed:`, errorMessage);

        if (i === timeouts.length - 1) {
          throw new Error("All attempts failed");
        }

        // Brief pause before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  };

  // Simplified parsing with better fallback
  const parseAndConstructLesson = (
    response: any,
    lessonInfo: any
  ): LessonData => {
    let parsedData;

    try {
      // Clean and parse response
      let cleanedResponse = response.response.trim();

      // Remove any markdown wrapper
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "");

      // Extract JSON
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      // Try parsing with repair
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Quick repair for common issues
        let repaired = jsonMatch[0]
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys

        // Add missing closing braces/brackets
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          repaired += "}".repeat(openBraces - closeBraces);
        }

        parsedData = JSON.parse(repaired);
      }
    } catch (error) {
      console.warn("❌ Parsing failed, using minimal fallback");

      // Create minimal lesson from whatever we can extract
      parsedData = createMinimalLesson(response.response, lessonInfo);
    }

    // Construct final lesson data
    return {
      id: lessonId,
      title:
        parsedData.title ||
        `${lessonInfo.subject} Week ${lessonInfo.week} Lesson ${lessonInfo.lesson}`,
      titleKpelle: parsedData.titleKpelle || "Kpɛlɛɛ Kaa",
      subject: lessonInfo.subject,
      difficulty: "beginner",
      estimatedTime: 30,
      culturalContext:
        parsedData.culturalContext || "Lesson with Kpelle cultural context",
      learningObjectives: parsedData.learningObjectives || [
        "Learn concepts",
        "Practice skills",
      ],
      activities: ensureValidActivities(
        parsedData.activities || [],
        lessonInfo
      ),
      totalActivities: Math.max(parsedData.activities?.length || 0, 3),
      xpReward: 50,
    };
  };

  // Create minimal lesson when parsing fails
  const createMinimalLesson = (responseText: string, lessonInfo: any) => {
    const titleMatch = responseText.match(/"title":\s*"([^"]+)"/);

    return {
      title: titleMatch?.[1] || `${lessonInfo.subject} Learning Session`,
      titleKpelle: "Kpɛlɛɛ Kaa",
      culturalContext: "Lesson adapted for Kpelle cultural learning",
      learningObjectives: [
        "Learn key concepts",
        "Practice with cultural context",
      ],
      activities: [
        {
          type: "vocabulary",
          title: "Vocabulary Practice",
          instructions: "Learn important terms",
          content: {
            text: `Study these ${lessonInfo.subject} concepts.`,
            vocabulary: [
              {
                kpelle: "kaa",
                english: "work/lesson",
                pronunciation: "kah",
                definition: "Learning or work activity",
              },
            ],
          },
          nuruFeatures: ["Voice Practice"],
        },
      ],
    };
  };

  // Ensure activities are valid
  const ensureValidActivities = (activities: any[], lessonInfo: any) => {
    const validActivities = activities
      .filter((activity) => activity.type && activity.title && activity.content)
      .map((activity, index) => ({
        id: `activity-${index}`,
        type: activity.type || "vocabulary",
        title: activity.title || `Activity ${index + 1}`,
        instructions: activity.instructions || "Complete this activity",
        content: {
          text: activity.content?.text || "Activity content",
          kpelleText: activity.content?.kpelleText || null,
          vocabulary: activity.content?.vocabulary || [],
          question: activity.content?.question || null,
          options: activity.content?.options || null,
          correctAnswer: activity.content?.correctAnswer || null,
          culturalNote: activity.content?.culturalNote || null,
          hints: activity.content?.hints || null,
        },
        completed: false,
        timeSpent: 0,
        nuruFeatures: activity.nuruFeatures || ["AI Chat"],
      }));

    // Ensure minimum of 3 activities
    while (validActivities.length < 3) {
      const types = ["introduction", "vocabulary", "practice"];
      validActivities.push({
        id: `fallback-${validActivities.length}`,
        type: types[validActivities.length % types.length],
        title: `${lessonInfo.subject} Activity ${validActivities.length + 1}`,
        instructions: "Complete this learning activity",
        content: {
          text: `Practice ${lessonInfo.subject} concepts with cultural context.`,
          kpelleText: null,
          vocabulary: [
            {
              kpelle: "kɛlɛɛ",
              english: "good",
              pronunciation: "keh-lee",
              definition: "Good, well, fine",
            },
          ],
          question: null,
          options: null,
          correctAnswer: null,
          culturalNote: null,
          hints: null,
        },
        completed: false,
        timeSpent: 0,
        nuruFeatures: ["AI Chat"],
      });
    }

    return validActivities;
  };

  const currentActivity = lessonData?.activities[currentActivityIndex];
  const progress = lessonData
    ? ((currentActivityIndex + 1) / lessonData.totalActivities) * 100
    : 0;

  const handleNext = () => {
    if (!lessonData || !currentActivity) return;

    // Record time spent on current activity
    const timeSpent = Date.now() - activityStartTime;
    currentActivity.timeSpent = timeSpent;

    if (currentActivityIndex < lessonData.totalActivities - 1) {
      setCurrentActivityIndex((prev) => prev + 1);
      setActivityStartTime(Date.now());
      setUserAnswer("");
      setShowFeedback(false);
    } else {
      completeLeson();
    }
  };

  const handlePrevious = () => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex((prev) => prev - 1);
      setActivityStartTime(Date.now());
      setUserAnswer("");
      setShowFeedback(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentActivity || !userAnswer.trim()) return;

    setIsProcessingAI(true);

    try {
      if (nuruStatus === "ready" && currentActivity.content.question) {
        // Use Nuru AI to evaluate the answer
        const evaluation = await nuruAIService.chat({
          message: `Evaluate this student answer for the question "${currentActivity.content.question}":
                   Student Answer: "${userAnswer}"
                   Correct Answer: "${currentActivity.content.correctAnswer}"
                   
                   Provide feedback in this format:
                   {
                     "isCorrect": true/false,
                     "score": 0-100,
                     "feedback": "encouraging feedback with explanation",
                     "culturalNote": "relevant cultural context if applicable"
                   }`,
          context: "answer_evaluation",
          language: "en",
        });

        try {
          const result = JSON.parse(evaluation.response);
          setAIResponse(result.feedback);
          currentActivity.score = result.score;
          currentActivity.userAnswer = userAnswer;
        } catch {
          // Fallback evaluation
          const isCorrect = userAnswer
            .toLowerCase()
            .includes(
              currentActivity.content.correctAnswer?.toLowerCase() || ""
            );
          setAIResponse(
            isCorrect
              ? "Great work! Your answer shows good understanding."
              : "Good effort! Consider the cultural context when answering."
          );
          currentActivity.score = isCorrect ? 90 : 60;
        }
      } else {
        // Simple fallback evaluation
        const isCorrect = userAnswer
          .toLowerCase()
          .includes(currentActivity.content.correctAnswer?.toLowerCase() || "");
        setAIResponse(
          isCorrect
            ? "Excellent! You understand the concept well."
            : "Good try! Think about the traditional Kpelle perspective."
        );
        currentActivity.score = isCorrect ? 85 : 65;
      }

      currentActivity.completed = true;
      currentActivity.userAnswer = userAnswer;
      setShowFeedback(true);

      // Award XP
      addXP(currentActivity.score || 0);
    } catch (error) {
      console.error("Answer evaluation failed:", error);
      setAIResponse("Answer submitted successfully!");
      currentActivity.completed = true;
      setShowFeedback(true);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const completeLeson = () => {
    if (!lessonData) return;

    const totalScore = lessonData.activities.reduce(
      (sum, activity) => sum + (activity.score || 0),
      0
    );
    const averageScore = totalScore / lessonData.activities.length;

    addXP(lessonData.xpReward);
    completeActivity(lessonId, averageScore);

    addNotification({
      message: `Lesson completed! Average score: ${Math.round(averageScore)}%. +${
        lessonData.xpReward
      } XP earned!`,
      type: averageScore >= 80 ? "success" : "info"
    });

    router.push("/lessons");
  };

  const playAudio = async (text: string) => {
    if (nuruStatus === "ready") {
      try {
        setIsAudioPlaying(true);
        addNotification({ message: "Generating audio...", type: "info" });

        const audioResponse = await nuruAIService.textToSpeech(text, "kpe");

        if (audioResponse instanceof Blob) {
          const audioUrl = URL.createObjectURL(audioResponse);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
            audioRef.current.onended = () => {
              setIsAudioPlaying(false);
              URL.revokeObjectURL(audioUrl);
            };
          }
        }
      } catch (error) {
        console.error("Audio playback failed:", error);
        setIsAudioPlaying(false);

        // Handle specific CUDA errors
        if (
          (error instanceof Error && error.message?.includes("CUDA")) ||
          (error instanceof Error &&
            error.message?.includes("device-side assert"))
        ) {
          addNotification({
            message: "Audio service is experiencing technical difficulties. Please try again later.",
            type: "warning"
          });
        } else {
          addNotification({ message: "Audio unavailable at the moment", type: "warning" });
        }
      }
    } else {
      addNotification({ message: `Text: "${text}"`, type: "info" });
      setIsAudioPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Lesson...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your learning experience
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => router.push("/lessons")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
          </div>

          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Unable to Load Lesson
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {error}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setError(null);
                    loadLessonData();
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/lessons")}
                >
                  Choose Different Lesson
                </Button>
              </div>

              {nuruStatus === "error" && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
                        AI Service Status
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        The Nuru AI service is currently unavailable. This may
                        be due to high demand or maintenance. Please try again
                        in a few minutes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lesson Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested lesson could not be loaded.
          </p>
          <Button onClick={() => router.push("/lessons")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => router.push("/lessons")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Nuru AI Enhanced
            </Badge>
          </div>
        </div>

        {/* Lesson Header */}
        <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  {lessonData.title}
                </CardTitle>
                <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-2">
                  {lessonData.titleKpelle}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lessonData.culturalContext}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline">{lessonData.subject}</Badge>
                  <Badge
                    variant={
                      lessonData.difficulty === "beginner"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {lessonData.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {lessonData.estimatedTime} min
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="w-4 h-4" />
                    {lessonData.xpReward} XP
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {currentActivityIndex + 1} of {lessonData.totalActivities}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardHeader>
        </Card>

        {/* Main Activity */}
        {currentActivity && (
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    {currentActivity.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {currentActivity.type}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentActivity.instructions}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Content based on activity type */}
                {currentActivity.type === "introduction" && (
                  <div className="space-y-4">
                    {currentActivity.content.text && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {currentActivity.content.text}
                        </p>
                      </div>
                    )}

                    {currentActivity.content.kpelleText && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              playAudio(currentActivity.content.kpelleText!)
                            }
                            disabled={isAudioPlaying}
                          >
                            {isAudioPlaying ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <p className="text-orange-800 dark:text-orange-200 font-medium leading-relaxed">
                              {currentActivity.content.kpelleText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentActivity.content.culturalNote && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-2">
                          <TreePine className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                              Cultural Context
                            </h4>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              {currentActivity.content.culturalNote}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentActivity.type === "vocabulary" &&
                  currentActivity.content.vocabulary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentActivity.content.vocabulary.map((word, index) => (
                        <Card
                          key={index}
                          className="border border-gray-200 dark:border-gray-700"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                  {word.kpelle}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {word.english}
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  /{word.pronunciation}/
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playAudio(word.kpelle)}
                              >
                                <Volume2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {word.definition}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                {(currentActivity.type === "cultural" ||
                  currentActivity.type === "assessment") &&
                  currentActivity.content.question && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                          Question:
                        </h4>
                        <p className="text-purple-800 dark:text-purple-200">
                          {currentActivity.content.question}
                        </p>
                      </div>

                      {currentActivity.content.options ? (
                        <RadioGroup
                          value={userAnswer}
                          onValueChange={setUserAnswer}
                        >
                          {currentActivity.content.options.map(
                            (option, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={option}
                                  id={`option-${index}`}
                                />
                                <Label
                                  htmlFor={`option-${index}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            )
                          )}
                        </RadioGroup>
                      ) : (
                        <Textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="min-h-24"
                        />
                      )}

                      {currentActivity.content.hints && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                                Hints:
                              </h5>
                              <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                                {currentActivity.content.hints.map(
                                  (hint, index) => (
                                    <li key={index}>• {hint}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {!showFeedback ? (
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={!userAnswer.trim() || isProcessingAI}
                          className="w-full"
                        >
                          {isProcessingAI ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing with AI...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className={`p-4 rounded-lg border-2 ${
                              (currentActivity.score || 0) >= 80
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {(currentActivity.score || 0) >= 80 ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Target className="w-5 h-5 text-orange-600" />
                              )}
                              <span className="font-medium">
                                Score: {currentActivity.score || 0}/100
                              </span>
                            </div>
                            <p
                              className={`text-sm ${
                                (currentActivity.score || 0) >= 80
                                  ? "text-green-800 dark:text-green-200"
                                  : "text-orange-800 dark:text-orange-200"
                              }`}
                            >
                              {aiResponse}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Nuru AI Features */}
                <div className="flex flex-wrap gap-2">
                  {currentActivity.nuruFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentActivityIndex === 0}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentActivityIndex(0)}
                  variant="ghost"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restart
                </Button>
              </div>

              {currentActivityIndex === lessonData.totalActivities - 1 ? (
                <Button
                  onClick={completeLeson}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Complete Lesson
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={
                    currentActivity.type === "assessment" &&
                    !currentActivity.completed
                  }
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Learning Objectives Sidebar */}
        <Card className="mt-6 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lessonData.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Audio element for TTS */}
        <audio ref={audioRef} className="hidden" />

        {/* Developer Feature Notice */}
        <Card className="mt-8 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Developer Feature: AI-Enhanced Interactive Lessons
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                  This lesson page demonstrates real-time AI integration for
                  educational content. Nuru AI dynamically generates
                  culturally-appropriate lessons, evaluates student responses,
                  and provides personalized feedback while maintaining authentic
                  Kpelle cultural context.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      AI Features:
                    </h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Dynamic lesson content generation</li>
                      <li>• Real-time answer evaluation</li>
                      <li>• Cultural context integration</li>
                      <li>• Kpelle text-to-speech synthesis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Learning Analytics:
                    </h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Time tracking per activity</li>
                      <li>• Performance scoring</li>
                      <li>• Personalized feedback</li>
                      <li>• Progress monitoring</li>
                    </ul>
                  </div>
                </div>
                {nuruStatus === "ready" && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Nuru AI is actively enhancing this lesson with real-time
                      content generation and analysis
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
