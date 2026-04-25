// KeyMart Global — Logo using actual brand image (transparent PNG)
interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <img
      src="/logo.jpeg"
      alt="KeyMart Global Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
    />
  );
}
