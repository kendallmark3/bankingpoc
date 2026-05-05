import logo from "./bofi-logo.svg";

interface BofiLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function BofiLogo({ width = 320, height = 80, className }: BofiLogoProps) {
  return (
    <img
      src={logo}
      alt="Bank of Intent"
      width={width}
      height={height}
      className={className}
    />
  );
}
