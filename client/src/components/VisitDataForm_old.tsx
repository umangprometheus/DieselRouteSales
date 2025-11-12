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
import { Input } from "@/components/ui/input";
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
  CheckCircle,
  Info
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

export function VisitDataForm({ defaultValues, onSubmit, isSubmitting = false }: VisitDataFormProps) {
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
          {/* Header Card with Progress */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Visit Information Form
                  </CardTitle>
                  <CardDescription>
                    Capture detailed information about your customer visit to help our team provide better service
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    4 Required
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    9 Optional
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Section 1: Equipment & Fleet Information */}
          <Card data-testid="card-equipment-fleet">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Equipment & Fleet Information</CardTitle>
                  <CardDescription>
                    What types of machinery and vehicles are in their shop?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="machineryTypes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        Machinery Types
                      </FormLabel>
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Why we need this:</p>
                          <p className="text-sm">Helps us recommend the right parts and understand their service capabilities.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-machinery-types">
                          <SelectValue placeholder="What weight class do they service?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Light duty trucks">Light duty trucks (Class 1-3, up to 14,000 lbs)</SelectItem>
                        <SelectItem value="Medium duty trucks">Medium duty trucks (Class 4-6, 14,001-26,000 lbs)</SelectItem>
                        <SelectItem value="Heavy duty trucks">Heavy duty trucks (Class 7-8, over 26,000 lbs)</SelectItem>
                        <SelectItem value="Light & Medium duty">Light & Medium duty combination</SelectItem>
                        <SelectItem value="Medium & Heavy duty">Medium & Heavy duty combination</SelectItem>
                        <SelectItem value="All duty types">All duty types (full service shop)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the primary weight class of trucks they service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="engineTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Types</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={engineTypeOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select engine types..."
                      searchPlaceholder="Search engines..."
                      emptyMessage="No engine type found."
                      allowOther={true}
                      otherValue={otherValues.engineTypes}
                      onOtherChange={(value) => handleOtherChange("engineTypes", value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Select specific engine models currently in their shop
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fleetMakeup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fleet Makeup</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={fleetMakeupOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select truck/equipment brands..."
                      searchPlaceholder="Search brands..."
                      emptyMessage="No brand found."
                      allowOther={true}
                      otherValue={otherValues.fleetMakeup}
                      onOtherChange={(value) => handleOtherChange("fleetMakeup", value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Truck or equipment brands represented in their fleet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentSuppliers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Suppliers</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={supplierOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select current suppliers..."
                      searchPlaceholder="Search suppliers..."
                      emptyMessage="No supplier found."
                      allowOther={true}
                      otherValue={otherValues.currentSuppliers}
                      onOtherChange={(value) => handleOtherChange("currentSuppliers", value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Vendors currently providing parts or services
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competitorData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Competitors <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={competitorOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select competitors..."
                      searchPlaceholder="Search competitors..."
                      emptyMessage="No competitor found."
                      allowOther={true}
                      otherValue={otherValues.competitorData}
                      onOtherChange={(value) => handleOtherChange("competitorData", value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Which competitors are they currently using
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricingInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Information</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Per-unit or bulk pricing notes"
                      data-testid="input-pricing-info"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Prices currently paid for relevant products
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productModels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Models</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={productModelOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select product models..."
                      searchPlaceholder="Search products..."
                      emptyMessage="No product model found."
                      allowOther={true}
                      otherValue={otherValues.productModels}
                      onOtherChange={(value) => handleOtherChange("productModels", value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Select specific product models they need or use
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availabilityGaps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Availability Gaps</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Bosch constantly back-ordered on these"
                      data-testid="input-availability-gaps"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Note when suppliers are out of stock or delayed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Customer Needs Assessment <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Needs help finding Cummins reman injectors"
                      data-testid="input-customer-needs"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    What the customer does and what they need next
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competitivePosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Our Competitive Position</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., We can beat price and lead time on Bosch kits"
                      data-testid="input-competitive-position"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Where MSP can compete or add value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insideSalesIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inside Sales Issues</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Delayed quotes causing frustration"
                      data-testid="input-inside-sales-issues"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Any issues with MSP's inside sales team impacting the relationship
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextSteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Next Steps <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Send quote for injectors, Follow up on pricing, Schedule site visit"
                      data-testid="input-next-steps"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Define follow-up actions required
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="miscNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Miscellaneous Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional context that doesn't fit elsewhere"
                      data-testid="input-misc-notes"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={isSubmitting}
            data-testid="button-submit-visit"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Visit
          </Button>
        </div>
      </form>
    </Form>
  );
}
