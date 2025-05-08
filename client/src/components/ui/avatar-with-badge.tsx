import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getRandomColor } from "@/lib/utils";

interface AvatarWithBadgeProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  badgeColor?: string;
}

export function AvatarWithBadge({
  firstName,
  lastName,
  size = "md",
  showBadge = false,
  badgeColor = "bg-green-500"
}: AvatarWithBadgeProps) {
  const initials = getInitials(firstName, lastName);
  const backgroundColor = getRandomColor(`${firstName} ${lastName}`);
  
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  
  const badgeSizeMap = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };
  
  const badgePositionMap = {
    sm: "right-0 top-0",
    md: "right-0.5 top-0.5",
    lg: "right-1 top-1",
  };
  
  return (
    <div className="relative inline-block">
      <Avatar className={sizeMap[size]}>
        <AvatarFallback style={{ backgroundColor }} className="text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showBadge && (
        <span className={`absolute ${badgePositionMap[size]} block ${badgeSizeMap[size]} ${badgeColor} rounded-full ring-2 ring-white`}></span>
      )}
    </div>
  );
}
