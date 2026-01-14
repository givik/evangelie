'use client';
import './page.css';
import { getData, getOptions } from './actions';
import HTMLFlipBook from 'react-pageflip';
import useWindowDimensions from '@/lib/useWindowDimensions';

export default function Home() {
  const { height, width } = useWindowDimensions();

  return (
    <HTMLFlipBook
      className="flip-book"
      width={width - 100}
      height={height - 100}
      size="stretch"
      drawShadow={true}
      flippingTime={1000}
      usePortrait={true}
      maxShadowOpacity={0.5}
      showCover={true}
    >
      <div className="page">
        <div>
          width: {width} ~ height: {height}
        </div>
        <p>1. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>2. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>3. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>4. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
      </div>
      <div className="empty-page"></div>
      <div className="page">
        <p>1. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>2. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>3. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>4. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
      </div>
      <div className="empty-page"></div>
      <div className="page">
        <p>1. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>2. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>3. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>4. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
      </div>
      <div className="empty-page"></div>
      <div className="page">
        <p>1. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>2. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>3. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
        <p>4. ლორემ იპსუმ დოლორ სით ამეთ, კონსექტეტურ ადიპისცინგ ელი.</p>
      </div>
      <div className="empty-page"></div>
    </HTMLFlipBook>
  );
}
