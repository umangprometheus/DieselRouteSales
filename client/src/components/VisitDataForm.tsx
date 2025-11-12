import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Truck, 
  Wrench, 
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  Target,
  FileText,
  HelpCircle,
  Building2,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  ClipboardCheck,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const visitDataSchema = z.object({
  machineryTypes: z.string().min(1, "Machinery type is required"),
  engineTypes: z.array(z.string()).optional(),
  fleetMakeup: z.array(z.string()).optional(),
  currentSuppliers: z.array(z.string()).optional(),
  competitorData: z.array(z.string()).min(1, "At least one competitor is required"),
  pricingInfo: z.string().optional(),
  productModels: z.array(z.string()).optional(),
  availabilityGaps: z.string().optional(),
  customerNeeds: z.string().min(1, "Customer needs assessment is required"),
  competitivePosition: z.string().optional(),
  insideSalesIssues: z.string().optional(),
  nextSteps: z.string().min(1, "Next steps are required"),
  miscNotes: z.string().optional(),
});

// Define options for multi-select fields
const engineTypeOptions: MultiSelectOption[] = [
  { value: "cat-c15", label: "CAT C15" },
  { value: "cat-c13", label: "CAT C13" },
  { value: "cat-3406", label: "CAT 3406" },
  { value: "cummins-isx", label: "Cummins ISX" },
  { value: "cummins-x15", label: "Cummins X15" },
  { value: "cummins-n14", label: "Cummins N14" },
  { value: "detroit-series-60", label: "Detroit Series 60" },
  { value: "detroit-dd15", label: "Detroit DD15" },
  { value: "detroit-dd13", label: "Detroit DD13" },
  { value: "paccar-mx13", label: "PACCAR MX-13" },
  { value: "volvo-d13", label: "Volvo D13" },
  { value: "mack-mp8", label: "Mack MP8" },
  { value: "international-maxxforce", label: "International MaxxForce" },
];

const fleetMakeupOptions: MultiSelectOption[] = [
  { value: "freightliner", label: "Freightliner" },
  { value: "peterbilt", label: "Peterbilt" },
  { value: "kenworth", label: "Kenworth" },
  { value: "volvo", label: "Volvo" },
  { value: "mack", label: "Mack" },
  { value: "international", label: "International" },
  { value: "ford", label: "Ford" },
  { value: "chevrolet", label: "Chevrolet" },
  { value: "ram", label: "RAM" },
  { value: "gmc", label: "GMC" },
  { value: "isuzu", label: "Isuzu" },
  { value: "hino", label: "Hino" },
];

const supplierOptions: MultiSelectOption[] = [
  { value: "napa", label: "NAPA" },
  { value: "fleetpride", label: "FleetPride" },
  { value: "oem-dealer", label: "OEM Dealer" },
  { value: "oreilly", label: "O'Reilly" },
  { value: "autozone", label: "AutoZone" },
  { value: "advance-auto", label: "Advance Auto Parts" },
  { value: "truckpro", label: "TruckPro" },
  { value: "rush-truck", label: "Rush Truck Centers" },
  { value: "penske", label: "Penske" },
  { value: "ryder", label: "Ryder" },
  { value: "loves", label: "Love's" },
  { value: "ta-petro", label: "TA/Petro" },
];

const competitorOptions: MultiSelectOption[] = [
  { value: "bosch", label: "Bosch" },
  { value: "denso", label: "Denso" },
  { value: "delphi", label: "Delphi" },
  { value: "stanadyne", label: "Stanadyne" },
  { value: "diesel-x", label: "Diesel X" },
  { value: "industrial-injection", label: "Industrial Injection" },
  { value: "s-s-diesel", label: "S&S Diesel" },
  { value: "dynomite-diesel", label: "Dynomite Diesel" },
  { value: "dipaco", label: "DIPACO" },
  { value: "pure-power", label: "Pure Power" },
  { value: "alliant-power", label: "Alliant Power" },
];

const productModelOptions: MultiSelectOption[] = [
  { value: "injector-55-75", label: "55-75 Injectors" },
  { value: "injector-reman", label: "Remanufactured Injectors" },
  { value: "injector-new", label: "New Injectors" },
  { value: "pump-hp", label: "High Pressure Pumps" },
  { value: "pump-lift", label: "Lift Pumps" },
  { value: "turbo-reman", label: "Remanufactured Turbos" },
  { value: "turbo-new", label: "New Turbos" },
  { value: "dpf-filters", label: "DPF Filters" },
  { value: "egr-valves", label: "EGR Valves" },
  { value: "sensors-nox", label: "NOx Sensors" },
  { value: "sensors-pressure", label: "Pressure Sensors" },
  { value: "complete-kits", label: "Complete Overhaul Kits" },
];

