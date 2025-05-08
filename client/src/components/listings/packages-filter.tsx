
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
      departureCity: "any",
      destinationCity: "any",
      deliveryDate: "",
      packageWeight: "any",
      packageType: "any",
    },
  });

  function onSubmit(values: PackagesFilterFormValues) {
    const filters = { ...values };
    // Convert "any" back to empty string for API
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof PackagesFilterFormValues] === "any") {
        filters[key as keyof PackagesFilterFormValues] = "";
      }
    });
    onApplyFilters(filters);
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
                      <SelectItem value="any">Any City</SelectItem>
                      <SelectItem value="new-york">New York</SelectItem>
                      <SelectItem value="washington-dc">Washington, DC</SelectItem>
                      <SelectItem value="london">London</SelectItem>
                      <SelectItem value="toronto">Toronto</SelectItem>
                      <SelectItem value="dubai">Dubai</SelectItem>
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
                      <SelectItem value="any">Any City</SelectItem>
                      <SelectItem value="addis-ababa">Addis Ababa</SelectItem>
                      <SelectItem value="dire-dawa">Dire Dawa</SelectItem>
                      <SelectItem value="bahir-dar">Bahir Dar</SelectItem>
                      <SelectItem value="hawassa">Hawassa</SelectItem>
                      <SelectItem value="mekele">Mek'ele</SelectItem>
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
                      <SelectItem value="any">Any Weight</SelectItem>
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
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="medications">Medications</SelectItem>
                      <SelectItem value="food">Food Items</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
