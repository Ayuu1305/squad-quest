import { useCallback } from "react";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

/**
 * Hook for capturing and sharing card images
 * @returns {Object} { shareCard } - Function to share a card element
 */
export const useShareCard = () => {
  const shareCard = useCallback(async (cardRef, userName = "Operative") => {
    if (!cardRef?.current) {
      toast.error("Card not found");
      return;
    }

    const toastId = toast.loading("Preparing identity card...");

    try {
      // 1. Generate image blob from DOM element
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "transparent",
        style: { transform: "none" }, // Reset transform for clean capture
      });

      // 2. Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${userName.replace(/\s+/g, "-")}-squad-id.png`,
        {
          type: "image/png",
        },
      );

      // 3. Try native share API (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${userName} - Squad Quest ID`,
          text: "🕵️‍♂️ My Squad Quest Identity Card",
        });
        toast.success("Shared successfully!", { id: toastId });
      } else {
        // 4. Fallback: Download for unsupported browsers (desktop)
        const link = document.createElement("a");
        link.download = `${userName.replace(/\s+/g, "-")}-squad-id.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Card saved! Upload it to your story.", { id: toastId });
      }
    } catch (error) {
      // User cancelled share
      if (error.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Share failed:", error);
      toast.error("Failed to share card", { id: toastId });
    }
  }, []);

  return { shareCard };
};
