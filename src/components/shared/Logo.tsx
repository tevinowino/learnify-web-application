import { BookHeart } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link href="/" className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <BookHeart className="h-8 w-8" />
      <span>Learnify</span>
    </Link>
  );
};

export default Logo;
