import { useCallback } from "react";
import { useAppDispatch } from "@/app/store/hooks";
import { setProductViewerId } from "@/app/store/features/categorySlice";
import { setOpenStateProductViewer } from "@/app/store/features/overLaySlice";

// Opens the "View in 3D" overlay for a product (global overlay mechanism). The
// viewer's code is only downloaded when this is first called.
export function useProductViewer() {
  const dispatch = useAppDispatch();
  return useCallback(
    // `group`: other pieces the viewer can switch to (e.g. a room's 3D pieces).
    (essentialId: string, group?: string[]) => {
      dispatch(setProductViewerId({ id: essentialId, group }));
      dispatch(setOpenStateProductViewer(true));
    },
    [dispatch],
  );
}
