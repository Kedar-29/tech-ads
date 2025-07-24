import { HeroSection } from "./dynamic";

const DemoOne = () => {
  return (
    <div>
      <HeroSection
        heading="Revolutionize Your Advertising with TechAds"
        tagline="Manage devices, assign ads, and monitor campaigns effortlessly—all from one platform."
        buttonText="Get Started Now"
        imageUrl="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFuZHNjYXBlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
        videoUrl="https://www.w3schools.com/html/mov_bbb.mp4" // A sample video
      />
    </div>
  );
};

export { DemoOne };
