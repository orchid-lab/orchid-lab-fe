import { useNavigate } from "react-router-dom";

const mockFollowUp = {
  id: "RPT002",
  taskName: "Nghiên cứu lai P. amabilis",
  experimentLog: "EXP001",
  stage: "Giai đoạn 2: Cấy mô",
  author: "Trần Văn Hưng",
  date: "22/06/2025",
  images: ["/public/vite.svg", "/src/assets/react.svg"],
  content:
    "Báo cáo follow-up: cập nhật tiến độ và kết quả mới... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
};

export default function ReportFollowUpDetails() {
  const navigate = useNavigate();
  // const { id } = useParams();

  // Thực tế sẽ fetch theo id
  const followUp = mockFollowUp;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Chi tiết báo cáo follow-up</h1>
      <div className="bg-white rounded shadow p-6">
        {/* Hình ảnh đính kèm */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Hình ảnh đính kèm</h3>
          <div className="flex gap-4">
            {followUp.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`followup-img-${idx}`}
                className="w-32 h-32 object-cover rounded"
              />
            ))}
          </div>
        </div>
        {/* Thông tin cơ bản */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <b>Tên task:</b> {followUp.taskName}
          </div>
          <div>
            <b>Kế hoạch nuôi cấy:</b> {followUp.experimentLog}
          </div>
          <div>
            <b>Giai đoạn:</b> {followUp.stage}
          </div>
          <div>
            <b>Người viết:</b> {followUp.author}
          </div>
          <div>
            <b>Ngày gửi:</b> {followUp.date}
          </div>
        </div>
        {/* Nội dung chi tiết */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Nội dung báo cáo follow-up</h3>
          <div className="bg-gray-50 p-4 rounded">{followUp.content}</div>
        </div>
        <button
          className="bg-gray-300 text-gray-800 px-5 py-2 rounded font-semibold hover:bg-gray-400 transition"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>
      </div>
    </main>
  );
}
