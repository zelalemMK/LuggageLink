import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
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
import { AirportInput } from "@/components/ui/airport-input";

// Regular expression to validate IATA airport codes (3 uppercase letters) or full airport names
const airportCodeRegex = /^([A-Z]{3}|\w+[\w\s-]*\s*(international|airport|intl).*)$/i;

// Extend the insertTripSchema to add validation
const formSchema = insertTripSchema.extend({
  ticketNumber: z.string().optional(),
  lastName: z.string().optional(),
  ticketPhoto: z.instanceof(File).optional(),
  departureAirport: z.string()
    .min(3, "Airport code must be at least 3 characters")
    .refine((value) => airportCodeRegex.test(value), {
      message: "Please enter a valid airport code (e.g., JFK, LAX) or full airport name",
    }),
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
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [location, setLocation] = useLocation(); // Added useLocation hook

  // Default values for the form
  const defaultValues: Partial<TripFormValues> = {
    departureAirport: "",
    destinationCity: "Addis Ababa",
    departureDate: formatDateForInput(new Date()),
    arrivalDate: formatDateForInput(new Date(Date.now() + 86400000)), // Tomorrow
    ticketNumber: "",
    lastName: "",
    availableWeight: 5,
    pricePerKg: 15,
    notes: "",
    terms: false,
  };

  const lookupFlight = async (ticketNumber: string, lastName: string) => {
    if (!ticketNumber || !lastName) return;

    setIsLookingUp(true);
    try {
      // Temporary mock data for testing
      if (ticketNumber.length >= 6) {
        // Mock different flights based on ticket number
        const airports = ["JFK", "IAD", "LAX", "ORD", "BOS"];
        const departureAirport = airports[parseInt(ticketNumber.slice(-1)) % airports.length];

        // Generate dates 2-7 days in future
        const daysToAdd = 2 + (parseInt(ticketNumber.slice(-2)) % 5);
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() + daysToAdd);

        const arrivalDate = new Date(departureDate);
        arrivalDate.setHours(arrivalDate.getHours() + 15); // 15 hour flight

        const flightInfo = {
          departureAirport,
          destinationCity: "Addis Ababa",
          departureDate,
          arrivalDate,
        };
        form.setValue("departureAirport", flightInfo.departureAirport);
        form.setValue("destinationCity", flightInfo.destinationCity);
        form.setValue("departureDate", formatDateForInput(flightInfo.departureDate));
        form.setValue("arrivalDate", formatDateForInput(flightInfo.arrivalDate));

        toast({
          title: "Flight found",
          description: "Flight details have been populated",
        });
      } else {
        toast({
          title: "Flight not found",
          description: "Please enter a valid ticket number and last name",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error looking up flight",
        description: "Failed to fetch flight details",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const form = useForm<TripFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const tripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      // Convert date strings to ISO format
      const formattedData = {
        ...data,
        departureDate: new Date(data.departureDate).toISOString(),
        arrivalDate: new Date(data.arrivalDate).toISOString()
      };
      const res = await apiRequest("POST", "/api/trips", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip posted successfully",
        description: "Your trip has been posted and is now visible to package senders.",
      });
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/user"] });
      setLocation("/dashboard");
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
    if (!values.departureAirport) {
      toast({
        title: "Flight lookup required", 
        description: "Please perform flight lookup before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    // Create a copy of values with proper date conversions and validation
    const departureDate = new Date(values.departureDate);
    const arrivalDate = new Date(values.arrivalDate);

    // Validate that departure is not before today and arrival not before departure
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate < today) {
      toast({
        title: "Invalid departure date",
        description: "Departure date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (arrivalDate < departureDate) {
      toast({
        title: "Invalid arrival date",
        description: "Arrival date must be after departure date",
        variant: "destructive",
      });
      return;
    }

    try {
      const departureDateObj = new Date(values.departureDate);
      const arrivalDateObj = new Date(values.arrivalDate);

      if (isNaN(departureDateObj.getTime()) || isNaN(arrivalDateObj.getTime())) {
        toast({
          title: "Invalid date format", 
          description: "Please ensure dates are in valid format",
          variant: "destructive",
        });
        return;
      }

      // Ensure dates are valid
      if (!departureDateObj || !arrivalDateObj || isNaN(departureDateObj.getTime()) || isNaN(arrivalDateObj.getTime())) {
        toast({
          title: "Invalid dates",
          description: "Please enter valid departure and arrival dates",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Set time to noon UTC to avoid timezone issues
      departureDateObj.setUTCHours(12, 0, 0, 0);
      arrivalDateObj.setUTCHours(12, 0, 0, 0);

      const formattedValues = {
        ...values,
        departureDate: departureDateObj.toISOString(),
        arrivalDate: arrivalDateObj.toISOString(),
        availableWeight: Number(values.availableWeight),
        pricePerKg: Number(values.pricePerKg)
      };

      tripMutation.mutate(formattedValues);
    } catch (error) {
      toast({
        title: "Form submission error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Post Your Trip to Ethiopia</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="ticketNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Ticket Number*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 071234567890" {...field} disabled={isLookingUp} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketPhoto"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Ticket Photo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Take a photo of your ticket or upload an existing one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Last Name*</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} disabled={isLookingUp} />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="secondary"
                      onClick={() => lookupFlight(form.getValues("ticketNumber") ?? "", field.value ?? "")}
                      disabled={isLookingUp || !field.value || !form.getValues("ticketNumber")}
                    >
                      {isLookingUp ? "Looking up..." : "Lookup"}
                    </Button>
                  </div>
                  <FormDescription className="text-red-500">
                    Enter ticket number and last name, then click lookup
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departureAirport"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Departure Airport</FormLabel>
                  <FormControl>
                    <AirportInput 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search for airports (e.g. JFK, LAX)"
                    />
                  </FormControl>
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
                      value={field.value ?? ''}
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