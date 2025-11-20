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
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Background với opacity */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(${LoginBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.5
        }}
      />
      
      <div className="w-[900px] h-[520px] bg-white rounded-[40px] shadow-xl flex overflow-hidden border border-gray-300 relative z-10">
        {/* Left: Login Form */}
        <div className="w-1/2 bg-[#d8eddb] flex flex-col justify-center px-12 py-10">
          <h1 className="text-4xl font-bold text-green-800 mb-8 leading-tight">
            DaLatOrchid
            <br />
            Lab
          </h1>
          <form
            onSubmit={(e) => {
              void handleLogin(e);
            }}
            className="flex flex-col gap-4"
          >
            <input
              type="text"
              placeholder="Email"
              className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
            <button
              type="submit"
              className="mt-4 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg py-3 text-base shadow transition-colors"
            >
              Đăng nhập
            </button>
          </form>
        </div>
        {/* Right: Image */}
        <div className="w-1/2 h-full relative">
          <img
            src="/login-lab.png"
            alt="Lab Illustration"
            className="object-cover w-full h-full rounded-tr-[40px] rounded-br-[40px]"
          />
          <div className="absolute inset-0 rounded-tr-[40px] rounded-br-[40px] shadow-xl pointer-events-none" />
        </div>
        <div className="absolute -bottom-4 -right-4 w-[900px] h-[520px] bg-transparent rounded-[40px] shadow-lg -z-10" />
      </div>
    </div>
  );
}