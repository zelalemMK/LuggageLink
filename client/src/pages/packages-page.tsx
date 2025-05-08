import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PackageCard } from "@/components/listings/package-card";
import { PackagesFilter } from "@/components/listings/packages-filter";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

export default function PackagesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch packages with applied filters
  const { data: packages, isLoading } = useQuery({
    queryKey: ["/api/packages", filters],
    queryFn: async () => {
      // Convert filters to query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const res = await fetch(`/api/packages?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch packages");
      }
      
      return res.json();
    },
  });

  const handleOfferClick = (packageItem: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to offer delivery services",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    setSelectedPackage(packageItem);
    setMessageOpen(true);
  };

  const handleSendOffer = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to accompany your offer",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      // Find a trip for the current user
      const tripsRes = await fetch("/api/trips/user", {
        credentials: "include",
      });
      
      if (!tripsRes.ok) {
        throw new Error("Failed to fetch your trips");
      }
      
      const trips = await tripsRes.json();
      
      if (!trips || trips.length === 0) {
        toast({
          title: "No active trips",
          description: "You need to post a trip before you can offer to deliver packages",
          variant: "destructive",
        });
        return;
      }
      
      // Use the most recent trip
      const tripId = trips[0].id;
      
      // Create a delivery request
      await apiRequest("POST", "/api/deliveries", {
        tripId,
        packageId: selectedPackage.id,
        travelerId: user.id,
        senderId: selectedPackage.user.id,
      });
      
      // Send a message to the sender
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedPackage.user.id,
        content: message,
      });

      toast({
        title: "Offer sent",
        description: `Your offer to deliver ${selectedPackage.user.firstName}'s package has been sent`,
      });

      setMessageOpen(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/user"] });
    } catch (error) {
      toast({
        title: "Failed to send offer",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    const apiFilters: any = {};
    
    if (newFilters.departureCity) apiFilters.senderCity = newFilters.departureCity;
    if (newFilters.destinationCity) apiFilters.receiverCity = newFilters.destinationCity;
    if (newFilters.deliveryDate) apiFilters.deliveryDeadline = newFilters.deliveryDate;
    if (newFilters.packageWeight) apiFilters.weight = newFilters.packageWeight;
    if (newFilters.packageType) apiFilters.packageType = newFilters.packageType;

    setFilters(apiFilters);
    setCurrentPage(1);
  };

  // Check if a package is urgent (delivery needed within 7 days)
  const isPackageUrgent = (packageItem: any) => {
    if (!packageItem.deliveryDeadline) return false;
    
    const deadline = new Date(packageItem.deliveryDeadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7 && diffDays >= 0;
  };

  return (
    <>
      <Helmet>
        <title>Package Requests to Ethiopia - LuggageLink</title>
        <meta name="description" content="Browse pending package requests that need to be delivered to Ethiopia. Find packages you can deliver on your next trip." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gray-200 mb-8">
              <h1 className="text-2xl font-bold text-gray-900 pb-4">Package Requests</h1>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Filters */}
              <div className="w-full md:w-1/4 mb-6 md:mb-0">
                <PackagesFilter onApplyFilters={handleApplyFilters} />
              </div>

              {/* Packages List */}
              <div className="w-full md:w-3/4 space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : packages && packages.length > 0 ? (
                  <>
                    {packages.map((packageItem: any) => (
                      <PackageCard
                        key={packageItem.id}
                        sender={packageItem.user}
                        packageItem={packageItem}
                        isUrgent={isPackageUrgent(packageItem)}
                        onOfferClick={() => handleOfferClick(packageItem)}
                      />
                    ))}

                    {/* Pagination */}
                    <div className="mt-6 flex justify-center">
                      <Pagination
                        totalItems={packages.length}
                        itemsPerPage={10}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">No package requests found</h3>
                    <p className="text-gray-500 mb-6">
                      No packages match your criteria. Try adjusting your filters or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {/* Offer Dialog */}
        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Offer to deliver {selectedPackage?.user?.firstName}'s package
              </DialogTitle>
              <DialogDescription>
                Send a message to discuss details, pricing, and logistics for delivering this package.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm traveling to Ethiopia soon and can deliver your package..."
              className="min-h-[120px]"
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setMessageOpen(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendOffer}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Offer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
