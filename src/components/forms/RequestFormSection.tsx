import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Building2, Briefcase, Home } from "lucide-react";
import ResidentRegistrationForm from "../../pages/forms/ResidentRegistrationForm";
import BarangayClearanceForm from "../../pages/forms/BarangayClearanceForm";
import BarangayCertificateForm from "../../pages/forms/BarangayCertificateForm";
import BusinessClearanceForm from "../../pages/forms/BusinessClearanceForm";
import BuildingClearanceForm from "../../pages/forms/BuildingClearanceForm";

type RequestType =
  | "resident-registration"
  | "barangay-certificate"
  | "barangay-clearance"
  | "business-clearance"
  | "building-clearance"
  | null;

const requestTypes = [
  {
    id: "resident-registration" as const,
    title: "Resident Registration",
    description: "Register as a resident of Barangay West Rembo",
    icon: Users,
  },
  {
    id: "barangay-certificate" as const,
    title: "Barangay Certificate",
    description: "Request for barangay certificate documentation",
    icon: FileText,
  },
  {
    id: "barangay-clearance" as const,
    title: "Barangay Clearance",
    description: "Apply for barangay clearance for various purposes",
    icon: FileText,
  },
  {
    id: "business-clearance" as const,
    title: "Business Clearance",
    description: "Apply for business permit clearance",
    icon: Briefcase,
  },
  {
    id: "building-clearance" as const,
    title: "Building Clearance",
    description: "Request building or construction clearance",
    icon: Building2,
  },
];

const RequestFormSection = () => {
  const [selectedType, setSelectedType] = useState<RequestType>(null);

  const handleBack = () => {
    setSelectedType(null);
  };

  const renderForm = () => {
    switch (selectedType) {
      case "resident-registration":
        return <ResidentRegistrationForm onBack={handleBack} />;
      case "barangay-certificate":
        return <BarangayCertificateForm onBack={handleBack} />;
      case "barangay-clearance":
        return <BarangayClearanceForm onBack={handleBack} />;
      case "business-clearance":
        return <BusinessClearanceForm onBack={handleBack} />;
      case "building-clearance":
        return <BuildingClearanceForm onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <section id="request-form" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Request Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Submit your requests online for various barangay services. Select the type of request
            below to get started.
          </p>
        </div>

        {!selectedType ? (
          /* Request Type Selection */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {requestTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-gold group"
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <Icon className="w-8 h-8 text-navy group-hover:text-gold transition-colors" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Selected Form */
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              ← Back to Request Types
            </Button>
            {renderForm()}
          </div>
        )}
      </div>
    </section>
  );
};

export default RequestFormSection;
