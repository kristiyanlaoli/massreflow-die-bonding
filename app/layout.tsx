import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Die Bonding Lab | Flip Chip Mass Reflow',
  description: 'Interactive 3D educational simulator for flip chip mass reflow: flux coating, die flipping, alignment, solder reflow, cleaning, capillary underfill and inspection.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
