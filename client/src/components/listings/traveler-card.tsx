import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarWithBadge } from "@/components/ui/avatar-with-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "wouter";
import { formatDate, formatWeight, formatPrice } from "@/lib/utils";
import { Plane, Calendar, Luggage, DollarSign } from "lucide-react";

interface TravelerCardProps {
  traveler: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    rating: number;
    reviewCount: number;
    verificationStatus: {
      idVerified: boolean;
      phoneVerified: boolean;
      addressVerified: boolean;
    };
    createdAt: string;
  };
  trip: {
    id: number;
    departureAirport: string;
    destinationCity: string;
    departureDate: string;
    availableWeight: number;
    pricePerKg: number;
  };
  onContactClick: () => void;
}

export function TravelerCard({ traveler, trip, onContactClick }: TravelerCardProps) {
  const memberSince = formatDate(traveler.createdAt, "MMM yyyy");
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AvatarWithBadge 
              firstName={traveler.firstName} 
              lastName={traveler.lastName} 
              size="lg"
            />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {traveler.firstName} {traveler.lastName.charAt(0)}.
              </h3>
              <div className="flex items-center mt-1">
                <StarRating 
                  rating={traveler.rating} 
                  reviewCount={traveler.reviewCount}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1">
              <VerificationBadge 
                type="id" 
                verified={traveler.verificationStatus.idVerified} 
              />
              <VerificationBadge 
                type="phone" 
                verified={traveler.verificationStatus.phoneVerified} 
              />
              <VerificationBadge 
                type="address" 
                verified={traveler.verificationStatus.addressVerified} 
              />
            </div>
            <span className="text-sm text-gray-500 mt-1">
              Member since {memberSince}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex items-center text-gray-500 mb-2">
              <Plane className="h-4 w-4 mr-2" />
              <span>{trip.departureAirport}</span>
              <svg className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>{trip.destinationCity}</span>
            </div>
            <div className="flex items-center text-gray-500 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Departure: {formatDate(trip.departureDate, "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center text-gray-500 mb-2">
              <Luggage className="h-4 w-4 mr-2" />
              <span>Available capacity: {formatWeight(trip.availableWeight)}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Fee: {formatPrice(trip.pricePerKg)}</span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button 
              className="mb-2"
              onClick={onContactClick}
            >
              Contact Traveler
            </Button>
            <Link href={`/profile/${traveler.id}`}>
              <Button variant="outline">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
