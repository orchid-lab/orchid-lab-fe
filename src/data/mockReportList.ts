export interface AdminReportItem {
  id: string;
  name: string;
  description: string;
  technician: string;
  createdAt: string;
  status: "Seen" | "NotSeen";
  sampleId?: string;
}

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

export const mockReportsList: AdminReportItem[] = [
  {
    id: "RPT-001",
    name: "Mẫu A - Phiên 1",
    description: "Đốm nâu cạnh lá",
    technician: "Nguyễn Văn A",
    createdAt: daysAgo(1),
    status: "NotSeen",
    sampleId: "SMP-001",
  },
  {
    id: "RPT-002",
    name: "Mẫu B - Phiên 1",
    description: "Rễ phát triển chậm",
    technician: "Trần Thị B",
    createdAt: daysAgo(3),
    status: "Seen",
    sampleId: "SMP-002",
  },
  {
    id: "RPT-003",
    name: "Mẫu C - Phiên 2",
    description: "Mốc nhẹ trên bầu",
    technician: "Lê Văn C",
    createdAt: daysAgo(5),
    status: "NotSeen",
    sampleId: "SMP-003",
  },
  {
    id: "RPT-004",
    name: "Mẫu D - Phiên 1",
    description: "Nhiệt độ cao bất thường",
    technician: "Phạm Thị D",
    createdAt: daysAgo(6),
    status: "Seen",
    sampleId: "SMP-004",
  },
  {
    id: "RPT-005",
    name: "Mẫu E - Phiên 3",
    description: "Phát triển tốt",
    technician: "Nguyễn Văn E",
    createdAt: daysAgo(8),
    status: "Seen",
    sampleId: "SMP-005",
  },
  {
    id: "RPT-006",
    name: "Mẫu F - Phiên 1",
    description: "Vàng rễ nhẹ",
    technician: "Trương G",
    createdAt: daysAgo(10),
    status: "NotSeen",
    sampleId: "SMP-006",
  },
  {
    id: "RPT-007",
    name: "Mẫu G - Phiên 2",
    description: "Đột biến lá",
    technician: "Hoàng H",
    createdAt: daysAgo(12),
    status: "Seen",
    sampleId: "SMP-007",
  },
  {
    id: "RPT-008",
    name: "Mẫu H - Phiên 1",
    description: "Thiếu nước",
    technician: "Đỗ I",
    createdAt: daysAgo(14),
    status: "NotSeen",
    sampleId: "SMP-008",
  },
  {
    id: "RPT-009",
    name: "Mẫu J - Phiên 1",
    description: "Ổn định",
    technician: "Phan K",
    createdAt: daysAgo(16),
    status: "Seen",
    sampleId: "SMP-009",
  },
  {
    id: "RPT-010",
    name: "Mẫu L - Phiên 2",
    description: "Mốc nặng",
    technician: "Võ L",
    createdAt: daysAgo(18),
    status: "NotSeen",
    sampleId: "SMP-010",
  },
  {
    id: "RPT-011",
    name: "Mẫu M - Phiên 1",
    description: "Thân yếu",
    technician: "Ngô M",
    createdAt: daysAgo(20),
    status: "Seen",
    sampleId: "SMP-011",
  },
  {
    id: "RPT-012",
    name: "Mẫu N - Phiên 3",
    description: "Phát triển tốt",
    technician: "Trần N",
    createdAt: daysAgo(30),
    status: "Seen",
    sampleId: "SMP-012",
  },
];

export function getMockReportsPage(page = 1, pageSize = 5) {
  const start = (page - 1) * pageSize;
  const data = mockReportsList.slice(start, start + pageSize);
  return {
    value: {
      data,
      totalCount: mockReportsList.length,
      pageCount: Math.ceil(mockReportsList.length / pageSize),
    },
  };
}
