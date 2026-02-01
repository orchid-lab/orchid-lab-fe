import axiosInstance from "./axiosInstance";

export const getNotifications = (userId: string) => {
  return axiosInstance.get("/api/notification", {
    params: {
      userId,
      pageNumber: 1,
      pageSize: 1000,
    },
  });
};

export const markNotificationAsRead = (id: string) => {
  return axiosInstance.put(`/api/notification/${id}/mark-as-read`);
};
