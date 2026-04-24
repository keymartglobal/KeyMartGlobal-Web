// Keymart Global SVG Logo inline component
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#e8003d"/>
      <text x="8" y="34" fontFamily="Inter,sans-serif" fontWeight="900" fontSize="24" fill="white">K</text>
      <circle cx="37" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  );
}
