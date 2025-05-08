import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Loader2, Clock, Check, X, TruckIcon, Package, Send, Calendar, Plane, MapPin, DollarSign, Luggage } from "lucide-react";
import { Helmet } from "react-helmet";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("trips");
  const [, setLocation] = useLocation();

  // Fetch user's trips
  const { data: trips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["/api/trips/user"],
    queryFn: async () => {
      const res = await fetch("/api/trips/user", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch trips");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch user's packages
  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ["/api/packages/user"],
    queryFn: async () => {
      const res = await fetch("/api/packages/user", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch packages");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch user's deliveries
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["/api/deliveries/user"],
    queryFn: async () => {
      const res = await fetch("/api/deliveries/user", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch deliveries");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Update delivery status mutation
  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/deliveries/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/user"] });
    },
  });

  // Update payment status mutation
  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const res = await apiRequest("PUT", `/api/deliveries/${id}/payment`, { paymentStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/user"] });
    },
  });

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Accepted</Badge>;
      case "in_transit":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">In Transit</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to get payment status badge
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "in_escrow":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Escrow</Badge>;
      case "released":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Released</Badge>;
      case "refunded":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to filter deliveries by role
  const getDeliveriesByRole = (role: 'traveler' | 'sender') => {
    if (!deliveries) return [];
    return deliveries.filter(d => 
      role === 'traveler' ? d.travelerId === user?.id : d.senderId === user?.id
    );
  };

  // Loading state
  const isLoading = isLoadingTrips || isLoadingPackages || isLoadingDeliveries;

  return (
    <>
      <Helmet>
        <title>Dashboard - LuggageLink</title>
        <meta name="description" content="Manage your trips, packages, and deliveries on LuggageLink." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage your trips, packages, and deliveries</p>
            </div>

            <Tabs 
              defaultValue="trips" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="trips">My Trips</TabsTrigger>
                <TabsTrigger value="packages">My Packages</TabsTrigger>
                <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <TabsContent value="trips" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium">Your Trips to Ethiopia</h2>
                      <Link href="/post">
                        <Button>Post New Trip</Button>
                      </Link>
                    </div>

                    {trips && trips.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {trips.map((trip: any) => (
                          <Card key={trip.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  {trip.departureCity} to {trip.destinationCity}
                                </CardTitle>
                                <Badge variant={trip.isActive ? "default" : "secondary"}>
                                  {trip.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>Departure: {formatDate(trip.departureDate, "PPP")}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Plane className="h-4 w-4 mr-2" />
                                  <span>
                                    {trip.airline} {trip.flightNumber && `(${trip.flightNumber})`}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Luggage className="h-4 w-4 mr-2" />
                                  <span>Available weight: {trip.availableWeight} kg</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  <span>${trip.pricePerKg}/kg</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement edit functionality
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant={trip.isActive ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement toggle active functionality
                                    }}
                                  >
                                    {trip.isActive ? "Deactivate" : "Activate"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Plane className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                          <p className="text-gray-500 mb-4 text-center max-w-md">
                            You haven't posted any trips to Ethiopia yet. When you're planning a trip, 
                            consider posting it here to help others send packages.
                          </p>
                          <Link href="/post">
                            <Button>Post Your Trip</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="packages" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium">Your Packages to Ethiopia</h2>
                      <Link href="/post">
                        <Button>Post New Package</Button>
                      </Link>
                    </div>

                    {packages && packages.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {packages.map((pkg: any) => (
                          <Card key={pkg.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  {pkg.packageType} to {pkg.receiverCity}
                                </CardTitle>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant={pkg.isActive ? "default" : "secondary"}>
                                    {pkg.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {pkg.status && getStatusBadge(pkg.status)}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span>From: {pkg.senderCity}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Package className="h-4 w-4 mr-2" />
                                  <span>Weight: {pkg.weight} kg</span>
                                </div>
                                {pkg.deliveryDeadline && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>Needed by: {formatDate(pkg.deliveryDeadline, "PPP")}</span>
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  <span>Offered: ${pkg.offeredPayment}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Package className="h-4 w-4 mr-2" />
                                  <span>Description: {pkg.description.substring(0, 100)}{pkg.description.length > 100 ? '...' : ''}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement edit functionality
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant={pkg.isActive ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement toggle active functionality
                                    }}
                                  >
                                    {pkg.isActive ? "Deactivate" : "Activate"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Package className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                          <p className="text-gray-500 mb-4 text-center max-w-md">
                            You haven't posted any packages to send to Ethiopia yet. When you need to send something, 
                            post your package details here to find a traveler.
                          </p>
                          <Link href="/post">
                            <Button>Post Your Package</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="deliveries" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium">Your Deliveries</h2>
                    </div>

                    {deliveries && deliveries.length > 0 ? (
                      <Tabs defaultValue="asCarrier" className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="asCarrier">As Carrier</TabsTrigger>
                          <TabsTrigger value="asSender">As Sender</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="asCarrier" className="space-y-4">
                          {getDeliveriesByRole('traveler').length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              {getDeliveriesByRole('traveler').map((delivery: any) => (
                                <Card key={delivery.id}>
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-lg">
                                        Delivery #{delivery.id}
                                      </CardTitle>
                                      <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(delivery.status)}
                                        {getPaymentBadge(delivery.paymentStatus)}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Package className="h-4 w-4 mr-2" />
                                        <span>Package: {delivery.package?.packageType} ({delivery.package?.weight} kg)</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Send className="h-4 w-4 mr-2" />
                                        <span>Sender: {delivery.sender?.firstName} {delivery.sender?.lastName.charAt(0)}.</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span>Route: {delivery.package?.senderCity} → {delivery.package?.receiverCity}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        <span>Payment: ${delivery.package?.offeredPayment}</span>
                                      </div>
                                      <Separator className="my-2" />
                                      <div className="flex justify-between pt-2">
                                        <Link href={`/messages/${delivery.senderId}`}>
                                          <Button variant="outline" size="sm">
                                            Message Sender
                                          </Button>
                                        </Link>
                                        {delivery.status === "accepted" && (
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              updateDeliveryStatus.mutate({
                                                id: delivery.id,
                                                status: "in_transit",
                                              });
                                            }}
                                            disabled={updateDeliveryStatus.isPending}
                                          >
                                            {updateDeliveryStatus.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <TruckIcon className="h-4 w-4 mr-2" />
                                            )}
                                            Confirm Pickup
                                          </Button>
                                        )}
                                        {delivery.status === "in_transit" && (
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              updateDeliveryStatus.mutate({
                                                id: delivery.id,
                                                status: "delivered",
                                              });
                                            }}
                                            disabled={updateDeliveryStatus.isPending}
                                          >
                                            {updateDeliveryStatus.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <Check className="h-4 w-4 mr-2" />
                                            )}
                                            Mark as Delivered
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                <TruckIcon className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries as carrier</h3>
                                <p className="text-gray-500 mb-4 text-center max-w-md">
                                  You don't have any deliveries as a carrier yet. Browse package requests to find ones you can deliver.
                                </p>
                                <Link href="/packages">
                                  <Button>Browse Packages</Button>
                                </Link>
                              </CardContent>
                            </Card>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="asSender" className="space-y-4">
                          {getDeliveriesByRole('sender').length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              {getDeliveriesByRole('sender').map((delivery: any) => (
                                <Card key={delivery.id}>
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-lg">
                                        Delivery #{delivery.id}
                                      </CardTitle>
                                      <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(delivery.status)}
                                        {getPaymentBadge(delivery.paymentStatus)}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Package className="h-4 w-4 mr-2" />
                                        <span>Package: {delivery.package?.packageType} ({delivery.package?.weight} kg)</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Plane className="h-4 w-4 mr-2" />
                                        <span>Carrier: {delivery.traveler?.firstName} {delivery.traveler?.lastName.charAt(0)}.</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span>Route: {delivery.package?.senderCity} → {delivery.package?.receiverCity}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-500">
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        <span>Payment: ${delivery.package?.offeredPayment}</span>
                                      </div>
                                      <Separator className="my-2" />
                                      <div className="flex justify-between pt-2">
                                        <Link href={`/messages/${delivery.travelerId}`}>
                                          <Button variant="outline" size="sm">
                                            Message Carrier
                                          </Button>
                                        </Link>
                                        {delivery.status === "pending" && (
                                          <div className="flex gap-2">
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                updateDeliveryStatus.mutate({
                                                  id: delivery.id,
                                                  status: "cancelled",
                                                });
                                              }}
                                              disabled={updateDeliveryStatus.isPending}
                                            >
                                              <X className="h-4 w-4 mr-2" />
                                              Reject
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                updateDeliveryStatus.mutate({
                                                  id: delivery.id,
                                                  status: "accepted",
                                                });
                                              }}
                                              disabled={updateDeliveryStatus.isPending}
                                            >
                                              <Check className="h-4 w-4 mr-2" />
                                              Accept
                                            </Button>
                                          </div>
                                        )}
                                        {delivery.status === "accepted" && delivery.paymentStatus === "pending" && (
                                          <Link href={`/payment/${delivery.id}`}>
                                            <Button size="sm">
                                              <DollarSign className="h-4 w-4 mr-2" />
                                              Make Payment
                                            </Button>
                                          </Link>
                                        )}
                                        {delivery.status === "delivered" && delivery.paymentStatus === "in_escrow" && (
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              updatePaymentStatus.mutate({
                                                id: delivery.id,
                                                paymentStatus: "released",
                                              });
                                            }}
                                            disabled={updatePaymentStatus.isPending}
                                          >
                                            {updatePaymentStatus.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <Check className="h-4 w-4 mr-2" />
                                            )}
                                            Confirm & Release Payment
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries as sender</h3>
                                <p className="text-gray-500 mb-4 text-center max-w-md">
                                  You don't have any deliveries as a sender yet. Browse available travelers to find ones that can carry your packages.
                                </p>
                                <Link href="/travelers">
                                  <Button>Browse Travelers</Button>
                                </Link>
                              </CardContent>
                            </Card>
                          )}
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <TruckIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                          <p className="text-gray-500 mb-4 text-center max-w-md">
                            You don't have any active deliveries yet. Browse travelers or packages to get started.
                          </p>
                          <div className="flex gap-4">
                            <Link href="/travelers">
                              <Button variant="outline">Browse Travelers</Button>
                            </Link>
                            <Link href="/packages">
                              <Button>Browse Packages</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
