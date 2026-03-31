import React from "react";
import { Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";

// Import step images from assets
import step1Img from "../assets/step1.png";
import step2Img from "../assets/step2.png";
import step3Img from "../assets/step3.png";

const StepItem = ({ img, index }) => {
  const isEven = index % 2 === 0;

  return (
    <div className="relative flex items-center justify-center w-full min-h-[300px] md:min-h-[500px] mb-16 md:mb-28">
      {/* Timeline Node & Number */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          viewport={{ once: true }}
          className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white border-4 border-brand-500 shadow-2xl shadow-brand-500/30 flex items-center justify-center z-20"
        >
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-brand-500"></div>
        </motion.div>

        {/* Step Number Label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          viewport={{ once: true }}
          className={`absolute ${isEven ? "left-full ml-6" : "right-full mr-6"} top-1/2 -translate-y-1/2 whitespace-nowrap hidden md:block`}
        >
          <span className="text-4xl lg:text-5xl font-black text-slate-800 uppercase tracking-tighter">
            Step 0{index + 1}
          </span>
        </motion.div>
      </div>

      {/* Content Container (Alternating) */}
      <div
        className={`w-full grid md:grid-cols-2 gap-10 md:gap-20 items-center px-4`}
      >
        <motion.div
          initial={{ opacity: 0, x: isEven ? -100 : 0, scale: 0.95 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-10%" }}
          className={`${isEven ? "md:col-start-1" : "md:col-start-2"} order-last md:order-none`}
        >
          <div className="relative group overflow-hidden rounded-[32px] md:rounded-[50px] shadow-2xl shadow-slate-200/50 hover:shadow-brand-500/20 transition-all duration-700">
            <img
              src={img}
              alt={`Step ${index + 1}`}
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="w-full h-auto block transform group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
        </motion.div>

        {/* Placeholder for the other side on desktop */}
        <div className="hidden md:block" />
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const navigate = useNavigate();
  const images = [step1Img, step2Img, step3Img];

  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col overflow-x-hidden">
      {/* Header Section */}
      <section className="bg-gradient-to-b from-brand-50/80 to-slate-50 pt-32 pb-24 px-4 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block bg-brand-100 text-brand-700 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8">
              Visual Journey
            </span>
            <h1 className="mb-8 overflow-visible">
              How It <span className="text-brand-500">Works</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              Explore our intuitive 3-step process to securely migrate your
              Outlook data with total confidence.
            </p>
          </motion.div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0,transparent_70%)] pointer-events-none -z-10" />
      </section>

      {/* Timeline Section */}
      <section className="relative w-full max-w-7xl mx-auto py-20">
        {/* Central Scrolling Progress Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-200 -translate-x-1/2 hidden md:block">
          <motion.div
            style={{ scaleY, originY: 0 }}
            className="w-full h-full bg-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
        </div>

        <div className="flex flex-col">
          {images.map((img, index) => (
            <StepItem key={index} img={img} index={index} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-32 px-4 relative overflow-hidden">
        {/* Modern dark patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-8 tracking-tight">
              Ready to{" "}
              <span className="text-brand-400 text-glow-brand">
                Simplify
              </span>
              ?
            </h2>
            <p className="text-slate-400 mb-12 max-w-xl mx-auto text-lg md:text-xl font-medium">
              Join thousands of users who have successfully transitioned their
              data with our secure technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                className="bg-brand-500 hover:bg-brand-400 text-slate-900 font-black h-16 px-12 rounded-2xl flex items-center gap-3 text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-500/20"
                onClick={() => navigate("/")}
              >
                <Zap className="w-5 h-5 fill-current" />
                Start Conversion
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-2 border-slate-700 text-white hover:bg-white/5 font-black h-16 px-12 rounded-2xl flex items-center gap-3 text-lg transition-all"
                onClick={() => navigate("/support")}
              >
                <HelpCircle className="w-5 h-5" />
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
