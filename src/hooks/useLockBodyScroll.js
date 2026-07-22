import { useEffect } from "react";
import { blockSwipe, unblockSwipe } from "../utils/swipeBlocker";

/**
 * Custom hook to lock background page scrolling and disable page swipe gestures when a modal is open.
 * @param {boolean} isOpen - Optional boolean indicating if the modal is currently open. Defaults to true.
 */
export const useLockBodyScroll = (isOpen = true) => {
  useEffect(() => {
    if (!isOpen) return;

    blockSwipe();
    return () => {
      unblockSwipe();
    };
  }, [isOpen]);
};

export default useLockBodyScroll;
