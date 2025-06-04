"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  Lightbulb,
  Users,
  TreePine,
  Calculator,
  Globe,
  Heart,
  Zap,
  Target,
  Star,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  Play,
  TrendingUp,
  MapPin,
  Compass,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/lib/stores/enhanced-learning";
import { type Subject } from "@/lib/stores/enhanced-learning";
import { nuruAI } from "@/lib/services/enhanced-nuru-ai";

interface SubjectInfo {
  id: Subject;
  title: string;
  titleKpelle: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  topics: string[];
  culturalConnection: string;
  learningOutcomes: string[];
  interactiveFeatures: string[];
}

interface StudyPlan {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  totalLessons: number;
  estimatedWeeks: number;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  learningPath: Array<{
    week: number;
    theme: string;
    lessons: Array<{
      id: string;
      title: string;
      type:
        | "introduction"
        | "practice"
        | "assessment"
        | "cultural"
        | "interactive";
      duration: number;
      difficulty: number;
      nuruFeatures: string[];
    }>;
  }>;
  culturalIntegration: string[];
  assessmentMethods: string[];
  nuruAIFeatures: string[];
}

const subjects: SubjectInfo[] = [
  {
    id: "language-arts",
    title: "Kpelle Language & Literature",
    titleKpelle: "Kpɛlɛɛ Kaa nɛɛ Woli-kɛlɛɛ",
    description:
      "Master the beauty of Kpelle language through stories, poetry, and cultural wisdom",
    icon: BookOpen,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    difficulty: "beginner",
    estimatedTime: "8-12 weeks",
    topics: [
      "Basic Greetings",
      "Family & Community",
      "Traditional Stories",
      "Poetry",
      "Cultural Expressions",
    ],
    culturalConnection:
      "Connect with ancestral wisdom through oral traditions and storytelling",
    learningOutcomes: [
      "Speak confidently in everyday Kpelle conversations",
      "Understand traditional stories and their meanings",
      "Appreciate Kpelle literary traditions",
      "Express yourself in culturally appropriate ways",
    ],
    interactiveFeatures: [
      "AI Pronunciation Coach",
      "Story Generator",
      "Cultural Context Analysis",
      "Voice Conversations",
    ],
  },
  {
    id: "mathematics",
    title: "Mathematics & Problem Solving",
    titleKpelle: "Kɔɔnti nɛɛ Wulo-kɛlɛɛ",
    description:
      "Explore mathematical concepts through traditional Liberian practices and modern applications",
    icon: Calculator,
    color: "green",
    gradient: "from-green-500 to-emerald-600",
    difficulty: "intermediate",
    estimatedTime: "10-14 weeks",
    topics: [
      "Traditional Counting",
      "Market Mathematics",
      "Geometry in Architecture",
      "Agriculture Calculations",
      "Modern Applications",
    ],
    culturalConnection:
      "Learn through traditional market practices, building techniques, and agricultural wisdom",
    learningOutcomes: [
      "Apply math to real-world Liberian contexts",
      "Understand traditional counting systems",
      "Solve practical problems in trade and agriculture",
      "Connect mathematical concepts to cultural practices",
    ],
    interactiveFeatures: [
      "Visual Problem Solving",
      "Cultural Math Stories",
      "Real-world Simulations",
      "Interactive Calculations",
    ],
  },
  {
    id: "science",
    title: "Natural Sciences & Environment",
    titleKpelle: "Kaa-mɛni Koo nɛɛ Ɓoŋ",
    description:
      "Discover the natural world through indigenous knowledge and modern scientific understanding",
    icon: TreePine,
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    difficulty: "intermediate",
    estimatedTime: "12-16 weeks",
    topics: [
      "Forest Ecology",
      "Traditional Medicine",
      "Weather Patterns",
      "Sustainable Practices",
      "Conservation",
    ],
    culturalConnection:
      "Blend traditional ecological knowledge with modern environmental science",
    learningOutcomes: [
      "Understand local ecosystems and biodiversity",
      "Appreciate traditional environmental wisdom",
      "Apply scientific methods to local challenges",
      "Develop sustainable living practices",
    ],
    interactiveFeatures: [
      "Nature Recognition AI",
      "Environmental Simulations",
      "Traditional Knowledge Database",
      "Conservation Planning",
    ],
  },
  {
    id: "social-studies",
    title: "History & Cultural Studies",
    titleKpelle: "Kɛlɛɛ-tɛɛŋ nɛɛ Kpɔlɔ-koo",
    description:
      "Journey through Liberian history and explore rich cultural traditions and values",
    icon: Users,
    color: "orange",
    gradient: "from-orange-500 to-red-600",
    difficulty: "beginner",
    estimatedTime: "6-10 weeks",
    topics: [
      "Kpelle Origins",
      "Colonial History",
      "Independence Movement",
      "Cultural Ceremonies",
      "Modern Liberia",
    ],
    culturalConnection:
      "Explore your heritage through stories, ceremonies, and historical perspectives",
    learningOutcomes: [
      "Understand Liberian historical context",
      "Appreciate cultural diversity and traditions",
      "Connect past events to present challenges",
      "Develop cultural pride and identity",
    ],
    interactiveFeatures: [
      "Historical Storytelling AI",
      "Cultural Timeline Explorer",
      "Virtual Cultural Tours",
      "Tradition Analyzer",
    ],
  },
  {
    id: "life-skills",
    title: "Life Skills & Community Building",
    titleKpelle: "Kɛlɛɛ-ti nɛɛ Kaa-wolo-mɛni",
    description:
      "Develop essential skills for personal growth and community leadership",
    icon: Heart,
    color: "pink",
    gradient: "from-pink-500 to-rose-600",
    difficulty: "beginner",
    estimatedTime: "4-8 weeks",
    topics: [
      "Communication Skills",
      "Leadership",
      "Conflict Resolution",
      "Financial Literacy",
      "Health & Wellness",
    ],
    culturalConnection:
      "Build on traditional community values and social structures",
    learningOutcomes: [
      "Communicate effectively in diverse settings",
      "Lead with cultural wisdom and modern skills",
      "Resolve conflicts using traditional methods",
      "Manage resources and plan for the future",
    ],
    interactiveFeatures: [
      "Communication Simulator",
      "Leadership Assessment",
      "Scenario-based Learning",
      "Community Building Tools",
    ],
  },
];

