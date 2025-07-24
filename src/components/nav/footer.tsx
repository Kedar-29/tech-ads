// components/Footer.tsx
"use client";

import { motion } from "framer-motion";
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full border-t border-gray-700 bg-[#0d0d0d] text-gray-300"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm tracking-wide"
        >
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-white">TechAds</span>. All rights
          reserved.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 text-lg"
        >
          <a href="#" className="hover:text-white transition-colors">
            <FaGithub />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaLinkedin />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaTwitter />
          </a>
        </motion.div>
      </div>
    </motion.footer>
  );
}
