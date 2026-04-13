
import React, { useState, useEffect } from "react";

const Unauthorized: React.FC = () => {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    // 1. Timer để đếm ngược hiển thị trên giao diện
    const countdown = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 2. Timeout để thực hiện lệnh quay lại sau đúng 5 giây
    const redirect = setTimeout(() => {
      // Kiểm tra nếu có lịch sử trang trước thì quay lại, 
      // nếu không thì đẩy về trang chủ (hoặc trang login) để tránh bị treo
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/"; // Thay đổi path tùy theo dự án của bạn
      }
    }, 5000);

    // Dọn dẹp cả hai khi component bị hủy
    return () => {
      clearInterval(countdown);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
        <div className="text-red-500 text-7xl mb-6 animate-bounce">🚫</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Truy cập bị từ chối
        </h1>
        <p className="text-gray-500 mb-8">
          Bạn không có quyền truy cập vào trang này.
        </p>
        
        <div className="py-3 px-4 bg-gray-50 rounded-lg inline-block">
          <p className="text-sm text-gray-600">
            Tự động quay lại trong <span className="font-bold text-blue-600 text-lg">{seconds}</span> giây...
          </p>
        </div>

        {/* Thanh tiến trình mượt mà hơn */}
        <div className="w-full bg-gray-100 h-1.5 mt-8 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(seconds / 5) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;