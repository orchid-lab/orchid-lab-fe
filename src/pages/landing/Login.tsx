import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { extractUserFromJWT } from "../../utils/jwtHelper";
import type { User } from "../../types/Auth";
import "./Login.css";
import { useTranslation } from 'react-i18next';
import LoginBackground from "../../assets/LoginBackground.jpg";
import LoginBackground2 from "../../assets/LoginBackground2.jpg";
import LoginBackground3 from "../../assets/LoginBackground3.jpg";
import LoginBackground4 from "../../assets/LoginBackground4.jpg";
import LoginBackground5 from "../../assets/LoginBackground5.jpg";
import LoginBackground6 from "../../assets/LoginBackground6.jpg"; 
import LoginBackground7 from "../../assets/LoginBackground7.jpg";
import LoginBackground8 from "../../assets/LoginBackground8.jpg";
import LoginBackground9 from "../../assets/LoginBackground9.jpg";
import LoginBackground10 from "../../assets/LoginBackground10.jpg";

const backgroundImages = [
  LoginBackground,
  LoginBackground2,
  LoginBackground3,
  LoginBackground4,
  LoginBackground5,
  LoginBackground6,
  LoginBackground7,
  LoginBackground8,
  LoginBackground9,
  LoginBackground10,
];

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  useTranslation();

  // Background rotation effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axiosInstance.post<LoginResponse>("/api/authentication/login", {
        email,
        password,
      });
      
      const { accessToken, refreshToken, user: apiUser } = res.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response structure");
      }
      
      const user = apiUser ?? extractUserFromJWT(accessToken, email);
      
      if (!user) {
        throw new Error("Failed to get user information");
      }
      
      console.log("Login successful, user data:", user);
      
      login({ accessToken, refreshToken, user });
      
      const roleBasedPath = user.roleId === 1 ? "/admin/user" : user.roleId === 2 ? "/researcher" : "/technician";
      void navigate(roleBasedPath, { replace: true });
      
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Sai email hoặc mật khẩu!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="background-wrapper">
        <div 
          className="background-image"
          style={{
            backgroundImage: `url(${backgroundImages[currentBgIndex]})`,
          }}
        />
        <div className="background-overlay" />
      </div>

      {/* Floating Orbs */}
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      {/* Glass Card */}
      <div className="glass-card">
        <div className="glass-content">
          {/* Form Section */}
          <div className="form-section">
            <div className="title-section">
              <h1 className="main-title">
                <span className="title-gradient">DaLatOrchid</span>
              </h1>
              <h1 className="main-title">
                <span className="title-gradient">Lab</span>
              </h1>
            </div>

            <form onSubmit={(e) => void handleLogin(e)} className="login-form">
              <div className="input-wrapper form-element">
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <div className="input-glow" />
              </div>

              <div className="input-wrapper form-element">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="input-glow" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div className="error-message form-element">
                  <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="submit-button form-element"
              >
                <span className="button-text">
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </span>
                <div className="button-shine" />
              </button>

              <div className="forgot-password">
                <a href="#">Quên mật khẩu?</a>
              </div>
            </form>
          </div>

          {/* Image Section */}
          <div className="image-section">
            <div className="lab-image-container">
              <div className="image-glow" />
              <img
                src="/login-lab.png"
                alt="Laboratory Equipment"
                className="lab-image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}