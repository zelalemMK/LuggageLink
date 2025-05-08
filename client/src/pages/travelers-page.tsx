import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TravelerCard } from "@/components/listings/traveler-card";
import { TravelersFilter } from "@/components/listings/travelers-filter";
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

export default function TravelersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTraveler, setSelectedTraveler] = useState<any>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch travelers with applied filters
  const { data: travelers, isLoading } = useQuery({
    queryKey: ["/api/trips", filters],
    queryFn: async () => {
      // Convert filters to query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const res = await fetch(`/api/trips?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch travelers");
      }
      
      return res.json();
    },
  });

  const handleContactClick = (traveler: any) => {
    if (!user) {
      toast({
        title: "Authentication required", 
        description: "Please sign in to send packages with travelers",
      });
      setLocation("/auth?redirect=/travelers");
      return;
    }

    setSelectedTraveler(traveler);
    setMessageOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedTraveler.user.id,
        content: message,
      });

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${selectedTraveler.user.firstName}`,
      });

      setMessageOpen(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    // Convert verification checkboxes to API format
    const apiFilters: any = {};
    
    if (newFilters.destinationCity) apiFilters.destinationCity = newFilters.destinationCity;
    if (newFilters.departureDate) apiFilters.departureDate = newFilters.departureDate;
    if (newFilters.minWeight) apiFilters.availableWeight = newFilters.minWeight;
    if (newFilters.minRating) apiFilters.minRating = newFilters.minRating;

    setFilters(apiFilters);
    setCurrentPage(1);
  };

  return (
    <>
      <Helmet>
        <title>Find Travelers to Ethiopia - LuggageLink</title>
        <meta name="description" content="Browse available travelers who are heading to Ethiopia and can take your packages with them." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gray-200 mb-8">
              <h1 className="text-2xl font-bold text-gray-900 pb-4">Available Travelers</h1>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Filters */}
              <div className="w-full md:w-1/4 mb-6 md:mb-0">
                <TravelersFilter onApplyFilters={handleApplyFilters} />
              </div>

              {/* Travelers List */}
              <div className="w-full md:w-3/4 space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : travelers && travelers.length > 0 ? (
                  <>
                    {travelers.map((traveler: any) => (
                      <TravelerCard
                        key={traveler.id}
                        traveler={traveler.user}
                        trip={traveler}
                        onContactClick={() => handleContactClick(traveler)}
                      />
                    ))}

                    {/* Pagination */}
                    <div className="mt-6 flex justify-center">
                      <Pagination
                        totalItems={travelers.length}
                        itemsPerPage={10}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">No travelers found</h3>
                    <p className="text-gray-500 mb-6">
                      No travelers match your criteria. Try adjusting your filters or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {/* Message Dialog */}
        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Send message to {selectedTraveler?.user?.firstName}{" "}
                {selectedTraveler?.user?.lastName.charAt(0)}.
              </DialogTitle>
              <DialogDescription>
                Start a conversation to discuss package details, pricing, and logistics.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I would like to send a package with you to Ethiopia..."
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
                onClick={handleSendMessage}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
