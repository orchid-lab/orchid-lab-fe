/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
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

  // Refs for GSAP animations
  const titleRef = useRef<HTMLHeadingElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Background rotation effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  // GSAP Title Animation
  useEffect(() => {
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.letter');
      
      gsap.fromTo(
        letters,
        { 
          opacity: 0,
          y: 50,
          rotationX: -90,
          scale: 0.5,
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "back.out(1.7)",
          delay: 0.3,
        }
      );

      // Continuous floating animation for title
      gsap.to(letters, {
        y: -10,
        duration: 2,
        stagger: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.5,
      });

      // Glow pulse effect
      gsap.to(titleRef.current, {
        textShadow: "0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.5)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  // GSAP Card entrance
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          scale: 0.8,
          opacity: 0,
          rotationY: -15,
        },
        {
          scale: 1,
          opacity: 1,
          rotationY: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, []);

  // Floating particles animation
  useEffect(() => {
    if (particlesRef.current) {
      const particles = particlesRef.current.querySelectorAll('.particle');
      
      particles.forEach((particle, index) => {
        gsap.to(particle, {
          x: `random(-100, 100)`,
          y: `random(-100, 100)`,
          opacity: `random(0.3, 0.8)`,
          duration: `random(3, 6)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2,
        });
      });
    }
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
      
      const roleBasedPath = user.roleId === 1 ? "/admin/user" : user.roleId === 2 ? "/researcher" : "/technician/tasks";
      void navigate(roleBasedPath, { replace: true });
      
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Sai email hoặc mật khẩu!");
    } finally {
      setIsLoading(false);
    }
  };

  // Split text into letters for animation
  const titleText = "OrchidLab";
  const letters = titleText.split('').map((letter, index) => (
    <span key={index} className="letter" style={{ display: 'inline-block' }}>
      {letter}
    </span>
  ));

  return (
    <div className="login-container">
      {/* Background with rotating images */}
      <div className="background-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBgIndex}
            className="background-image"
            style={{
              backgroundImage: `url(${backgroundImages[currentBgIndex]})`,
            }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className="background-gradient-overlay" />
        <div className="background-overlay" />
      </div>

      {/* Floating Particles */}
      <div ref={particlesRef} className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Floating Orbs */}
      <motion.div 
        className="floating-orb orb-1"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div 
        className="floating-orb orb-2"
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div 
        className="floating-orb orb-3"
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -20, 20, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Glass Card */}
      <div ref={cardRef} className="glass-card">
        <div className="glass-content">
          {/* Form Section */}
          <div className="form-section">
            <div className="title-section">
              <h1 ref={titleRef} className="main-title">
                <span className="title-gradient">
                  {letters}
                </span>
              </h1>
              <motion.div
                className="title-underline"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 1.5 }}
              />
            </div>

            <form onSubmit={(e) => void handleLogin(e)} className="login-form">
              <motion.div 
                className="input-wrapper form-element"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <div className="input-glow" />
              </motion.div>

              <motion.div 
                className="input-wrapper form-element"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="input-glow" />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
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
                </motion.button>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    className="error-message form-element"
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="submit-button form-element"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="button-text">
                  {isLoading ? (
                    <>
                      <motion.span 
                        className="spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </span>
                <div className="button-shine" />
              </motion.button>

              <motion.div 
                className="forgot-password"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.a 
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Quên mật khẩu?
                </motion.a>
              </motion.div>
            </form>
          </div>

          {/* Image Section */}
          <motion.div 
            className="image-section"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.div 
              className="lab-image-container"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="image-glow" />
              <img
                src="/login-lab.png"
                alt="Laboratory Equipment"
                className="lab-image"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}