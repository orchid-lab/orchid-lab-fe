import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import type { LoginResponse } from "../../types/Auth";
import "./Login.css";
import LoginBackground  from "../../assets/LoginBackground.jpg";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      setNextBgIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
      
      setTimeout(() => {
        setCurrentBgIndex(nextBgIndex);
        setIsTransitioning(false);
      }, 1000); //đơn vị ms :v
    }, 5000);

    return () => clearInterval(intervalId);
  }, [nextBgIndex]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/authentication/login", {
        email,
        password,
      });
      if (res.status !== 200) {
        throw new Error("Login failed");
      }
      const data = res.data as LoginResponse;
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      if (data.user.roleID === 1) {
        void navigate("/admin/user");
      } else if (data.user.roleID === 2) {
        void navigate("/method");
      } else if (data.user.roleID === 3) {
        void navigate("/technician/tasks");
      }
    } catch {
      setError("Sai email hoặc mật khẩu!");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Enhanced animated background với crossfade mượt */}
      <div className="absolute inset-0 -z-10">
        {/* Background hiện tại */}
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
        
        {/* Background tiếp theo cho crossfade */}
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
        
        {/* Overlay gradient với độ tối hơn */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/35 to-teal-900/40" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-green-600/15 via-transparent to-emerald-600/15 animate-gradient" />
      </div>

      {/* Enhanced floating decoration elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-teal-500/25 to-green-500/25 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-gradient-to-br from-green-400/25 to-emerald-400/25 rounded-full blur-3xl animate-float-reverse" />
      
      {/* Enhanced sparkle effects */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-sparkle shadow-lg shadow-green-400/50" />
      <div className="absolute top-2/3 left-1/4 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-sparkle-delayed shadow-lg shadow-emerald-400/50" />
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-teal-400 rounded-full animate-sparkle-slow shadow-lg shadow-teal-400/50" />
      <div className="absolute bottom-1/3 left-2/3 w-3 h-3 bg-green-300 rounded-full animate-sparkle shadow-lg shadow-green-300/50" style={{animationDelay: '1s'}} />
      <div className="absolute top-1/5 right-1/5 w-2 h-2 bg-emerald-500 rounded-full animate-sparkle-delayed shadow-lg shadow-emerald-500/50" style={{animationDelay: '1.5s'}} />
      
      {/* Orbiting particles */}
      <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-400/60 rounded-full animate-orbit shadow-lg shadow-green-400/50" />
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400/60 rounded-full animate-orbit-reverse shadow-lg shadow-emerald-400/50" />
        <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-teal-400/60 rounded-full animate-orbit-slow shadow-lg shadow-teal-400/50" />
      </div>
      
      <div className="relative z-10 animate-fade-in-up">
        <div className="w-[900px] h-[520px] bg-white rounded-[40px] shadow-2xl flex overflow-hidden border border-gray-200/50 relative hover:shadow-3xl transition-all duration-500 animate-slide-in group">
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-rotate-gradient pointer-events-none" style={{padding: '2px'}} />
          
          <div className="w-1/2 bg-gradient-to-br from-[#d8eddb] to-[#c5e5ca] flex flex-col justify-center px-12 py-10 relative overflow-hidden">
            {/* Enhanced background effects */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-pulse-slow" />
            
            {/* Decorative corner elements */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-2xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-2xl" />
            
            <div className="relative z-10">
              <div className="mb-8 overflow-visible relative">
                <h1 className="text-5xl font-extrabold mb-1 leading-tight animate-slide-in-left hover:scale-105 transition-transform duration-300 cursor-default inline-block relative text-title-glow">
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0s'}}>D</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.1s'}}>a</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.2s'}}>L</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.3s'}}>a</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.4s'}}>t</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.5s'}}>O</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.6s'}}>r</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.7s'}}>c</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.8s'}}>h</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '0.9s'}}>i</span>
                  <span className="inline-block animate-letter-float" style={{animationDelay: '1s'}}>d</span>
                </h1>
                <h1 className="text-6xl font-extrabold leading-tight animate-slide-in-left-delayed hover:scale-105 transition-transform duration-300 cursor-default inline-block relative text-title-glow-teal">
                  <span className="inline-block animate-letter-bounce" style={{animationDelay: '0s'}}>L</span>
                  <span className="inline-block animate-letter-bounce" style={{animationDelay: '0.15s'}}>a</span>
                  <span className="inline-block animate-letter-bounce" style={{animationDelay: '0.3s'}}>b</span>
                  <span className="absolute -right-2 top-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping shadow-lg shadow-emerald-400/50"></span>
                  <span className="absolute -right-2 top-0 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                </h1>
                {/* Enhanced glow effect */}
                <div className="absolute -inset-6 bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 blur-3xl -z-10 animate-pulse-slow rounded-3xl" />
                <div className="absolute -inset-8 bg-gradient-to-br from-green-300/20 via-transparent to-emerald-300/20 blur-2xl -z-10 animate-rotate-gradient rounded-3xl" />
              </div>
              
              <form
                onSubmit={(e) => {
                  void handleLogin(e);
                }}
                className="flex flex-col gap-4 animate-fade-in-delayed"
              >
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Email"
                    className="w-full rounded-xl border-2 bg-white/90 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-300 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  {/* Input icon effect */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full opacity-0 group-focus-within:opacity-100 animate-pulse" />
                </div>
                
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full rounded-xl border-2 bg-white/90 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-300 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full opacity-0 group-focus-within:opacity-100 animate-pulse" />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm mt-1 px-4 py-2 bg-red-50 rounded-xl border-2 border-red-200 animate-shake shadow-lg shadow-red-100/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-100/50 to-red-100/0 animate-shimmer" />
                    <span className="relative z-10">{error}</span>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 bg-gradient-to-r from-green-700 via-green-800 to-green-700 hover:from-green-800 hover:via-green-900 hover:to-green-800 text-white font-semibold rounded-xl py-3 text-base shadow-xl hover:shadow-2xl shadow-green-700/30 hover:shadow-green-800/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group animate-pulse-glow"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/50 to-emerald-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>
            </div>
          </div>
          
          {/* Enhanced right side with image */}
          <div className="w-1/2 h-full relative group overflow-hidden">
            <img
              src="/login-lab.png"
              alt="Lab Illustration"
              className="object-cover w-full h-full rounded-tr-[40px] rounded-br-[40px] transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
            />
            {/* Multi-layer gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-green-900/5 rounded-tr-[40px] rounded-br-[40px] transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-transparent rounded-tr-[40px] rounded-br-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-tr-[40px] rounded-br-[40px] shadow-inner pointer-events-none" />
            
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 translate-x-[-100%] translate-y-[-100%] group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-transform duration-1000 rounded-tr-[40px] rounded-br-[40px]" />
          </div>
          
          {/* Enhanced decorative shadow element */}
          <div className="absolute -bottom-6 -right-6 w-[900px] h-[520px] bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-[40px] shadow-2xl -z-10 animate-pulse-slow blur-sm" />
        </div>
      </div>
    </div>
  );
}

// Cơ chế hoạt động background animation:

// Luôn có 2 background images render cùng lúc
// Khi chuyển: background cũ fade ra, background mới fade vào
// Sau khi transition hoàn tất, cập nhật index