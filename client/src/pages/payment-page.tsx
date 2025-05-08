import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Redirect, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatWeight } from "@/lib/utils";
import { Loader2, CreditCard, Calendar, AlertTriangle, LockIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

export default function PaymentPage() {
  const { user } = useAuth();
  const { deliveryId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("creditCard");
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Fetch delivery details
  const { data: delivery, isLoading } = useQuery({
    queryKey: ["/api/deliveries", deliveryId],
    queryFn: async () => {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        credentials: "include",
      });
      
      if (res.status === 404) {
        toast({
          title: "Delivery not found",
          description: "The requested delivery does not exist",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return null;
      }
      
      if (!res.ok) {
        throw new Error("Failed to fetch delivery details");
      }
      
      return res.json();
    },
    enabled: !!deliveryId,
  });

  // Update payment status mutation
  const updatePaymentStatus = useMutation({
    mutationFn: async () => {
      if (!deliveryId) throw new Error("Delivery ID is required");
      
      const res = await apiRequest("PUT", `/api/deliveries/${deliveryId}/payment`, {
        paymentStatus: "in_escrow",
      });
      
      return res.json();
    },
    onSuccess: () => {
      setPaymentComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries", deliveryId] });
      
      toast({
        title: "Payment successful",
        description: "Your payment has been placed in escrow and will be released when you confirm delivery",
      });
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      setProcessing(false);
    },
  });

  // Handle payment submission
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === "creditCard") {
      // Basic validation for credit card
      if (!cardNumber || !expiryDate || !cvv || !nameOnCard) {
        toast({
          title: "Missing information",
          description: "Please fill in all credit card details",
          variant: "destructive",
        });
        return;
      }
      
      if (cardNumber.length < 15) {
        toast({
          title: "Invalid card number",
          description: "Please enter a valid card number",
          variant: "destructive",
        });
        return;
      }
    }
    
    setProcessing(true);
    
    // In a real application, we would process the payment here
    // For this MVP, we'll just simulate a payment
    setTimeout(() => {
      updatePaymentStatus.mutate();
    }, 2000);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? "/" + v.slice(2, 4) : "");
    }
    
    return v;
  };

  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check if delivery exists and user is the sender
  if (!isLoading && delivery && delivery.senderId !== user.id) {
    toast({
      title: "Unauthorized",
      description: "You are not authorized to make payment for this delivery",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  return (
    <>
      <Helmet>
        <title>Secure Payment - LuggageLink</title>
        <meta name="description" content="Make a secure payment for your package delivery through LuggageLink's escrow system." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Secure Payment</h1>
              <p className="text-gray-600">
                Pay securely through our escrow system. Your payment will only be released when you confirm delivery.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !delivery ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Delivery not found</h3>
                  <p className="text-gray-500 mb-6">
                    The delivery you're trying to pay for doesn't exist or has been removed.
                  </p>
                  <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
                </CardContent>
              </Card>
            ) : paymentComplete ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="bg-green-100 rounded-full p-4 mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-500 mb-6 text-center">
                    Your payment has been securely placed in escrow. It will be released to the traveler when you confirm delivery.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Redirecting to dashboard...
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Payment form */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                      <CardDescription>
                        Choose how you want to pay for this delivery
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePayment}>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                          className="mb-6"
                        >
                          <div className="flex items-center space-x-2 border rounded-md p-4 mb-3">
                            <RadioGroupItem value="creditCard" id="creditCard" />
                            <Label htmlFor="creditCard" className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Credit or Debit Card
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-4">
                            <RadioGroupItem value="paypal" id="paypal" disabled />
                            <Label htmlFor="paypal" className="flex items-center text-gray-400">
                              <svg
                                className="h-4 w-6 mr-2"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.291-.077.444-.78 4.473-3.265 6.055-7.363 6.055h-2.76c-.468 0-.865.34-.937.8l-.848 5.385a.645.645 0 0 1-.634.556h-.465v2Zm10.947-15.47c-.022.152-.044.296-.07.436-.779 4.497-3.225 6.374-7.304 6.374h-2.76a.483.483 0 0 0-.477.402l-.845 5.414a.321.321 0 0 0 .323.373h2.231l.56-3.562a.64.64 0 0 1 .634-.556h1.332c3.045 0 5.426-1.237 6.122-4.812l.254-1.33c.068-.354.125-.694.168-1.02.149-1.1.054-1.866-.408-2.46-.507-.648-1.409-.968-2.665-.968h-6.239l.022-.135c.057-.352.35-.614.706-.614h4.97c2.514 0 3.547.882 3.11 3.066" />
                              </svg>
                              PayPal (Coming Soon)
                            </Label>
                          </div>
                        </RadioGroup>

                        {paymentMethod === "creditCard" && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cardNumber">Card Number</Label>
                              <Input
                                id="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                                disabled={processing}
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="expiryDate">Expiry Date</Label>
                                <Input
                                  id="expiryDate"
                                  placeholder="MM/YY"
                                  value={expiryDate}
                                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                  maxLength={5}
                                  disabled={processing}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                  id="cvv"
                                  placeholder="123"
                                  value={cvv}
                                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                                  maxLength={4}
                                  disabled={processing}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="nameOnCard">Name on Card</Label>
                              <Input
                                id="nameOnCard"
                                placeholder="John Smith"
                                value={nameOnCard}
                                onChange={(e) => setNameOnCard(e.target.value)}
                                disabled={processing}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-8 flex items-center gap-2 p-4 border border-amber-200 bg-amber-50 rounded-md">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <p className="text-sm text-amber-800">
                            This is a demo application. No actual payment will be processed.
                          </p>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation("/dashboard")}
                            disabled={processing}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={processing}>
                            {processing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <LockIcon className="h-4 w-4 mr-2" />
                                Pay Securely
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment summary */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Package</p>
                          <p className="font-medium">
                            {delivery.package.packageType} {formatWeight(delivery.package.weight)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">From</p>
                          <p className="font-medium">{delivery.package.senderCity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">To</p>
                          <p className="font-medium">{delivery.package.receiverCity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Traveler</p>
                          <p className="font-medium">
                            {delivery.traveler.firstName} {delivery.traveler.lastName.charAt(0)}.
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Estimated Delivery</p>
                          <p className="font-medium">
                            {formatDate(delivery.trip.arrivalDate, "PPP")}
                          </p>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold">Subtotal</p>
                          <p className="font-medium">${delivery.package.offeredPayment.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold">Service Fee</p>
                          <p className="font-medium">$0.00</p>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                          <p className="text-lg font-bold">Total</p>
                          <p className="text-lg font-bold">
                            ${delivery.package.offeredPayment.toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center text-xs text-gray-500">
                          <LockIcon className="h-3 w-3 mr-1" />
                          <span>Your payment will be held in escrow until delivery is confirmed</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
