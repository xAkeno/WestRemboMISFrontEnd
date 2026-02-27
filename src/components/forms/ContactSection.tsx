import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Facebook, Clock } from "lucide-react";
import Header from "./Header";

const contactInfo = [
  {
    icon: MapPin,
    title: "Location",
    content: "Plaza Drive A. Mabini Street (21st), Barangay West Rembo, Taguig City",
  },
  {
    icon: Mail,
    title: "Email",
    content: "westrembo@gmail.com",
  },
  {
    icon: Phone,
    title: "Telephone",
    content: "(02) 8836 9731 / (02) 8836 9732 / (02) 8836 9733",
  },
  {
    icon: Facebook,
    title: "Facebook",
    content: "West Rembo FB",
  },
  {
    icon: Clock,
    title: "Office Hours",
    content: "Monday-Saturday 5:00 am - 6:00 pm",
  },
];

const ContactSection = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    topic: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <Header />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div className="text-center mb-14 ">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Reach Out
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Get in Touch with{" "}
            <span style={{ color: "#fa43ae" }}>Barangay West Rembo</span>
          </h2>
          <div
            className="mx-auto mt-3 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />
        </div>

        {/* Main grid — left text + right form */}
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-14">

          {/* Left Side */}
          <div className="">
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              If you have any inquiries, concerns, or clarifications, choose one (or several) of the many
              ways to get in touch with us. You can fill out the form below, dial our numbers, send a
              direct email, or get in touch through our social media pages. We'd love to hear from you.
            </p>

            {/* Contact info stacked on left for large screens */}
            <div className="hidden lg:flex flex-col gap-4">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div
                    key={info.title}
                    className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border transition-all duration-200 hover:shadow-md"
                    style={{ borderLeftWidth: 3, borderLeftColor: "#d45ea3" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "#fce7f3" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#d45ea3" }} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: "#d45ea3" }}
                      >
                        {info.title}
                      </p>
                      <p className="text-sm text-foreground">{info.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          

          {/* Right Side — Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">First name</label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="rounded-xl border-border focus-visible:ring-1"
                  style={{ "--tw-ring-color": "#d45ea3" } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Last name</label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="rounded-xl border-border"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="rounded-xl border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Phone number</label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  className="rounded-xl border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your home address"
                className="rounded-xl border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Topic</label>
              <Input
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="What is your concern about?"
                className="rounded-xl border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Your message</label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your thoughts here..."
                rows={4}
                className="rounded-xl border-border resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
              style={{
                backgroundColor: "#d45ea3",
                boxShadow: "0 4px 20px rgba(212,94,163,0.30)",
              }}
            >
              Submit Message
            </Button>
          </form>
        </div>

        {/* Contact Info Cards — shown below form on mobile */}
        <div className="lg:hidden grid sm:grid-cols-2 gap-4 mb-2">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <div
                key={info.title}
                className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border"
                style={{ borderLeftWidth: 3, borderLeftColor: "#d45ea3" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#fce7f3" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#d45ea3" }} />
                </div>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "#d45ea3" }}
                  >
                    {info.title}
                  </p>
                  <p className="text-sm text-foreground">{info.content}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ContactSection;