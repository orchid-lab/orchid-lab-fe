import axiosInstance from "./axiosInstance";

/**
 * Mark a notification as read
 * @param notificationId - The ID of the notification to mark as read
 * @returns Response from the API
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await axiosInstance.put(
      "/api/notification/mark-as-read",
      { notificationId }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark multiple notifications as read
 * @param notificationIds - Array of notification IDs
 * @returns Response from the API
 */
export const markNotificationsAsRead = async (notificationIds: string[]) => {
  try {
    const promises = notificationIds.map((id) =>
      markNotificationAsRead(id)
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};
