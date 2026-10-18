import { Sheet } from '@/components/Sheet';
import { ProofWall } from '@/components/ProofWall';
import { BreakIt } from '@/components/BreakIt';

/** The proof wall, then the challenge beneath it, on one sheet. */
export function GalleryPage() {
  return (
    <Sheet page="gallery" proofNumber="Proof wall">
      <ProofWall />
      <BreakIt />
    </Sheet>
  );
}
