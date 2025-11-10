import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const visitDataSchema = z.object({
  machineryTypes: z.string().optional(),
  engineTypes: z.string().optional(),
  fleetMakeup: z.string().optional(),
  currentSuppliers: z.string().optional(),
  competitorData: z.string().optional(),
  pricingInfo: z.string().optional(),
  productModels: z.string().optional(),
  availabilityGaps: z.string().optional(),
  customerNeeds: z.string().optional(),
  competitivePosition: z.string().optional(),
  insideSalesIssues: z.string().optional(),
  nextSteps: z.string().optional(),
  miscNotes: z.string().optional(),
});

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
      engineTypes: defaultValues?.engineTypes || "",
      fleetMakeup: defaultValues?.fleetMakeup || "",
      currentSuppliers: defaultValues?.currentSuppliers || "",
      competitorData: defaultValues?.competitorData || "",
      pricingInfo: defaultValues?.pricingInfo || "",
      productModels: defaultValues?.productModels || "",
      availabilityGaps: defaultValues?.availabilityGaps || "",
      customerNeeds: defaultValues?.customerNeeds || "",
      competitivePosition: defaultValues?.competitivePosition || "",
      insideSalesIssues: defaultValues?.insideSalesIssues || "",
      nextSteps: defaultValues?.nextSteps || "",
      miscNotes: defaultValues?.miscNotes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card data-testid="card-visit-data-form">
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
            <CardDescription>
              Review and edit the information from your visit. All fields are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="machineryTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machinery Types</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-machinery-types">
                        <SelectValue placeholder="Select machinery type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Light duty trucks">Light duty trucks</SelectItem>
                      <SelectItem value="Medium duty trucks">Medium duty trucks</SelectItem>
                      <SelectItem value="Heavy duty trucks">Heavy duty trucks</SelectItem>
                      <SelectItem value="Light & Medium duty">Light & Medium duty</SelectItem>
                      <SelectItem value="Medium & Heavy duty">Medium & Heavy duty</SelectItem>
                      <SelectItem value="All duty types">All duty types</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What type of machinery does the customer work on?
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
                    <Textarea
                      {...field}
                      placeholder="e.g., CAT C15, Cummins ISX, Detroit Series 60"
                      data-testid="input-engine-types"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    List specific engine models currently in their shop
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
                    <Textarea
                      {...field}
                      placeholder="e.g., Freightliner, Ford, Chevrolet, Mack, Volvo"
                      data-testid="input-fleet-makeup"
                      rows={2}
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
                    <Textarea
                      {...field}
                      placeholder="e.g., NAPA, FleetPride, OEM dealer"
                      data-testid="input-current-suppliers"
                      rows={2}
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
                  <FormLabel>Competitor Data</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Uses Diesel X for injectors at $450 each"
                      data-testid="input-competitor-data"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Which competitors they use and what they're paying
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
                  <FormLabel>Specific Product Models</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., 55-75 injectors (be specific, not generic)"
                      data-testid="input-product-models"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Capture precise model numbers rather than generic names
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
                  <FormLabel>Customer Needs Assessment</FormLabel>
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
                  <FormLabel>Next Steps</FormLabel>
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
