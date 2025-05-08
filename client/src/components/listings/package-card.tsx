import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarWithBadge } from "@/components/ui/avatar-with-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "wouter";
import { formatDate, formatWeight, formatPrice } from "@/lib/utils";
import { MapPin, Package, Weight, DollarSign } from "lucide-react";

interface PackageCardProps {
  sender: {
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
  };
  packageItem: {
    id: number;
    senderCity: string;
    receiverCity: string;
    packageType: string;
    weight: number;
    deliveryDeadline?: string;
    offeredPayment: number;
    description: string;
  };
  isUrgent?: boolean;
  onOfferClick: () => void;
}

export function PackageCard({ 
  sender, 
  packageItem,
  isUrgent = false,
  onOfferClick 
}: PackageCardProps) {
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AvatarWithBadge 
              firstName={sender.firstName} 
              lastName={sender.lastName} 
              size="lg"
            />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {sender.firstName} {sender.lastName.charAt(0)}.
              </h3>
              <div className="flex items-center mt-1">
                <StarRating 
                  rating={sender.rating} 
                  reviewCount={sender.reviewCount}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1">
              <VerificationBadge 
                type="id" 
                verified={sender.verificationStatus.idVerified} 
              />
              <VerificationBadge 
                type="phone" 
                verified={sender.verificationStatus.phoneVerified} 
              />
              <VerificationBadge 
                type="address" 
                verified={sender.verificationStatus.addressVerified} 
              />
            </div>
            {packageItem.deliveryDeadline && (
              <span className={`text-sm ${isUrgent ? 'text-amber-500 font-medium' : 'text-gray-500'} mt-1`}>
                {isUrgent ? 'Urgent: ' : ''}
                Needed by {formatDate(packageItem.deliveryDeadline, "MMMM d")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex items-center text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{packageItem.senderCity}</span>
              <svg className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>{packageItem.receiverCity}</span>
            </div>
            <div className="flex items-center text-gray-500 mb-2">
              <Package className="h-4 w-4 mr-2" />
              <span>Package: {packageItem.description}</span>
            </div>
            <div className="flex items-center text-gray-500 mb-2">
              <Weight className="h-4 w-4 mr-2" />
              <span>Weight: {formatWeight(packageItem.weight)}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Offering: {formatPrice(packageItem.offeredPayment, true)} total</span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button 
              className="mb-2"
              onClick={onOfferClick}
            >
              Offer to Deliver
            </Button>
            <Link href={`/profile/${sender.id}`}>
              <Button variant="outline">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
