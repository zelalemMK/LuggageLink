import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TravelerForm } from "@/components/forms/traveler-form";
import { PackageForm } from "@/components/forms/package-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation, useNavigate } from "wouter";
import { Helmet } from "react-helmet";

export default function PostRequestPage() {
  const { user } = useAuth();
  const [formType, setFormType] = useState<"trip" | "package">("trip");
  const navigate = useNavigate();

  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <>
      <Helmet>
        <title>Post Trip or Package - LuggageLink</title>
        <meta name="description" content="Post your upcoming trip to Ethiopia or create a package delivery request. Connect with others and find the perfect match for your needs." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-white rounded-lg shadow px-6 py-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What would you like to do?</h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button
                    className={`flex-1 flex items-center justify-center px-6 py-4 text-base font-medium ${
                      formType === "trip"
                        ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white"
                        : "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                    onClick={() => setFormType("trip")}
                  >
                    <Plane className="mr-2 h-5 w-5" />
                    I'm traveling to Ethiopia
                  </Button>
                  <Button
                    className={`flex-1 flex items-center justify-center px-6 py-4 text-base font-medium ${
                      formType === "package"
                        ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white"
                        : "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                    onClick={() => setFormType("package")}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    I need to send a package
                  </Button>
                </div>
              </div>

              {formType === "trip" ? <TravelerForm /> : <PackageForm />}
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}