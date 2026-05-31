import Image from "next/image";

type LatrKitLogoProps = {
  size?: number;
  className?: string;
};

export function LatrKitLogo({ size = 40, className }: LatrKitLogoProps) {
  return (
    <Image
      src="/apple-icon.png"
      alt="LatrKit"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
