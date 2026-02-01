/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useRef, useState } from "react";
import { useNotification } from "../context/NotificationContext";
import { FaBell } from "react-icons/fa";

const NotificationBell: React.FC = () => {
  const { notifications, markAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Đóng dropdown khi click ngoài
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={bellRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: 0,
          outline: "none",
        }}
        aria-label="Thông báo"
      >
        <FaBell
          size={24}
          color={open ? "#2563eb" : "#f59e42"}
          style={{
            filter: open ? "drop-shadow(0 0 4px #2563eb88)" : undefined,
            transition: "color 0.2s",
          }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              minWidth: 18,
              height: 18,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              boxShadow: "0 1px 4px #0002",
              zIndex: 2,
              border: "2px solid #fff",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 32,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 400,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 8px 32px #0003, 0 1.5px 4px #2563eb22",
            border: "1px solid #e5e7eb",
            zIndex: 100,
            padding: 0,
            overflow: "hidden",
            animation: "fadeIn .2s",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f1f1f1",
              fontWeight: 600,
              fontSize: 16,
              background: "#f9fafb",
            }}
          >
            Thông báo
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {notifications.length === 0 && (
              <li style={{ padding: 24, textAlign: "center", color: "#888" }}>
                Không có thông báo nào
              </li>
            )}
            {notifications.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: "12px 16px 8px 16px",
                  borderBottom: "1px solid #f3f4f6",
                  background: n.isRead ? "#fff" : "#f1f5fd",
                  fontWeight: n.isRead ? 400 : 600,
                  cursor: n.isRead ? "default" : "pointer",
                  transition: "background 0.2s",
                  position: "relative",
                }}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <div
                  style={{
                    fontSize: 15,
                    marginBottom: 2,
                    color: n.isRead ? "#222" : "#2563eb",
                  }}
                >
                  {n.title}
                </div>
                <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>
                  {n.content}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                {!n.isRead && (
                  <span
                    style={{
                      position: "absolute",
                      left: 8,
                      top: 16,
                      width: 8,
                      height: 8,
                      background: "#2563eb",
                      borderRadius: "50%",
                      boxShadow: "0 0 4px #2563eb88",
                      display: "inline-block",
                    }}
                  ></span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
