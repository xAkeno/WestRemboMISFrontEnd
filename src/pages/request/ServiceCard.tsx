import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const ServiceCard = ({ icon: Icon, title, description, href }: ServiceCardProps) => {
  return (
    <Link to={href} className="service-card block group">
      <div className="icon-container group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        {description}
      </p>
    </Link>
  );
};

export default ServiceCard;
