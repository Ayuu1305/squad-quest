  // Send Squad Ready notification when minimum players join
  export const sendSquadReadyNotification = (questTitle, playerCount) => {
    const message = `🎮 The Squad is Ready! Quest "${questTitle}" is LIVE with ${playerCount} heroes!`;

    // In production, this would integrate with push notifications or WhatsApp API
    // For now, we'll use browser notifications
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Squad Quest", {
        body: message,
        icon: "/squad-quest-logo.png",
        badge: "/badge-icon.png",
      });
    }

    // Also show in-app notification
    return {
      type: "squad_ready",
      message,
      timestamp: new Date().toISOString(),
    };
  };

  // Request notification permission
  export const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  // Send quest reminder notification
  export const sendQuestReminder = (questTitle, timeUntilStart) => {
    const message = `⏰ Your quest "${questTitle}" starts in ${timeUntilStart}!`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Squad Quest Reminder", {
        body: message,
        icon: "/squad-quest-logo.png",
      });
    }

    return {
      type: "quest_reminder",
      message,
      timestamp: new Date().toISOString(),
    };
  };

  // Send leave warning notification
  export const sendLeaveWarning = (reliabilityPenalty) => {
    const message = `⚠️ Warning: Leaving now will reduce your Reliability Score by ${reliabilityPenalty}%`;

    return {
      type: "leave_warning",
      message,
      timestamp: new Date().toISOString(),
    };
  };

  // Format time until quest starts
  export const formatTimeUntilStart = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff < 0) return "Started";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Check if within 1 hour of start
  export const isWithinOneHour = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;
    const oneHour = 60 * 60 * 1000;

    return diff <= oneHour && diff > 0;
  };
