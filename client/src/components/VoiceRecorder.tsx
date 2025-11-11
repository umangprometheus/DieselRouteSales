import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcript: string, parsedData: any) => void;
  disabled?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function VoiceRecorder({ onTranscriptionComplete, disabled = false, onProcessingChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<number | null>(null);
  const { toast } = useToast();

  // Notify parent component of processing state changes
  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunks.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      timerInterval.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log("🎤 Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      // IMMEDIATELY show loading indicator
      setIsProcessing(true);
      setProcessingStatus("Processing your recording...");
      
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      console.log("🎤 Recording stopped, processing started");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    // Processing state already set when stopping recording
    setProcessingStatus("Preparing audio...");
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        console.log(`🔄 Sending audio for transcription (${audioBlob.size} bytes)`);
        setProcessingStatus("Transcribing your voice note...");
        
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: base64Audio,
            mimeType: 'audio/webm',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Transcription failed');
        }
        
        setProcessingStatus("Extracting visit details with AI...");
        const result = await response.json();
        
        console.log("✅ Transcription complete");
        toast({
          title: "Transcription Complete",
          description: "Your voice note has been processed successfully.",
        });
        
        onTranscriptionComplete(result.transcript, result.parsedData);
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Processing Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <Card data-testid="card-voice-recorder">
        <CardHeader>
          <CardTitle>Voice Note</CardTitle>
          <CardDescription>
            Record your visit observations and they'll be automatically transcribed and parsed into structured data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !isProcessing && (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={disabled}
                data-testid="button-start-recording"
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400">
                  <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                  Recording: {formatTime(recordingTime)}
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  data-testid="button-stop-recording"
                  className="gap-2"
                >
                  <Square className="h-5 w-5" />
                  Stop Recording
                </Button>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
          
          {!isRecording && !isProcessing && (
            <p className="text-xs text-center text-muted-foreground">
              Tap the microphone button to start recording your visit notes
            </p>
          )}
        </CardContent>
      </Card>

      {/* MASSIVE LOADING BANNER - IMPOSSIBLE TO MISS */}
      {isProcessing && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-10 animate-pulse rounded-lg" />
          <Card className="relative border-4 border-blue-500 shadow-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background" data-testid="card-ai-processing-banner">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-6">
                {/* Giant spinner */}
                <div className="relative">
                  <Loader2 className="h-24 w-24 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={3} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-blue-500/20 animate-ping" />
                  </div>
                </div>
                
                {/* Big warning text */}
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    🤖 AI IS PROCESSING
                  </h2>
                  <p className="text-xl font-bold text-foreground">
                    DO NOT FILL OUT THE FORM YET
                  </p>
                  <p className="text-base font-medium text-muted-foreground">
                    {processingStatus || "Transcribing your voice note..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait - this usually takes 3-5 seconds
                  </p>
                </div>
                
                {/* Animated dots */}
                <div className="flex justify-center gap-2">
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '800ms' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
