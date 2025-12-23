import React from "react";
import { useLoading } from "../context/LoadingContext";
import "../styles/LoadingPopup.css";

export default function LoadingPopup() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-popup">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}
