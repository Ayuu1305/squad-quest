/**
 * swipeBlocker.js
 *
 * A lightweight, zero-dependency utility that lets modals and overlays
 * signal to SwipeWrapper that page-level swiping should be blocked.
 *
 * Usage in a modal:
 *   import { blockSwipe, unblockSwipe } from '../utils/swipeBlocker';
 *
 *   // When modal mounts:
 *   useEffect(() => {
 *     blockSwipe();
 *     return () => unblockSwipe();  // cleanup on unmount
 *   }, []);
 *
 * SwipeWrapper reads isSwipeBlocked() on every touchstart.
 */

let _count = 0;

export const blockSwipe = () => {
  _count++;
  if (_count === 1) {
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
};

export const unblockSwipe = () => {
  _count = Math.max(0, _count - 1);
  if (_count === 0) {
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
};

export const isSwipeBlocked = () => _count > 0;
