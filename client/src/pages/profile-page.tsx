import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials, getRandomColor } from "@/lib/utils";
import { Loader2, Calendar, MapPin, Package, User, Mail, Phone, Star } from "lucide-react";
import { TravelerCard } from "@/components/listings/traveler-card";
import { PackageCard } from "@/components/listings/package-card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function ProfilePage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // Determine if we're viewing the current user's profile or someone else's
  useEffect(() => {
    if (userId) {
      setProfileUserId(parseInt(userId));
    } else if (user) {
      setProfileUserId(user.id);
    }
  }, [userId, user]);

  // Fetch user profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ["/api/user", profileUserId],
    queryFn: async () => {
      if (profileUserId === user?.id) {
        // If viewing own profile, use the current user data
        return user;
      }
      
      // Otherwise fetch the specific user
      const res = await fetch(`/api/user/${profileUserId}`, {
        credentials: "include",
      });
      
      if (res.status === 404) {
        toast({
          title: "User not found",
          description: "The requested user profile does not exist",
          variant: "destructive",
        });
        setLocation("/");
        return null;
      }
      
      if (!res.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      return res.json();
    },
    enabled: !!profileUserId,
  });

  // Fetch user's trips
  const {
    data: trips,
    isLoading: isLoadingTrips,
  } = useQuery({
    queryKey: ["/api/trips/user", profileUserId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/user/${profileUserId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error("Failed to fetch trips");
        }
        return [];
      }
      
      return res.json();
    },
    enabled: !!profileUserId,
  });

  // Fetch user's packages
  const {
    data: packages,
    isLoading: isLoadingPackages,
  } = useQuery({
    queryKey: ["/api/packages/user", profileUserId],
    queryFn: async () => {
      const res = await fetch(`/api/packages/user/${profileUserId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error("Failed to fetch packages");
        }
        return [];
      }
      
      return res.json();
    },
    enabled: !!profileUserId,
  });

  // Fetch user's reviews
  const {
    data: reviews,
    isLoading: isLoadingReviews,
  } = useQuery({
    queryKey: ["/api/reviews/user", profileUserId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/user/${profileUserId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error("Failed to fetch reviews");
        }
        return [];
      }
      
      return res.json();
    },
    enabled: !!profileUserId,
  });

  const handleContactClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to contact users",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (profileUserId) {
      setLocation(`/messages/${profileUserId}`);
    }
  };

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

    setLocation(`/messages/${profileUserId}`);
  };

  // Loading state
  const isLoading = isLoadingProfile || isLoadingTrips || isLoadingPackages || isLoadingReviews;

  // If profile data is null or not found
  if (!isLoading && !profileData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 rounded-full p-3 mb-4">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">User not found</h3>
                <p className="text-gray-500 mb-6">
                  The user profile you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => setLocation("/")}>Return to Home</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isLoading
            ? "Profile - LuggageLink"
            : `${profileData?.firstName} ${profileData?.lastName} - LuggageLink`}
        </title>
        <meta
          name="description"
          content={isLoading ? "View user profile on LuggageLink" : `View ${profileData?.firstName}'s profile, reviews, trips, and packages on LuggageLink.`}
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Profile header */}
                <Card className="mb-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-500 h-32"></div>
                  <div className="px-6 sm:px-8 -mt-16">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end sm:space-x-5">
                      <Avatar className="h-24 w-24 rounded-full ring-4 ring-white">
                        <AvatarFallback
                          style={{
                            backgroundColor: getRandomColor(
                              `${profileData?.firstName} ${profileData?.lastName}`
                            ),
                          }}
                          className="text-white text-xl"
                        >
                          {getInitials(profileData?.firstName, profileData?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mt-6 sm:mt-0 flex-1 min-w-0 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between">
                        <div className="text-center sm:text-left">
                          <h1 className="text-2xl font-bold text-gray-900">
                            {profileData?.firstName} {profileData?.lastName}
                          </h1>
                          <p className="text-sm text-gray-500">@{profileData?.username}</p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex flex-wrap justify-center sm:justify-start gap-2">
                          {profileData?.verificationStatus && (
                            <>
                              <VerificationBadge
                                type="id"
                                verified={profileData.verificationStatus.idVerified}
                              />
                              <VerificationBadge
                                type="phone"
                                verified={profileData.verificationStatus.phoneVerified}
                              />
                              <VerificationBadge
                                type="address"
                                verified={profileData.verificationStatus.addressVerified}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 pt-6 pb-4">
                      <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">Member since</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatDate(profileData?.createdAt, "MMMM yyyy")}
                        </span>
                      </div>
                      <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">Rating</span>
                        </div>
                        <StarRating
                          rating={profileData?.rating || 0}
                          reviewCount={profileData?.reviewCount || 0}
                        />
                      </div>
                      <div className="flex justify-center sm:justify-end">
                        {profileUserId !== user?.id && (
                          <Button onClick={handleContactClick}>Contact User</Button>
                        )}
                        {profileUserId === user?.id && (
                          <Link href="/verify">
                            <Button variant="outline">Verify Account</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Profile tabs */}
                <Tabs defaultValue="trips" className="space-y-6">
                  <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
                    <TabsTrigger value="trips">Trips</TabsTrigger>
                    <TabsTrigger value="packages">Packages</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="trips" className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profileUserId === user?.id ? "Your" : "User's"} Trips
                    </h2>
                    {trips && trips.length > 0 ? (
                      <div className="space-y-6">
                        {trips.map((trip: any) => (
                          <TravelerCard
                            key={trip.id}
                            traveler={profileData}
                            trip={trip}
                            onContactClick={handleContactClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="bg-gray-100 rounded-full p-3 mb-4">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                          <p className="text-gray-500 mb-6">
                            {profileUserId === user?.id
                              ? "You haven't posted any trips yet. When you're planning a trip to Ethiopia, consider posting it here."
                              : "This user hasn't posted any trips yet."}
                          </p>
                          {profileUserId === user?.id && (
                            <Link href="/post">
                              <Button>Post a Trip</Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="packages" className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profileUserId === user?.id ? "Your" : "User's"} Packages
                    </h2>
                    {packages && packages.length > 0 ? (
                      <div className="space-y-6">
                        {packages.map((pkg: any) => (
                          <PackageCard
                            key={pkg.id}
                            sender={profileData}
                            packageItem={pkg}
                            onOfferClick={() => handleOfferClick(pkg)}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="bg-gray-100 rounded-full p-3 mb-4">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                          <p className="text-gray-500 mb-6">
                            {profileUserId === user?.id
                              ? "You haven't posted any packages yet. When you need to send something to Ethiopia, post it here."
                              : "This user hasn't posted any packages yet."}
                          </p>
                          {profileUserId === user?.id && (
                            <Link href="/post">
                              <Button>Post a Package</Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Reviews {profileUserId === user?.id ? "About You" : ""}
                    </h2>
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review: any) => (
                          <Card key={review.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start">
                                <Avatar className="h-10 w-10 mr-4">
                                  <AvatarFallback
                                    style={{
                                      backgroundColor: getRandomColor(
                                        `${review.reviewer?.firstName} ${review.reviewer?.lastName}`
                                      ),
                                    }}
                                    className="text-white"
                                  >
                                    {getInitials(
                                      review.reviewer?.firstName,
                                      review.reviewer?.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="text-sm font-medium text-gray-900">
                                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                                      </h3>
                                      <div className="mt-1">
                                        <StarRating rating={review.rating} showCount={false} />
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(review.createdAt, "PPP")}
                                    </p>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-500">{review.comment}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="bg-gray-100 rounded-full p-3 mb-4">
                            <Star className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                          <p className="text-gray-500">
                            {profileUserId === user?.id
                              ? "You haven't received any reviews yet. Reviews will appear here after completing deliveries."
                              : "This user hasn't received any reviews yet."}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
