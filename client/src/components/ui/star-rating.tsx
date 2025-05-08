import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ 
  rating, 
  reviewCount = 0, 
  showCount = true, 
  size = "md" 
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  
  // Create array of 5 stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star 
          key={`star-${i}`} 
          className={`${sizeClass} text-yellow-400 fill-yellow-400`} 
        />
      );
    }
    
    // Add half star if applicable
    if (hasHalfStar) {
      stars.push(
        <StarHalf 
          key="half-star" 
          className={`${sizeClass} text-yellow-400 fill-yellow-400`} 
        />
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star 
          key={`empty-star-${i}`} 
          className={`${sizeClass} text-yellow-400`} 
        />
      );
    }
    
    return stars;
  };
  
  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showCount && (
        <span className={`${size === "sm" ? "text-xs" : "text-sm"} text-gray-500 ml-1`}>
          {rating.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}
        </span>
      )}
    </div>
  );
}
