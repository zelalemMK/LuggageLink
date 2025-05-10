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
import { insertPackageSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { formatDateForInput } from "@/lib/utils";

// Extend the insertPackageSchema to add validation
const formSchema = insertPackageSchema.extend({
  dimensions: z.object({
    length: z.number().min(1, "Length must be at least 1 cm"),
    width: z.number().min(1, "Width must be at least 1 cm"),
    height: z.number().min(1, "Height must be at least 1 cm"),
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type PackageFormValues = z.infer<typeof formSchema>;

export function PackageForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Default values for the form
  const defaultValues: Partial<PackageFormValues> = {
    senderCity: "",
    receiverCity: "Addis Ababa",
    packageType: "Full Luggage",
    weight: 20,
    dimensions: {
      length: 55,
      width: 40,
      height: 25,
    },
    deliveryDeadline: new Date(),
    offeredPayment: 200,
    description: "",
    terms: false,
  };

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const packageMutation = useMutation({
    mutationFn: async (data: PackageFormValues) => {
      // Remove the terms field as it's not part of the API schema
      const { terms, ...packageData } = data;
      const res = await apiRequest("POST", "/api/packages", packageData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package posted successfully",
        description: "Your package request has been posted and is now visible to travelers.",
      });
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to post package",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  function onSubmit(values: PackageFormValues) {
    setSubmitting(true);
    packageMutation.mutate(values);
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Post a Package to Send to Ethiopia</h3>
      <p className="text-gray-600 mb-6">Full luggage is our most popular option - send an entire suitcase to Ethiopia and save on shipping costs!</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="senderCity"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Your City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiverCity"
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
                      <SelectItem value="Other">Other (specify in description)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Package Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full Luggage">Full Luggage (Standard Suitcase)</SelectItem>
                      <SelectItem value="Half Luggage">Half Luggage (Shared Suitcase)</SelectItem>
                      <SelectItem value="Documents">Documents</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Medications">Medications</SelectItem>
                      <SelectItem value="Food Items">Food Items</SelectItem>
                      <SelectItem value="Other">Other (specify in description)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Package Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2.5"
                      {...field}
                      value={field.value.toString()}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sm:col-span-6">
              <FormLabel className="block text-sm font-medium text-gray-700">Package Dimensions (cm)</FormLabel>
              <div className="mt-1 grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="dimensions.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Length"
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
                  name="dimensions.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Width"
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
                  name="dimensions.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Height"
                          {...field}
                          value={field.value.toString()}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="deliveryDeadline"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Need By Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        date.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone issues
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offeredPayment"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Payment Offered (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
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
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Package Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your package in detail, including contents and any special handling instructions."
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
                      I confirm this package complies with airline and customs regulations.
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
              disabled={submitting || packageMutation.isPending}
            >
              {(submitting || packageMutation.isPending) ? "Posting..." : "Post Package"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
