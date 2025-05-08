import { Badge } from "@/components/ui/badge";
import { IdCard, Phone, Home } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  type: "id" | "phone" | "address";
  verified: boolean;
  size?: "sm" | "md";
}

export function VerificationBadge({ 
  type, 
  verified, 
  size = "md" 
}: VerificationBadgeProps) {
  const getIcon = () => {
    switch (type) {
      case "id":
        return <IdCard className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />;
      case "phone":
        return <Phone className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />;
      case "address":
        return <Home className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />;
    }
  };
  
  const getLabel = () => {
    switch (type) {
      case "id":
        return "ID Verified";
      case "phone":
        return "Phone Verified";
      case "address":
        return "Address Verified";
    }
  };
  
  const getBgColor = () => {
    if (!verified) return "bg-gray-100 text-gray-800";
    
    switch (type) {
      case "id":
        return "bg-green-100 text-green-800";
      case "phone":
        return "bg-blue-100 text-blue-800";
      case "address":
        return "bg-purple-100 text-purple-800";
    }
  };
  
  const tooltipContent = verified
    ? `${getLabel()}: This user has completed ${type} verification`
    : `${type.charAt(0).toUpperCase() + type.slice(1)} not verified`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`${getBgColor()} ${size === "sm" ? "text-xs py-0 px-1.5" : "text-xs px-2.5 py-0.5"} flex items-center`}
            variant="outline"
          >
            {getIcon()}
            {size === "md" && getLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
