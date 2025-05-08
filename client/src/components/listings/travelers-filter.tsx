import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  departureAirport: z.string().optional(),
  destinationCity: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  minWeight: z.string().optional(),
  idVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  addressVerified: z.boolean().default(false),
  minRating: z.string().optional(),
});

type TravelersFilterFormValues = z.infer<typeof formSchema>;

interface TravelersFilterProps {
  onApplyFilters: (filters: TravelersFilterFormValues) => void;
}

export function TravelersFilter({ onApplyFilters }: TravelersFilterProps) {
  const form = useForm<TravelersFilterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departureAirport: "",
      destinationCity: "",
      departureDate: "",
      returnDate: "",
      minWeight: "",
      idVerified: false,
      phoneVerified: false,
      addressVerified: false,
      minRating: "",
    },
  });

  function onSubmit(values: TravelersFilterFormValues) {
    onApplyFilters(values);
  }

  return (
    <div className="w-full bg-white rounded-lg shadow mb-6 md:mb-0 h-fit sticky top-20">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Travelers</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departureAirport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departure Airport</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. JFK, LAX" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
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
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Addis Ababa">Addis Ababa</SelectItem>
                      <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                      <SelectItem value="Bahir Dar">Bahir Dar</SelectItem>
                      <SelectItem value="Hawassa">Hawassa</SelectItem>
                      <SelectItem value="Mek'ele">Mek'ele</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Date Range (Start)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Date Range (End)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min. Weight Capacity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any weight" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1 kg</SelectItem>
                      <SelectItem value="2">2 kg</SelectItem>
                      <SelectItem value="5">5 kg</SelectItem>
                      <SelectItem value="10">10 kg</SelectItem>
                      <SelectItem value="15">15+ kg</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Verification Level</FormLabel>
              <div className="mt-1 space-y-2">
                <FormField
                  control={form.control}
                  name="idVerified"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="idVerified"
                        />
                      </FormControl>
                      <FormLabel htmlFor="idVerified" className="text-sm text-gray-700 cursor-pointer">
                        ID Verified
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneVerified"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="phoneVerified"
                        />
                      </FormControl>
                      <FormLabel htmlFor="phoneVerified" className="text-sm text-gray-700 cursor-pointer">
                        Phone Verified
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressVerified"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="addressVerified"
                        />
                      </FormControl>
                      <FormLabel htmlFor="addressVerified" className="text-sm text-gray-700 cursor-pointer">
                        Address Verified
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="minRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min. Rating</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Apply Filters
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}