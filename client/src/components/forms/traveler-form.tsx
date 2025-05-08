import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { insertTripSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { formatDateForInput } from "@/lib/utils";

// Extend the insertTripSchema to add validation
const formSchema = insertTripSchema.extend({
  departureDate: z.string().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) >= today;
  }, "Departure date must be today or in the future"),
  arrivalDate: z.string().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) >= today;
  }, "Arrival date must be today or in the future"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type TripFormValues = z.infer<typeof formSchema>;

export function TravelerForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Default values for the form
  const defaultValues: Partial<TripFormValues> = {
    departureAirport: "",
    destinationCity: "Addis Ababa",
    departureDate: formatDateForInput(new Date()),
    arrivalDate: formatDateForInput(new Date(Date.now() + 86400000)), // Tomorrow
    airline: "",
    flightNumber: "",
    availableWeight: 5,
    pricePerKg: 15,
    notes: "",
    terms: false,
  };

  const form = useForm<TripFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const tripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      // Remove the terms field as it's not part of the API schema
      const { terms, ...tripData } = data;
      const res = await apiRequest("POST", "/api/trips", tripData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip posted successfully",
        description: "Your trip has been posted and is now visible to package senders.",
      });
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to post trip",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  function onSubmit(values: TripFormValues) {
    setSubmitting(true);
    tripMutation.mutate(values);
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Post Your Trip to Ethiopia</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="departureAirport"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Departure Airport</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. JFK, LAX" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the airport code or name where you'll depart from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Destination in Ethiopia</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Addis Ababa">Addis Ababa</SelectItem>
                      <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                      <SelectItem value="Bahir Dar">Bahir Dar</SelectItem>
                      <SelectItem value="Hawassa">Hawassa</SelectItem>
                      <SelectItem value="Mek'ele">Mek'ele</SelectItem>
                      <SelectItem value="Other">Other (specify in notes)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Departure Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="arrivalDate"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Arrival Date in Ethiopia</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="airline"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Airline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ethiopian Airlines" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flightNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Flight Number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ET501" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableWeight"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Available Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      {...field}
                      value={field.value.toString()}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerKg"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Price per kg (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      {...field}
                      value={field.value.toString()}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Include any restrictions (e.g., no electronics, no food items) or other important information."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="sm:col-span-6 flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the <a href="#" className="text-primary-600 hover:text-primary-500">terms and conditions</a>
                    </FormLabel>
                    <FormDescription>
                      I confirm I have the space available and will handle all customs requirements.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-3"
              onClick={() => form.reset(defaultValues)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || tripMutation.isPending}
            >
              {(submitting || tripMutation.isPending) ? "Posting..." : "Post Trip"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
