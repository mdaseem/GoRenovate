import { ScenePosition } from "@/app/utils/roomScene";

// A Customize design as it is saved and shared (see the room-visual-preview
// skill). Presentation data only: prices and stock are always read live.
export interface SharedDesign {
  categorySlug: string;
  // The space the arrangement was made in (null = the category default).
  spaceSlug: string | null;
  // Ordered; a repeated id is a second copy of the same product.
  essentialIds: string[];
  // pieceKey ("<essentialId>#<copy>") -> transform, for that space.
  positions: Record<string, ScenePosition>;
  roomWidthCm: number | null;
  roomHeightCm: number | null;
  // The room's depth for the 3D views; null = automatic. Optional because a server
  // that predates it (or a design saved before it) does not send it.
  roomDepthCm?: number | null;
  wallId: string | null;
  floorId: string | null;
}

export interface SavedDesign extends SharedDesign {
  id: string;
}
