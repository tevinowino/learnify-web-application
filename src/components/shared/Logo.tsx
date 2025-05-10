import { BookHeart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link href="/" className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <Image src="/logo-full.png" alt="Learnify Logo" width={150} height={150}></Image>
    </Link>
  );
};

export default Logo;
