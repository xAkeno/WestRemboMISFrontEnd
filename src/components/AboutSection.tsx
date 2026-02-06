import React from 'react';

const features = [
  {
    number: '01',
    title: 'Community Announcements',
    description:
      'Stay updated with the latest news, government notices, and barangay updates relevant to West Rembo residents.',
  },
  {
    number: '02',
    title: 'Event Calendar',
    description:
      "Browse upcoming events, meetings, and activities in the community—so you never miss what's happening in West Rembo.",
  },
  {
    number: '03',
    title: 'Emergency Info & Contacts',
    description:
      'Access emergency hotlines, health center contacts, and safety tips to help you stay ready during urgent situations in West Rembo.',
  },
];

const AboutSection: React.FC = () => {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            About this website
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            This website is dedicated to sharing official announcements, events,
            and updates for the community of West Rembo. It serves as an
            information hub to keep residents connected and informed.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.number}
              className="rounded-xl bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl font-bold text-purple-600">
                {item.number}
              </span>

              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-3 text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
