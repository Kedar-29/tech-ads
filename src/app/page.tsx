import { DemoOne } from "@/components/mainpage/dash/dash";
import HeroScrollDemo from "@/components/mainpage/tab/container-scroll-animation-demo";
import Footer from "@/components/nav/footer";

export default function Home() {
  return (
    <div>
      <HeroScrollDemo />
      <DemoOne />
      <Footer />
    </div>
  );
}
