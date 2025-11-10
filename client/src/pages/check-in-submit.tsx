import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VisitDataForm } from "@/components/VisitDataForm";
import { useCheckIn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VisitData {
  machineryTypes: string;
  engineTypes: string;
  fleetMakeup?: string;
  currentSuppliers: string;
  competitorData?: string;
  pricingInfo?: string;
  productModels?: string;
  availabilityGaps?: string;
  customerNeeds: string;
  competitivePosition?: string;
  insideSalesIssues?: string;
  nextSteps: string;
  miscNotes?: string;
}

export default function CheckInSubmitPage() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const companyId = searchParams.get("companyId");
  const companyName = searchParams.get("companyName");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  
  const { toast } = useToast();
  const checkInMutation = useCheckIn();
  
  const [transcript, setTranscript] = useState("");
  const [visitData, setVisitData] = useState<VisitData | null>(null);
  const [currentTab, setCurrentTab] = useState("voice");
  const [checkInTimestamp] = useState(new Date());

  const handleTranscriptionComplete = (newTranscript: string, parsedData: any) => {
    setTranscript(newTranscript);
    setVisitData(parsedData);
    setCurrentTab("review");
    
    toast({
      title: "Ready for Review",
      description: "Review and edit the extracted information before submitting.",
    });
  };

  const handleFormSubmit = async (formData: VisitData) => {
    if (!companyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing company information",
      });
      return;
    }

    const submissionTimestamp = new Date();
    const visitDurationMin = Math.round((submissionTimestamp.getTime() - checkInTimestamp.getTime()) / 60000);

    checkInMutation.mutate(
      {
        companyId,
        lat,
        lng,
        note: `Visit to ${companyName}`,
        voiceTranscript: transcript,
        machineryTypes: formData.machineryTypes,
        engineTypes: formData.engineTypes,
        fleetMakeup: formData.fleetMakeup || undefined,
        currentSuppliers: formData.currentSuppliers,
        competitorData: formData.competitorData || undefined,
        pricingInfo: formData.pricingInfo || undefined,
        productModels: formData.productModels || undefined,
        availabilityGaps: formData.availabilityGaps || undefined,
        customerNeeds: formData.customerNeeds,
        competitivePosition: formData.competitivePosition || undefined,
        insideSalesIssues: formData.insideSalesIssues || undefined,
        nextSteps: formData.nextSteps,
        miscNotes: formData.miscNotes || undefined,
        visitDurationMin,
      },
      {
        onSuccess: () => {
          toast({
            title: "Check-in Submitted",
            description: `Visit to ${companyName} has been recorded (${visitDurationMin} minutes)`,
          });
          navigate("/route");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message || "Failed to submit check-in",
          });
        },
      }
    );
  };

  const handleSkipVoice = () => {
    setCurrentTab("manual");
  };

  if (!companyId || !companyName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Missing company information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/route")} data-testid="button-back-to-route">
              Back to Route
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/route")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{companyName}</h1>
            <p className="text-xs text-muted-foreground">Submit Visit Report</p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-2xl mx-auto">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-checkin-method">
            <TabsTrigger value="voice" data-testid="tab-voice">Voice</TabsTrigger>
            <TabsTrigger value="review" disabled={!visitData} data-testid="tab-review">
              Review
            </TabsTrigger>
            <TabsTrigger value="manual" data-testid="tab-manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <VoiceRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={checkInMutation.isPending}
            />
            
            {transcript && (
              <Card data-testid="card-transcript">
                <CardHeader>
                  <CardTitle className="text-sm">Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleSkipVoice}
                data-testid="button-skip-to-manual"
              >
                Skip Voice - Enter Manually
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4 mt-4">
            {visitData && (
              <VisitDataForm
                defaultValues={visitData}
                onSubmit={handleFormSubmit}
                isSubmitting={checkInMutation.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <VisitDataForm
              defaultValues={visitData || undefined}
              onSubmit={handleFormSubmit}
              isSubmitting={checkInMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
