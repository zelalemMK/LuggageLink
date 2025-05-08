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

const formSchema = z.object({
  departureCity: z.string().optional(),
  destinationCity: z.string().optional(),
  deliveryDate: z.string().optional(),
  packageWeight: z.string().optional(),
  packageType: z.string().optional(),
});

type PackagesFilterFormValues = z.infer<typeof formSchema>;

interface PackagesFilterProps {
  onApplyFilters: (filters: PackagesFilterFormValues) => void;
}

export function PackagesFilter({ onApplyFilters }: PackagesFilterProps) {
  const form = useForm<PackagesFilterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departureCity: "",
      destinationCity: "",
      deliveryDate: "",
      packageWeight: "",
      packageType: "",
    },
  });

  function onSubmit(values: PackagesFilterFormValues) {
    onApplyFilters(values);
  }

  return (
    <div className="w-full bg-white rounded-lg shadow mb-6 md:mb-0 h-fit sticky top-20">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Packages</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departureCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departure City</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="Washington, DC">Washington, DC</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="Toronto">Toronto</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
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
                      <SelectItem value="">Any</SelectItem>
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
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery By</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="packageWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Weight</FormLabel>
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
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">Under 1 kg</SelectItem>
                      <SelectItem value="3">1-3 kg</SelectItem>
                      <SelectItem value="5">3-5 kg</SelectItem>
                      <SelectItem value="10">5-10 kg</SelectItem>
                      <SelectItem value="10+">Over 10 kg</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="Documents">Documents</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Medications">Medications</SelectItem>
                      <SelectItem value="Food Items">Food Items</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
