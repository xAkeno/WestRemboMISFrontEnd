import BarangayForm from "@/components/BarangayForm";
import { Layout } from "@/components/Layout";

const IndexBCS = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        {/* <header className="bg-primary text-primary-foreground shadow-md print:hidden">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Barangay Clearance System</h1>
            <p className="text-sm opacity-90 mt-1">Barangay West Rembo - Taguig City</p>
          </div>
        </header> */}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          
          <BarangayForm />
        </main>

        {/* Footer */}
        <footer className="bg-card border-t mt-16 print:hidden">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Barangay West Rembo. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default IndexBCS;
