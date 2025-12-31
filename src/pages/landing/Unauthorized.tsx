import React from "react";

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Truy cập bị từ chối
        </h1>
        <p className="text-gray-600 mb-4">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
