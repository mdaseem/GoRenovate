---
name: add-overlay-surface
description: Use when adding a new modal, drawer, or slide-in panel to the Go Renovate frontend (e.g. "add a settings panel", "add a filters drawer", "make X open as an overlay"). This app has exactly one global overlay/modal mechanism driven by Redux — do not create local component modal state or a new HOC. Covers wiring a new boolean flag through overLaySlice, RenderFromOverlay, and the shared Overlay HOC.
---

# Adding a new overlay surface

Go Renovate has a single global overlay system. Every modal/drawer (wishlist, login, chat, user list, mobile menu, ...) is a boolean flag in Redux, rendered once by `RenderFromOverlay`, wrapped in the shared `Overlay` HOC. Never introduce a new `useState`-based modal in a component — always plug into this system.

## Files involved

1. `src/app/store/features/overLaySlice.ts` — the boolean flags + setter actions
2. `src/app/component/Atoms/RenderFromOverlay/RenderFromOverlay.tsx` — mounted once in `layout.tsx`; reads the flags and renders each surface inside `Overlay`
3. `src/app/component/HOC/Overlay/Overlay.tsx` — the shared slide-in/menu wrapper (don't modify unless the new surface needs a genuinely new visual variant beyond the existing `"page"`/`"menu"` variants)

## Steps

1. **Add the flag + action in `overLaySlice.ts`**
   - Add `isOpen<Name>: false` to `initialState`.
   - Add a `setOpenState<Name>: (store, { payload }) => { store.isOpen<Name> = payload; return store; }` reducer.
   - Export the new action alongside the others.

2. **Wire it into `RenderFromOverlay.tsx`**
   - Import the new setter action.
   - Read the flag off `store` (`useAppSelector((state: RootState) => state.overlay)`).
   - If the surface's component is heavy/not needed on first paint, lazy-load it the way `WishListPage` and `LoginContainer` are: `const X = store.isOpenX && dynamic(() => import(...), { loading: () => <Loader1 /> or <Loader />, ssr: false })`. Light, always-available components (like `Chat`, `UserList`) can just be imported normally at the top.
   - Add an `<Overlay>` block:
     ```tsx
     <Overlay
       isOpen={store.isOpenX}
       setIsOpen={(payload) => dispatch(setOpenStateX(payload))}
       isDisable={false}
       shouldReturnNull={store.isOpenX ? false : true}
     >
       <ErrorBoundary title="<X> is unavailable">
         {/* lazy: {X && <X />}  — or direct: <XComponent /> */}
       </ErrorBoundary>
     </Overlay>
     ```
   - Always wrap the content in `ErrorBoundary` with a short, user-facing `title` describing what's unavailable if it crashes — every existing surface does this.

3. **Open/close it from anywhere in the app**
   - `dispatch(setOpenStateX(true))` to open, `dispatch(setOpenStateX(false))` to close (or pass to `Overlay`'s `setIsOpen`, which the back button and outside-click already call).
   - Do not add local component state for open/closed — always go through this dispatch.

## Notes / gotchas

- `shouldReturnNull={store.isOpenX ? false : true}` makes the `Overlay` return `null` entirely when closed, rather than rendering a hidden shell — match what similar surfaces (WishList, Login, Chat) do. Surfaces like `UserList` that omit this prop stay mounted (check whether that's actually desired before copying it).
- `isLoginPage` and `headerExtra` are Overlay props used only by the login surface's back-button/header customization — you likely don't need them for a new surface.
- `variant="menu"` on `Overlay` renders a click-outside/Escape-to-close dropdown panel (`MenuOverlay`) instead of the full slide-in page panel — use this variant if the new surface is a small anchored menu rather than a full drawer (see how `isMobileMenuOpen` / `Menu.tsx` uses it).
- `useStopScrollOnOverlay()` (called once at the top of `RenderFromOverlay`) already locks body scroll whenever any overlay flag is true — no per-surface scroll-lock code needed.
- Initial state uses `any` with an eslint-disable — follow the existing convention rather than trying to type it, unless you're deliberately fixing that as a separate cleanup.