export default function SubjectLearningHub() {
  const router = useRouter();
  const { currentUser, addNotification } = useLearningStore();
  
  // Mock methods that aren't available in enhanced store yet
  const setCurrentSubject = (subject: Subject) => {
    console.log("Setting current subject:", subject);
    // TODO: Implement in enhanced store
  };
  
  const loadLesson = (lessonId: string) => {
    console.log("Loading lesson:", lessonId);
    // TODO: Implement in enhanced store
  };
  
  const showNotification = (notification: { type: string; title: string; message: string }) => {
    addNotification({
      type: notification.type as any,
      title: notification.title,
      message: notification.message
    });
  };

  const [isStartingLesson, setIsStartingLesson] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [generatedStudyPlan, setGeneratedStudyPlan] =
    useState<StudyPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [nuruStatus, setNuruStatus] = useState<
    "connecting" | "ready" | "error"
  >("ready");
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  useEffect(() => {
    const checkNuruStatus = async () => {
      try {
        const status = await nuruAI.healthCheck();
        setNuruStatus(status.status === "healthy" ? "ready" : "error");
      } catch (error) {
        setNuruStatus("error");
      }
    };

    checkNuruStatus();
  }, []);

  const handleSubjectSelect = async (subject: SubjectInfo) => {
    setSelectedSubject(subject.id);
    setCurrentSubject(subject.id);
    setIsGeneratingPlan(true);

    try {
      if (nuruStatus === "ready") {
        const studyPlan = await generateAIStudyPlan(subject);
        setGeneratedStudyPlan(studyPlan);
        showNotification({
          type: "success",
          title: "Study Plan Generated",
          message: `Personalized study plan generated for ${subject.title}!`
        });
      } else {
        const fallbackPlan = generateFallbackStudyPlan(subject);
        setGeneratedStudyPlan(fallbackPlan);
        showNotification({
          type: "info",
          title: "Study Plan Created",
          message: "Study plan created (AI unavailable - using template)"
        });
      }
      setShowPlanDetails(true);
    } catch (error) {
      console.error("Failed to generate study plan:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to generate study plan. Please try again."
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const generateAIStudyPlan = async (
    subject: SubjectInfo
  ): Promise<StudyPlan> => {
    try {
      const prompt = `Create a comprehensive learning plan for "${
        subject.title
      }" tailored for ${subject.difficulty} level students. 
      
      Context:
      - Subject: ${subject.title} (${subject.titleKpelle})
      - Cultural Connection: ${subject.culturalConnection}
      - Duration: ${subject.estimatedTime}
      - Topics to cover: ${subject.topics.join(", ")}
      - Learning Outcomes: ${subject.learningOutcomes.join(", ")}
      
      Generate a study plan that:
      1. Breaks learning into weekly themes
      2. Incorporates Kpelle cultural context authentically
      3. Uses interactive AI features (voice, image analysis, conversation)
      4. Provides diverse lesson types (not just reading)
      5. Includes regular assessments and cultural activities
      
      Return as JSON with this structure:
      {
        "title": "Study plan title",
        "description": "Brief description", 
        "totalLessons": 24,
        "estimatedWeeks": 8,
        "difficultyLevel": "${subject.difficulty}",
        "learningPath": [
          {
            "week": 1,
            "theme": "Week theme",
            "lessons": [
              {
                "title": "Lesson title",
                "type": "interactive|practice|cultural|assessment",
                "duration": 30,
                "difficulty": 1-5,
                "nuruFeatures": ["Voice Practice", "AI Chat", "Image Analysis"]
              }
            ]
          }
        ],
        "culturalIntegration": ["Cultural element 1", "Cultural element 2"],
        "assessmentMethods": ["Method 1", "Method 2"],
        "nuruAIFeatures": ["AI feature 1", "AI feature 2"]
      }`;

      const response = await nuruAI.chat({
        message: prompt,
        context: "educational_planning",
        language: "en",
      });

      const planData = JSON.parse(response.response);

      return {
        id: `plan-${Date.now()}`,
        subject: subject.id,
        ...planData,
      };
    } catch (error) {
      console.error("AI study plan generation failed:", error);
      return generateFallbackStudyPlan(subject);
    }
  };

  const generateFallbackStudyPlan = (subject: SubjectInfo): StudyPlan => {
    const baseLessons: Record<Subject, any[]> = {
      "language-arts": [
        {
          title: "Basic Greetings & Introductions",
          type: "interactive" as const,
          nuruFeatures: ["Voice Practice", "Pronunciation AI"],
        },
        {
          title: "Family & Relationships",
          type: "cultural" as const,
          nuruFeatures: ["Cultural Context", "AI Chat"],
        },
        {
          title: "Traditional Stories",
          type: "practice" as const,
          nuruFeatures: ["Story Generator", "Audio Narration"],
        },
        {
          title: "Market Conversations",
          type: "assessment" as const,
          nuruFeatures: ["Conversation AI", "Scenario Practice"],
        },
      ],
      mathematics: [
        {
          title: "Traditional Counting Systems",
          type: "cultural" as const,
          nuruFeatures: ["Visual Learning", "Cultural Context"],
        },
        {
          title: "Market Mathematics",
          type: "practice" as const,
          nuruFeatures: ["Problem Solving AI", "Real-world Examples"],
        },
        {
          title: "Geometric Patterns in Art",
          type: "interactive" as const,
          nuruFeatures: ["Image Analysis", "Pattern Recognition"],
        },
        {
          title: "Agricultural Calculations",
          type: "assessment" as const,
          nuruFeatures: ["Simulation", "Practical Applications"],
        },
      ],
      science: [
        {
          title: "Forest Ecosystem Basics",
          type: "interactive" as const,
          nuruFeatures: ["Image Recognition", "Species Identification"],
        },
        {
          title: "Traditional Plant Medicine",
          type: "cultural" as const,
          nuruFeatures: ["Cultural Database", "Plant Analysis"],
        },
        {
          title: "Weather & Climate",
          type: "practice" as const,
          nuruFeatures: ["Data Analysis", "Prediction Models"],
        },
        {
          title: "Conservation Strategies",
          type: "assessment" as const,
          nuruFeatures: ["Simulation", "Planning Tools"],
        },
      ],
      "social-studies": [
        {
          title: "Kpelle Origins & Migration",
          type: "cultural" as const,
          nuruFeatures: ["Historical AI", "Timeline Explorer"],
        },
        {
          title: "Colonial Period Impact",
          type: "practice" as const,
          nuruFeatures: ["Document Analysis", "Critical Thinking"],
        },
        {
          title: "Independence Movement",
          type: "interactive" as const,
          nuruFeatures: ["Story Recreation", "Historical Simulation"],
        },
        {
          title: "Modern Challenges",
          type: "assessment" as const,
          nuruFeatures: ["Current Events AI", "Analysis Tools"],
        },
      ],
      "life-skills": [
        {
          title: "Effective Communication",
          type: "interactive" as const,
          nuruFeatures: ["Conversation AI", "Feedback Analysis"],
        },
        {
          title: "Community Leadership",
          type: "cultural" as const,
          nuruFeatures: ["Leadership Assessment", "Cultural Wisdom"],
        },
        {
          title: "Conflict Resolution",
          type: "practice" as const,
          nuruFeatures: ["Scenario Simulation", "Mediation Training"],
        },
        {
          title: "Financial Planning",
          type: "assessment" as const,
          nuruFeatures: ["Budget Calculator", "Planning Tools"],
        },
      ],
    };

    const lessons = baseLessons[subject.id] || baseLessons["language-arts"];

    return {
      id: `fallback-${subject.id}`,
      subject: subject.id,
      title: `${subject.title} - Comprehensive Study Plan`,
      description: `A culturally-rich learning journey combining traditional wisdom with modern education`,
      totalLessons: lessons.length * 4, // 4 lessons per theme
      estimatedWeeks: 8,
      difficultyLevel: subject.difficulty,
      learningPath: Array.from({ length: 4 }, (_, weekIndex) => ({
        week: weekIndex + 1,
        theme: subject.topics[weekIndex] || `Week ${weekIndex + 1} Theme`,
        lessons: lessons.map((lesson: any, lessonIndex: number) => ({
          id: `${subject.id}-w${weekIndex + 1}-l${lessonIndex + 1}`,
          title: lesson.title,
          type: lesson.type,
          duration: 30,
          difficulty:
            subject.difficulty === "beginner"
              ? 2
              : subject.difficulty === "intermediate"
              ? 3
              : 4,
          nuruFeatures: lesson.nuruFeatures,
        })),
      })),
      culturalIntegration: [
        "Traditional stories and oral history",
        "Cultural ceremonies and practices",
        "Community values and social structures",
        "Indigenous knowledge systems",
      ],
      assessmentMethods: [
        "Interactive AI conversations",
        "Cultural scenario practice",
        "Peer collaboration projects",
        "Real-world application tasks",
      ],
      nuruAIFeatures: subject.interactiveFeatures,
    };
  };

  const startLearningPath = async () => {
    if (!generatedStudyPlan) return;

    setIsStartingLesson(true); // Add this state

    try {
      // Load the first lesson of the study plan
      const firstLesson = generatedStudyPlan.learningPath[0]?.lessons[0];
      if (firstLesson) {
        await loadLesson(firstLesson.id);
        showNotification({
          type: "success",
          title: "Learning Journey Started",
          message: `Starting your ${generatedStudyPlan.subject} learning journey!`
        });
        router.push(`/lessons/${firstLesson.id}`);
      }
    } catch (error) {
      console.error("Failed to start learning path:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to start lesson. Please try again."
      });
      setIsStartingLesson(false); // Reset loading state on error
    }
    // Don't reset loading state on success - let the navigation handle it
  };

  if (selectedSubject && showPlanDetails && generatedStudyPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubject(null);
                setShowPlanDetails(false);
                setGeneratedStudyPlan(null);
              }}
              className="flex items-center gap-2"
            >
              ← Back to Subjects
            </Button>

            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Generated Study Plan
            </Badge>
          </div>

          {/* Study Plan Header */}
          <Card className="mb-8 border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-purple-600" />
                    {generatedStudyPlan.title}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {generatedStudyPlan.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {generatedStudyPlan.totalLessons}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Lessons
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedStudyPlan.estimatedWeeks}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Weeks
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 capitalize">
                        {generatedStudyPlan.difficultyLevel}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Difficulty
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {generatedStudyPlan.nuruAIFeatures.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        AI Features
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startLearningPath}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isStartingLesson}
                >
                  {isStartingLesson ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Starting Lesson...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Learning
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Learning Path Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Timeline */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Your Learning Journey
              </h2>

              <div className="space-y-6">
                {generatedStudyPlan.learningPath.map((week, weekIndex) => (
                  <motion.div
                    key={week.week}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: weekIndex * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              Week {week.week}
                            </Badge>
                            <CardTitle className="text-lg">
                              {week.theme}
                            </CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {week.lessons.length} lessons
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {week.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">
                                  {lesson.title}
                                </h4>
                                <Badge
                                  variant={
                                    lesson.type === "interactive"
                                      ? "default"
                                      : lesson.type === "cultural"
                                      ? "secondary"
                                      : lesson.type === "assessment"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {lesson.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                {lesson.duration} minutes • Difficulty{" "}
                                {lesson.difficulty}/5
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {lesson.nuruFeatures
                                  .slice(0, 2)
                                  .map((feature, featureIndex) => (
                                    <Badge
                                      key={featureIndex}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                {lesson.nuruFeatures.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{lesson.nuruFeatures.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cultural Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-green-600" />
                    Cultural Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedStudyPlan.culturalIntegration.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Features */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Nuru AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedStudyPlan.nuruAIFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Assessment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Assessment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedStudyPlan.assessmentMethods.map((method, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Award className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{method}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Progress Tracking */}
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        0
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Lessons Completed
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Compass className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Learning Path
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
            Discover personalized study plans powered by AI that blend
            traditional Liberian wisdom with modern education. Each subject
            connects you to your cultural heritage while building practical
            skills.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Badge
              variant={nuruStatus === "ready" ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Nuru AI {nuruStatus === "ready" ? "Ready" : "Demo Mode"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered Study Plans
            </Badge>
          </div>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {subjects.map((subject, index) => {
            const Icon = subject.icon;
            const userProgress =
              currentUser?.progress?.subjectProgress?.[subject.id as keyof typeof currentUser.progress.subjectProgress];

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => handleSubjectSelect(subject)}
              >
                <Card
                  className={`
                 h-full border-2 transition-all duration-300 hover:shadow-xl
                 ${
                   selectedSubject === subject.id
                     ? "border-purple-500 shadow-lg"
                     : "border-gray-200 hover:border-gray-300"
                 }
                 dark:border-gray-700 dark:hover:border-gray-600
               `}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`
                       p-3 rounded-xl bg-gradient-to-br ${subject.gradient} shadow-lg
                     `}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={
                            subject.difficulty === "beginner"
                              ? "default"
                              : subject.difficulty === "intermediate"
                              ? "secondary"
                              : "destructive"
                          }
                          className="mb-2"
                        >
                          {subject.difficulty}
                        </Badge>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {subject.estimatedTime}
                        </div>
                      </div>
                    </div>

                    <CardTitle className="text-xl mb-2">
                      {subject.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {subject.titleKpelle}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {subject.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    {userProgress && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              (userProgress.lessonsCompleted / 20) * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={(userProgress.lessonsCompleted / 20) * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Cultural Connection */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <TreePine className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          {subject.culturalConnection}
                        </p>
                      </div>
                    </div>

                    {/* Topics Preview */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Key Topics
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {subject.topics.slice(0, 3).map((topic, topicIndex) => (
                          <Badge
                            key={topicIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {subject.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{subject.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Interactive Features */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        AI Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {subject.interactiveFeatures
                          .slice(0, 2)
                          .map((feature, featureIndex) => (
                            <Badge
                              key={featureIndex}
                              variant="secondary"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        {subject.interactiveFeatures.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{subject.interactiveFeatures.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`
                       w-full mt-4 bg-gradient-to-r ${subject.gradient} 
                       hover:opacity-90 text-white border-0 shadow-md
                     `}
                      disabled={
                        isGeneratingPlan && selectedSubject === subject.id
                      }
                    >
                      {isGeneratingPlan && selectedSubject === subject.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating AI Study Plan...
                        </>
                      ) : (
                        <>
                          Generate Study Plan
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Learning Outcomes Section */}
        <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="w-6 h-6 text-green-600" />
              What You'll Achieve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Cultural Fluency</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Deep understanding of Liberian culture and traditions
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">AI-Enhanced Learning</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalized education adapted to your learning style
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Community Connection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build stronger ties with your heritage and community
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Practical Skills</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-world abilities for personal and professional growth
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nuru AI Features Showcase */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Powered by Nuru AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Intelligent Tutoring</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI adapts to your learning pace and provides personalized
                    feedback
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Cultural Context</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI understands and preserves Liberian cultural nuances
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Adaptive Content</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dynamic lessons that evolve based on your progress
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Performance Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed insights into your learning patterns and progress
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Emotional Intelligence</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI recognizes and responds to your emotional learning state
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Achievement Tracking</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gamified progress with culturally meaningful rewards
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Notice */}
        <Card className="mt-8 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Developer Enhancement: AI-Powered Subject Hub
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                  This transformed lessons page demonstrates how developers can
                  leverage Nuru AI to create engaging, culturally-aware
                  educational experiences. Instead of static content, the AI
                  generates personalized study plans that adapt to individual
                  learning styles while preserving cultural authenticity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Key Innovations:
                    </h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Dynamic AI-generated study plans</li>
                      <li>• Cultural context integration</li>
                      <li>• Gamified learning progression</li>
                      <li>• Multi-modal AI interactions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Developer Benefits:
                    </h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Reduced content creation overhead</li>
                      <li>• Personalized user experiences</li>
                      <li>• Cultural sensitivity automation</li>
                      <li>• Adaptive difficulty scaling</li>
                    </ul>
                  </div>
                </div>
                {nuruStatus === "ready" && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Nuru AI is connected and ready to generate personalized
                      study plans
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
