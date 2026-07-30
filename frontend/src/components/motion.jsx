import { motion } from "framer-motion";

// Staggered fade-up reveal on scroll
export const Reveal = ({ children, delay = 0, className = "", y = 30 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Masked line reveal (used in hero). Each line wrapped in overflow-hidden.
export const MaskLine = ({ children, delay = 0, className = "" }) => (
  <span className="reveal-mask">
    <motion.span
      className={"block " + className}
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.span>
  </span>
);

export const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1, delay }}
    className={className}
  >
    {children}
  </motion.div>
);