type VisitDataFormValues = z.infer<typeof visitDataSchema>;

interface VisitDataFormProps {
  defaultValues?: Partial<VisitDataFormValues>;
  onSubmit: (data: VisitDataFormValues) => void;
  isSubmitting?: boolean;
}

// Helper component for required field badge
function RequiredBadge() {
  return <Badge variant="destructive" className="ml-2 text-xs h-5">Required</Badge>;
}

// Helper component for field tooltip
function FieldTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help ml-2" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function VisitDataForm({ defaultValues, onSubmit, isSubmitting = false }: VisitDataFormProps) {
  const { toast } = useToast();
  
  const form = useForm<VisitDataFormValues>({
    resolver: zodResolver(visitDataSchema),
    defaultValues: {
      machineryTypes: defaultValues?.machineryTypes || "",
      engineTypes: defaultValues?.engineTypes || [],
      fleetMakeup: defaultValues?.fleetMakeup || [],
      currentSuppliers: defaultValues?.currentSuppliers || [],
      competitorData: defaultValues?.competitorData || [],
      pricingInfo: defaultValues?.pricingInfo || "",
      productModels: defaultValues?.productModels || [],
      availabilityGaps: defaultValues?.availabilityGaps || "",
      customerNeeds: defaultValues?.customerNeeds || "",
      competitivePosition: defaultValues?.competitivePosition || "",
      insideSalesIssues: defaultValues?.insideSalesIssues || "",
      nextSteps: defaultValues?.nextSteps || "",
      miscNotes: defaultValues?.miscNotes || "",
    },
  });

  // State for "Other" text fields
  const [otherValues, setOtherValues] = useState({
    engineTypes: "",
    fleetMakeup: "",
    currentSuppliers: "",
    competitorData: "",
    productModels: "",
  });

  const handleOtherChange = (field: string, value: string) => {
    setOtherValues(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        machineryTypes: defaultValues.machineryTypes || "",
        engineTypes: defaultValues.engineTypes || [],
        fleetMakeup: defaultValues.fleetMakeup || [],
        currentSuppliers: defaultValues.currentSuppliers || [],
        competitorData: defaultValues.competitorData || [],
        pricingInfo: defaultValues.pricingInfo || "",
        productModels: defaultValues.productModels || [],
        availabilityGaps: defaultValues.availabilityGaps || "",
        customerNeeds: defaultValues.customerNeeds || "",
        competitivePosition: defaultValues.competitivePosition || "",
        insideSalesIssues: defaultValues.insideSalesIssues || "",
        nextSteps: defaultValues.nextSteps || "",
        miscNotes: defaultValues.miscNotes || "",
      });
    }
  }, [defaultValues, form]);
  
  // Custom submit handler to combine multi-select values with "other" text
  const handleSubmit = (data: VisitDataFormValues) => {
    const processedData = {
      ...data,
      engineTypes: data.engineTypes?.filter(v => v !== "other") || [],
      fleetMakeup: data.fleetMakeup?.filter(v => v !== "other") || [],
      currentSuppliers: data.currentSuppliers?.filter(v => v !== "other") || [],
      competitorData: data.competitorData?.filter(v => v !== "other") || [],
      productModels: data.productModels?.filter(v => v !== "other") || [],
    };
    
    // Add "other" text values if they exist
    if (data.engineTypes?.includes("other") && otherValues.engineTypes) {
      processedData.engineTypes = [...processedData.engineTypes, otherValues.engineTypes];
    }
    if (data.fleetMakeup?.includes("other") && otherValues.fleetMakeup) {
      processedData.fleetMakeup = [...processedData.fleetMakeup, otherValues.fleetMakeup];
    }
    if (data.currentSuppliers?.includes("other") && otherValues.currentSuppliers) {
      processedData.currentSuppliers = [...processedData.currentSuppliers, otherValues.currentSuppliers];
    }
    if (data.competitorData?.includes("other") && otherValues.competitorData) {
      processedData.competitorData = [...processedData.competitorData, otherValues.competitorData];
    }
    if (data.productModels?.includes("other") && otherValues.productModels) {
      processedData.productModels = [...processedData.productModels, otherValues.productModels];
    }
    
    onSubmit(processedData);
  };

  // Handle form submission errors
  const onInvalid = () => {
    const errors = form.formState.errors;
    const missingFields: string[] = [];
    
    if (errors.machineryTypes) missingFields.push("Machinery Types");
    if (errors.competitorData) missingFields.push("Competitors");
    if (errors.customerNeeds) missingFields.push("Customer Needs");
    if (errors.nextSteps) missingFields.push("Next Steps");
    
    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please complete the following required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-6">
          {/* Header Card with Overview */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                    Customer Visit Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Complete this form to capture valuable insights from your customer visit. 
                    The more detail you provide, the better we can serve this customer.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="outline" className="text-xs">
                    ~3 min to complete
                  </Badge>
                  <div className="flex gap-1">
                    <Badge variant="destructive" className="text-xs">4 Required</Badge>
                    <Badge variant="secondary" className="text-xs">9 Optional</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Section 1: Equipment & Fleet */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Equipment & Fleet Details</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Understanding their equipment helps us recommend the right parts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Machinery Types Field */}
              <FormField
                control={form.control}
                name="machineryTypes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Machinery Types</FormLabel>
                      <RequiredBadge />
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Why this matters:</p>
                        <p className="text-xs">Different duty classes require different parts specifications. This helps us ensure compatibility.</p>
                      </FieldTooltip>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-machinery-types">
                          <SelectValue placeholder="What weight class vehicles do they service?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Light duty trucks">
                          <div>
                            <div className="font-medium">Light Duty Trucks</div>
                            <div className="text-xs text-muted-foreground">Class 1-3 (up to 14,000 lbs) - Pickups, vans</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="Medium duty trucks">
                          <div>
                            <div className="font-medium">Medium Duty Trucks</div>
                            <div className="text-xs text-muted-foreground">Class 4-6 (14,001-26,000 lbs) - Box trucks, flatbeds</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="Heavy duty trucks">
                          <div>
                            <div className="font-medium">Heavy Duty Trucks</div>
                            <div className="text-xs text-muted-foreground">Class 7-8 (over 26,000 lbs) - Semi trucks, heavy haulers</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="Light & Medium duty">Light & Medium Combination</SelectItem>
                        <SelectItem value="Medium & Heavy duty">Medium & Heavy Combination</SelectItem>
                        <SelectItem value="All duty types">All Duty Types (Full Service)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs mt-2">
                      Tip: Most shops specialize in specific weight classes based on their equipment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Engine Types Field */}
              <FormField
                control={form.control}
                name="engineTypes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Engine Types in Shop</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Pro tip:</p>
                        <p className="text-xs">Look for engine model badges on trucks or ask what they're working on today.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={engineTypeOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select all engines you saw or discussed..."
                        searchPlaceholder="Search engine models..."
                        emptyMessage="No engine type found."
                        allowOther={true}
                        otherValue={otherValues.engineTypes}
                        onOtherChange={(value) => handleOtherChange("engineTypes", value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Common engines: CAT C15 (heavy duty), Cummins ISX (versatile), Detroit DD15 (fuel efficient)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fleet Makeup Field */}
              <FormField
                control={form.control}
                name="fleetMakeup"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Fleet Brands</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Quick identification:</p>
                        <p className="text-xs">Check truck badges, look in the parking lot, or ask about their customer base.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={fleetMakeupOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Which truck brands do they service?"
                        searchPlaceholder="Search brands..."
                        emptyMessage="Brand not found."
                        allowOther={true}
                        otherValue={otherValues.fleetMakeup}
                        onOtherChange={(value) => handleOtherChange("fleetMakeup", value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Select all brands you observed in their shop or parking area
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Suppliers & Competition */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-500/10">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Suppliers & Competition</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Know who we're competing against and current supply chain
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Suppliers */}
              <FormField
                control={form.control}
                name="currentSuppliers"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Current Suppliers</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">What to look for:</p>
                        <p className="text-xs">Check for supplier boxes, invoices on desks, or branded merchandise. Ask "Who do you usually order from?"</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={supplierOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Who are they buying from now?"
                        searchPlaceholder="Search suppliers..."
                        emptyMessage="Supplier not found."
                        allowOther={true}
                        otherValue={otherValues.currentSuppliers}
                        onOtherChange={(value) => handleOtherChange("currentSuppliers", value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Quick win: If they use multiple suppliers, we can consolidate for better pricing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Competitors */}
              <FormField
                control={form.control}
                name="competitorData"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Competitor Products in Use</FormLabel>
                      <RequiredBadge />
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Critical intel:</p>
                        <p className="text-xs">Knowing what brands they trust helps us position our products effectively.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={competitorOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Which competitor brands are they using?"
                        searchPlaceholder="Search competitors..."
                        emptyMessage="Competitor not found."
                        allowOther={true}
                        otherValue={otherValues.competitorData}
                        onOtherChange={(value) => handleOtherChange("competitorData", value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Most common: Bosch (OEM quality), Denso (reliability), Delphi (value)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pricing Information */}
              <FormField
                control={form.control}
                name="pricingInfo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Current Pricing</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">How to ask:</p>
                        <p className="text-xs">"What are you paying for injectors?" or "What's your typical spend on diesel parts?"</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Examples:&#10;• Paying $450/injector from Bosch&#10;• Getting 15% fleet discount from NAPA&#10;• Spending $3-5k/month on parts"
                        data-testid="input-pricing-info"
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Include any discounts, bulk pricing, or payment terms mentioned
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Models */}
              <FormField
                control={form.control}
                name="productModels"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Specific Products Needed</FormLabel>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={productModelOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="What specific parts do they need?"
                        searchPlaceholder="Search products..."
                        emptyMessage="Product not found."
                        allowOther={true}
                        otherValue={otherValues.productModels}
                        onOtherChange={(value) => handleOtherChange("productModels", value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      High-margin items: Reman injectors, complete kits, sensors
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Availability Gaps */}
              <FormField
                control={form.control}
                name="availabilityGaps"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Supply Chain Problems</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Opportunity finder:</p>
                        <p className="text-xs">When competitors can't deliver, we can win the business.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Examples:&#10;• 'Bosch injectors always backordered 2-3 weeks'&#10;• 'Can't find CAT C15 turbos anywhere'&#10;• 'OEM dealer takes forever to get parts'"
                        data-testid="input-availability-gaps"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      These pain points are our best sales opportunities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 3: Customer Intelligence */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-500/10">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Customer Intelligence</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Critical insights to win and keep this customer
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Needs */}
              <FormField
                control={form.control}
                name="customerNeeds"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Customer Needs Assessment</FormLabel>
                      <RequiredBadge />
                      <FieldTooltip>
                        <p className="font-semibold mb-1">The most important field:</p>
                        <p className="text-xs">This drives our entire sales strategy for this customer.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What to capture:&#10;• Main business focus (e.g., 'Fleet maintenance for 50 trucks')&#10;• Current challenges (e.g., 'Downtime costs them $500/hour')&#10;• Immediate needs (e.g., 'Looking for reliable injector supplier')&#10;• Future plans (e.g., 'Adding 10 more trucks next quarter')"
                        data-testid="input-customer-needs"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Be specific - this helps inside sales prepare perfect quotes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Competitive Position */}
              <FormField
                control={form.control}
                name="competitivePosition"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>How MSP Can Win</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Your expert opinion:</p>
                        <p className="text-xs">Based on what you learned, where can MSP beat the competition?</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Examples:&#10;• 'We stock what Bosch doesn't - immediate availability'&#10;• 'Our reman quality exceeds their current supplier'&#10;• 'Can beat their current price by 20% on bulk orders'&#10;• 'Local inventory means same-day delivery'"
                        data-testid="input-competitive-position"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Focus on our strengths: inventory, price, quality, service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Inside Sales Issues */}
              <FormField
                control={form.control}
                name="insideSalesIssues"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Internal Issues to Address</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Help us improve:</p>
                        <p className="text-xs">If our team dropped the ball, we need to know so we can fix it.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Be honest about problems:&#10;• 'Customer frustrated with slow quote response'&#10;• 'Wrong part shipped last order'&#10;• 'Needs dedicated account manager'&#10;• 'Prefers email over phone calls'"
                        data-testid="input-inside-sales-issues"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      This stays internal - used only to improve our service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 4: Action Items */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Next Steps & Follow-Up</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Clear action items to close the sale
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Next Steps */}
              <FormField
                control={form.control}
                name="nextSteps"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Action Items</FormLabel>
                      <RequiredBadge />
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Be specific:</p>
                        <p className="text-xs">Clear next steps = higher close rate. Include WHO does WHAT by WHEN.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List concrete actions:&#10;1. Send quote for 6 reman injectors by tomorrow&#10;2. Inside sales to call with bulk pricing options&#10;3. Schedule follow-up visit next Tuesday&#10;4. Email spec sheets for CAT C15 turbos"
                        data-testid="input-next-steps"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Good example: "Send quote by 3pm Friday" | Poor example: "Follow up later"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Misc Notes */}
              <FormField
                control={form.control}
                name="miscNotes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <FormLabel>Additional Notes</FormLabel>
                      <FieldTooltip>
                        <p className="font-semibold mb-1">Anything else?</p>
                        <p className="text-xs">Personal details, preferred communication style, or other context that helps build the relationship.</p>
                      </FieldTooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Other helpful info:&#10;• 'Owner is John - prefers texts over calls'&#10;• 'Busy season is March-June'&#10;• 'Decision maker is the shop foreman, not owner'&#10;• 'They sponsor local racing team - good marketing opportunity'"
                        data-testid="input-misc-notes"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Include anything that helps us serve them better
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-12"
              disabled={isSubmitting}
              data-testid="button-submit-visit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Visit...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Submit Visit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}