type Props = { children: React.ReactNode; className?: string; as?: "div" | "section" | "li" };

/**
 * Fade-up as the element scrolls into view, in pure CSS (scroll-driven animation, see .reveal in
 * globals.css). Zero JS; browsers without animation-timeline and reduced-motion users get static content.
 */
export function Reveal({ children, className = "", as: Tag = "div" }: Props) {
  return <Tag className={`reveal ${className}`}>{children}</Tag>;
}
