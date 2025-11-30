import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import type { LoginResponse } from "../../types/Auth";
import LoginBackground from "../../assets/LoginBackground.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/user/login", {
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
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 animate-pulse-slow"
          style={{
            backgroundImage: `url(${LoginBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.3
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-emerald-50/70 to-teal-50/80" />
      </div>

      {/* Floating decoration elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-green-200/30 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl animate-float-slow" />
      
      {/* Sparkle effects */}
      <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-green-400 rounded-full animate-sparkle" />
      <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-sparkle-delayed" />
      <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-teal-400 rounded-full animate-sparkle-slow" />
      <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-green-300 rounded-full animate-sparkle" style={{animationDelay: '1s'}} />
      
      <div className="relative z-10 animate-fade-in-up">
        <div className="w-[900px] h-[520px] bg-white rounded-[40px] shadow-2xl flex overflow-hidden border border-gray-200/50 relative hover:shadow-3xl transition-all duration-500 animate-slide-in">
          <div className="w-1/2 bg-gradient-to-br from-[#d8eddb] to-[#c5e5ca] flex flex-col justify-center px-12 py-10 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />         
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
                {/* Glow effect behind text */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 blur-2xl -z-10 animate-pulse-slow rounded-3xl" />
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
                    className="w-full rounded-xl border-2 bg-white/80 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-300 hover:border-green-300 hover:shadow-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 via-green-400/5 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full rounded-xl border-2 bg-white/80 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-300 hover:border-green-300 hover:shadow-md"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 via-green-400/5 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm mt-1 px-2 py-1 bg-red-50 rounded-lg border border-red-200 animate-shake">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-semibold rounded-xl py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              </form>
            </div>
          </div>
          
          {/* Right: Image với overlay effect */}
          <div className="w-1/2 h-full relative group overflow-hidden">
            <img
              src="/login-lab.png"
              alt="Lab Illustration"
              className="object-cover w-full h-full rounded-tr-[40px] rounded-br-[40px] transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-green-900/5 rounded-tr-[40px] rounded-br-[40px]" />
            <div className="absolute inset-0 rounded-tr-[40px] rounded-br-[40px] shadow-inner pointer-events-none" />
          </div>
          
          {/* Decorative shadow element */}
          <div className="absolute -bottom-4 -right-4 w-[900px] h-[520px] bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-[40px] shadow-lg -z-10 animate-pulse-slow" />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes letterFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes letterBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.1);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-letter-float {
          animation: letterFloat 3s ease-in-out infinite;
        }

        .animate-letter-bounce {
          animation: letterBounce 2s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-sparkle-delayed {
          animation: sparkle 2s ease-in-out 0.7s infinite;
        }

        .animate-sparkle-slow {
          animation: sparkle 3s ease-in-out 0.3s infinite;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slide-in-left-delayed {
          animation: slideInLeft 0.6s ease-out 0.1s both;
        }

        .animate-fade-in-delayed {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 6s ease-in-out 2s infinite;
        }

        .animate-float-slow {
          animation: float 8s ease-in-out 1s infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}