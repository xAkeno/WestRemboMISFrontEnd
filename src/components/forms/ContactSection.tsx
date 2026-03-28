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
    <section id="contact" className="py-20 bg-navy-dark">
      <Header />
      <div className="container mx-auto py-16 px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold  mb-6">
              Get in touch with Barangay West Rembo
            </h2>
            <p className=" font-mono text-sm leading-relaxed">
              If you have any inquiries, concerns, or clarifications, choose one (or several) of the many ways to get in touch with us. You can fill out the form below, dial our numbers, send a direct email, or get in touch thru our social media pages. We'd love to hear from you.
            </p>
          </div>

          {/* Right Side - Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className=" text-sm mb-1 block">First name</label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="bg-navy border-navy  placeholder:/50"
                />
              </div>
              <div>
                <label className=" text-sm mb-1 block">Last name</label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="bg-navy border-navy  placeholder:/50"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className=" text-sm mb-1 block">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="123-45-678"
                  className="bg-navy border-navy  placeholder:/50"
                />
              </div>
              <div>
                <label className=" text-sm mb-1 block">Phone number</label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="123-45-678"
                  className="bg-navy border-navy  placeholder:/50"
                />
              </div>
            </div>

            <div>
              <label className=" text-sm mb-1 block">Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="john.doe@company.com"
                className="bg-navy border-navy  placeholder:/50"
              />
            </div>

            <div>
              <label className=" text-sm mb-1 block">Topic</label>
              <Input
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="bg-navy border-navy  placeholder:/50"
              />
            </div>

            <div>
              <label className=" text-sm mb-1 block">Your message</label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your thoughts here..."
                rows={4}
                className="bg-navy border-navy  placeholder:/50 resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 "
            >
              Submit
            </Button>
          </form>
        </div>

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-16">
          {contactInfo.map((info) => (
            <div
              key={info.title}
              className="bg-navy rounded-lg p-6 border border-navy-dark/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <info.icon className="w-5 h-5 " />
                <h3 className="font-heading font-bold ">
                  {info.title}
                </h3>
              </div>
              <p className=" text-sm">{info.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
