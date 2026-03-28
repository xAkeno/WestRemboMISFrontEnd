import bgBuilding from "@/assets/hero-barangay.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${bgBuilding})` }}
    >
      {children}
    </div>
  );
};

export default AuthLayout;
