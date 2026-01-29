/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable react-x/no-array-index-key */
import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const loginBoxRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const floatingRef1 = useRef<HTMLDivElement>(null);
  const floatingRef2 = useRef<HTMLDivElement>(null);
  const floatingRef3 = useRef<HTMLDivElement>(null);
  const floatingRef4 = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Background transition effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      setNextBgIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
      
      setTimeout(() => {
        setCurrentBgIndex(nextBgIndex);
        setIsTransitioning(false);
      }, 1000);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [nextBgIndex]);

  // GSAP Animations
  useGSAP(() => {
    // Initial page load animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate container fade in
    tl.from(containerRef.current, {
      opacity: 0,
      duration: 0.5
    });

    // Animate login box with bounce effect
    tl.from(loginBoxRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 50,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.3");

    // Animate title letters with stagger
    const titleLetters = titleRef.current?.querySelectorAll('.letter');
    if (titleLetters) {
      tl.from(titleLetters, {
        y: 50,
        opacity: 0,
        rotationX: -90,
        stagger: 0.05,
        duration: 0.6,
        ease: "back.out(1.2)"
      }, "-=0.5");
    }

    // Animate form elements
    const formElements = formRef.current?.querySelectorAll('.form-element');
    if (formElements) {
      tl.from(formElements, {
        x: -30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.5
      }, "-=0.4");
    }

    // Floating elements continuous animation
    gsap.to(floatingRef1.current, {
      y: -20,
      x: 10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(floatingRef2.current, {
      y: 15,
      x: -15,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(floatingRef3.current, {
      y: -25,
      x: 20,
      rotation: 360,
      duration: 6,
      repeat: -1,
      ease: "none"
    });

    gsap.to(floatingRef4.current, {
      y: 20,
      x: -10,
      rotation: -360,
      duration: 5,
      repeat: -1,
      ease: "none"
    });

    // Sparkles animation
    const sparkles = sparklesRef.current?.querySelectorAll('.sparkle');
    if (sparkles) {
      sparkles.forEach((sparkle, index) => {
        gsap.to(sparkle, {
          scale: 1.5,
          opacity: 0,
          duration: 2,
          repeat: -1,
          delay: index * 0.3,
          ease: "power2.out"
        });
      });
    }

    // Shadow pulsing animation
    gsap.to(shadowRef.current, {
      opacity: 0.5,
      scale: 1.05,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, []);

  // Hover animations for login box
  const handleLoginBoxHover = (isHovering: boolean) => {
    gsap.to(loginBoxRef.current, {
      scale: isHovering ? 1.02 : 1,
      boxShadow: isHovering 
        ? "0 35px 60px -15px rgba(0, 0, 0, 0.4)" 
        : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      duration: 0.3,
      ease: "power2.out"
    });

    // Image parallax effect on hover
    gsap.to(imageRef.current, {
      scale: isHovering ? 1.1 : 1,
      rotation: isHovering ? 1 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
  };

  // Input focus animations
  const handleInputFocus = (ref: HTMLInputElement, isFocus: boolean) => {
    const parent = ref.parentElement;
    
    gsap.to(ref, {
      borderColor: isFocus ? "#3b82f6" : "#e5e7eb",
      scale: isFocus ? 1.02 : 1,
      duration: 0.3,
      ease: "power2.out"
    });

    // Glow effect
    const glow = parent?.querySelector('.input-glow');
    if (glow) {
      gsap.to(glow, {
        opacity: isFocus ? 1 : 0,
        scale: isFocus ? 1 : 0.8,
        duration: 0.3
      });
    }
  };

  // Button animations
  const handleButtonHover = (isHovering: boolean) => {
    const button = formRef.current?.querySelector('button[type="submit"]');
    
    if (button) {
      gsap.to(button, {
        scale: isHovering ? 1.05 : 1,
        boxShadow: isHovering 
          ? "0 20px 40px -10px rgba(21, 128, 61, 0.6)" 
          : "0 10px 25px -5px rgba(21, 128, 61, 0.3)",
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  // Error shake animation
  useEffect(() => {
    if (error) {
      const errorElement = formRef.current?.querySelector('.error-message');
      if (errorElement) {  // Add null check
        gsap.from(errorElement, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power1.inOut"
        });
      }
    }
  }, [error]);

  // Success animation when login is successful
  const animateSuccess = () => {
    const tl = gsap.timeline();
    
    // Explode effect
    tl.to(loginBoxRef.current, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out"
    });

    // Fade out
    tl.to(containerRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: "power2.in"
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Button loading animation
    const button = formRef.current?.querySelector('button[type="submit"]');
    if (button) {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }
    
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
      
      // Play success animation before navigation
      animateSuccess();
      
      setTimeout(() => {
        const roleBasedPath = user.roleId === 1 ? "/admin/user" : user.roleId === 2 ? "/researcher" : "/technician";
        void navigate(roleBasedPath, { replace: true });
      }, 800);
      
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Sai email hoặc mật khẩu!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${backgroundImages[currentBgIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: isTransitioning ? 0 : 0.5,
          }}
        />
        
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${backgroundImages[nextBgIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: isTransitioning ? 0.5 : 0,
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/35 to-teal-900/40" />
        <div className="absolute inset-0 bg-gradient-to-tr from-green-600/15 via-transparent to-emerald-600/15" />
      </div>

      {/* Floating decoration elements */}
      <div ref={floatingRef1} className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full blur-3xl" />
      <div ref={floatingRef2} className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl" />
      <div ref={floatingRef3} className="absolute top-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-teal-500/25 to-green-500/25 rounded-full blur-3xl" />
      <div ref={floatingRef4} className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-gradient-to-br from-blue-400/25 to-blue-400/25 rounded-full blur-3xl" />
      
      {/* Sparkle effects */}
      <div ref={sparklesRef} className="absolute inset-0 pointer-events-none">
        <div className="sparkle absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />
        <div className="sparkle absolute top-2/3 left-1/4 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />
        <div className="sparkle absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />
        <div className="sparkle absolute bottom-1/3 left-2/3 w-3 h-3 bg-blue-300 rounded-full shadow-lg shadow-blue-300/50" />
        <div className="sparkle absolute top-1/5 right-1/5 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
      </div>
      
      <div className="relative z-10">
        <div 
          ref={loginBoxRef}
          className="w-[900px] h-[520px] bg-white rounded-[40px] shadow-2xl flex overflow-hidden border border-gray-200/50 relative"
          onMouseEnter={() => handleLoginBoxHover(true)}
          onMouseLeave={() => handleLoginBoxHover(false)}
        >
          <div className="w-1/2 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] flex flex-col justify-center px-12 py-10 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl" />
            
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-2xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-2xl" />
            
            <div className="relative z-10">
              <div ref={titleRef} className="mb-8 overflow-visible relative">
                <h1 className="text-5xl font-extrabold mb-1 leading-tight cursor-default text-title-glow">
                  {["D", "a", "L", "a", "t", "O", "r", "c", "h", "i", "d"].map((letter, i) => (
                    <span key={i} className="letter inline-block hover:text-emerald-500 transition-colors duration-300">
                      {letter}
                    </span>
                  ))}
                </h1>
                <h1 className="text-6xl font-extrabold leading-tight cursor-default inline-block relative text-title-glow-teal">
                  {["L", "a", "b"].map((letter, i) => (
                    <span key={i} className="letter inline-block hover:scale-110 transition-transform duration-300">
                      {letter}
                    </span>
                  ))}
                  <span className="absolute -right-2 top-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping shadow-lg shadow-emerald-400/50"></span>
                  <span className="absolute -right-2 top-0 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                </h1>
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-400/30 via-blue-400/30 to-blue-400/30 blur-3xl -z-10 rounded-3xl" />
              </div>
              
              <form ref={formRef} onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-4">
                <div className="form-element relative group">
                  <input
                    type="text"
                    placeholder={t('auth.username')}
                    className="w-full rounded-xl border-2 bg-white/90 border-gray-200 px-4 py-3 text-base focus:outline-none transition-all duration-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => handleInputFocus(e.target, true)}
                    onBlur={(e) => handleInputFocus(e.target, false)}
                    autoFocus
                  />
                  <div className="input-glow absolute inset-0 rounded-xl bg-blue-500/20 pointer-events-none opacity-0 blur-xl" />
                  {email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full">
                      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
                
                <div className="form-element relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.password')}
                    className="w-full rounded-xl border-2 bg-white/90 border-gray-200 px-4 py-3 text-base focus:outline-none transition-all duration-300 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => handleInputFocus(e.target, true)}
                    onBlur={(e) => handleInputFocus(e.target, false)}
                  />
                  <div className="input-glow absolute inset-0 rounded-xl bg-blue-500/20 pointer-events-none opacity-0 blur-xl" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="error-message form-element text-red-600 text-sm mt-1 px-4 py-2 bg-red-50 rounded-xl border-2 border-red-200 shadow-lg shadow-red-100/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-100/50 to-red-100/0 animate-shimmer" />
                    <span className="relative z-10">{error}</span>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="form-element mt-4 bg-gradient-to-r from-green-700 via-green-800 to-green-700 text-white font-semibold rounded-xl py-3 text-base shadow-xl disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                  onMouseEnter={() => !isLoading && handleButtonHover(true)}
                  onMouseLeave={() => !isLoading && handleButtonHover(false)}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.loginButton')
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/50 to-emerald-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>
            </div>
          </div>
          
          <div className="w-1/2 h-full relative overflow-hidden">
            <img
              ref={imageRef}
              src="/login-lab.png"
              alt="Lab Illustration"
              className="object-cover w-full h-full rounded-tr-[40px] rounded-br-[40px]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-green-900/5 rounded-tr-[40px] rounded-br-[40px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-transparent rounded-tr-[40px] rounded-br-[40px]" />
            <div className="absolute inset-0 rounded-tr-[40px] rounded-br-[40px] shadow-inner pointer-events-none" />
          </div>
          
          <div 
            ref={shadowRef}
            className="absolute -bottom-6 -right-6 w-[900px] h-[520px] bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-[40px] shadow-2xl -z-10 blur-sm" 
          />
        </div>
      </div>
    </div>
  );
}