import AnimatedBook from '@/components/AnimatedBook';
import localFont from 'next/font/local';
import Placeholder from '@/components/Placeholder';

const textFont = localFont({
  src: '../fonts/bpg_nino_elite_round.otf',
});

export default function Loading() {
  return (
    <div className="loading-content">
      <p className={textFont.className}>ბიბლია</p>
      <AnimatedBook />

      {/* <Placeholder />
      <p className={textFont.className}>ბიბლია</p>
      <Placeholder /> */}
    </div>
  );
}
