
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdCard, Phone, Home, Upload, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function VerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [currentVerificationType, setCurrentVerificationType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  const handleVerificationClick = (type: string) => {
    setCurrentVerificationType(type);
    setVerificationDialogOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (currentVerificationType === 'idVerified' && !selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if ((currentVerificationType === 'phoneVerified' || currentVerificationType === 'addressVerified') && !verificationCode) {
      toast({
        title: "Verification code required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    if (!currentVerificationType) return;

    try {
      setIsUploading(currentVerificationType);

      if (currentVerificationType === 'idVerified' && selectedFile) {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('verificationType', currentVerificationType);

        // For MVP, we'll simulate verification by just marking it as verified
        const response = await apiRequest("POST", "/api/verification", {
          verificationType: currentVerificationType,
        });
      } else {
        const response = await apiRequest("POST", "/api/verification", {
          verificationType: currentVerificationType,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "Verification successful",
        description: `Your ${getVerificationTypeLabel(currentVerificationType)} has been verified successfully`,
      });

      setVerificationDialogOpen(false);
      setVerificationCode("");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      // For demo, show verification in progress
      toast({
        title: "Verification in progress",
        description: "Your verification is being processed. This may take a few minutes.",
      });
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user verification status
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Verification submitted",
        description: "Your verification request has been submitted and is being processed.",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    switch (type) {
      case "idVerified":
        return "ID";
      case "phoneVerified":
        return "Phone Number";
      case "addressVerified":
        return "Address";
      default:
        return "Information";
    }
  };

  const getVerificationStatus = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>Verified</span>
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>Not Verified</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
            <p className="text-gray-600">Verify your identity to build trust and unlock all features</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Your current verification status, more verifications mean more trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-opacity-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">ID Verification</CardTitle>
                      {getVerificationStatus(user.verificationStatus.idVerified)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Verify your identity with a government-issued ID
                    </p>
                    <Button
                      className="w-full"
                      variant={user.verificationStatus.idVerified ? "outline" : "default"}
                      disabled={user.verificationStatus.idVerified || isUploading !== null}
                      onClick={() => handleVerificationClick("idVerified")}
                    >
                      {user.verificationStatus.idVerified ? (
                        "Verified"
                      ) : isUploading === "idVerified" ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Verify ID
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-opacity-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Phone Verification</CardTitle>
                      {getVerificationStatus(user.verificationStatus.phoneVerified)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Verify your phone number via SMS code
                    </p>
                    <Button
                      className="w-full"
                      variant={user.verificationStatus.phoneVerified ? "outline" : "default"}
                      disabled={user.verificationStatus.phoneVerified || isUploading !== null}
                      onClick={() => handleVerificationClick("phoneVerified")}
                    >
                      {user.verificationStatus.phoneVerified ? (
                        "Verified"
                      ) : isUploading === "phoneVerified" ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Verify Phone
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-opacity-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Address Verification</CardTitle>
                      {getVerificationStatus(user.verificationStatus.addressVerified)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Verify your residence address
                    </p>
                    <Button
                      className="w-full"
                      variant={user.verificationStatus.addressVerified ? "outline" : "default"}
                      disabled={user.verificationStatus.addressVerified || isUploading !== null}
                      onClick={() => handleVerificationClick("addressVerified")}
                    >
                      {user.verificationStatus.addressVerified ? (
                        "Verified"
                      ) : isUploading === "addressVerified" ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Verify Address
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why Verification Matters</CardTitle>
              <CardDescription>
                Verification helps build trust and security in our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Higher Trust</h3>
                    <p className="text-gray-500">
                      Verified users are more likely to be trusted by others, leading to more successful connections.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Better Matches</h3>
                    <p className="text-gray-500">
                      Many senders and travelers prefer working with verified users for safety and reliability.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Community Safety</h3>
                    <p className="text-gray-500">
                      Verification helps ensure everyone on the platform is who they claim to be, creating a safer community.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Verify Your {getVerificationTypeLabel(currentVerificationType || "")}
            </DialogTitle>
            <DialogDescription>
              {currentVerificationType === "idVerified" && "Upload a government-issued ID to verify your identity."}
              {currentVerificationType === "phoneVerified" && "Enter the verification code sent to your phone."}
              {currentVerificationType === "addressVerified" && "Upload proof of address, such as a utility bill or bank statement."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {currentVerificationType === "idVerified" && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-md">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">Upload your ID document</p>
                <p className="text-xs text-gray-400 mb-4 text-center">
                  Supported formats: JPG, PNG, PDF (max 5MB)
                </p>
                {previewUrl && (
                  <div className="mb-4">
                    {selectedFile?.type === 'application/pdf' ? (
                      <div className="bg-gray-100 p-4 rounded-md text-center">
                        <p className="text-sm text-gray-600">PDF Selected: {selectedFile.name}</p>
                      </div>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="ID Preview" 
                        className="max-w-full h-auto rounded-md shadow-sm" 
                      />
                    )}
                  </div>
                )}
                <input
                  type="file"
                  id="id-upload"
                  className="hidden"
                  accept="image/*, application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                      toast({
                        title: "File selected",
                        description: `Selected ${file.name}`,
                      });
                    }
                  }}
                />
                <Button 
                  onClick={() => document.getElementById('id-upload')?.click()}
                >
                  Select File
                </Button>
              </div>
            )}

            {(currentVerificationType === "phoneVerified" || currentVerificationType === "addressVerified") && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <Input
                    id="verification-code"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    For demo purposes, any code will work
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmVerification} disabled={isUploading !== null}>
              {isUploading === currentVerificationType ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Submit Verification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
