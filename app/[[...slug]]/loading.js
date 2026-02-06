import AnimatedBook from '@/components/AnimatedBook';
import localFont from 'next/font/local';

const textFont = localFont({
  src: '../fonts/bpg_nino_elite_round.otf',
});

export default function Loading() {
  return (
    <div className="loading-content">
      <p className={textFont.className}>ბიბლია</p>
      <AnimatedBook />
    </div>
  );
}
