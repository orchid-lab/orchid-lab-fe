/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search, X, Plus, Trash2, Users,
  ShieldCheck, FlaskConical, Wrench, AlertCircle, Loader2, Eye,
  Mail, Phone, Calendar, BadgeCheck,
} from "lucide-react";
import type { User, UserApiResponse } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { getRoleName } from "../../../utils/jwtHelper";
import gsap from "gsap";
import "./DashboardAdmin.css";

/* ─── Helpers ─────────────────────────────────────────── */
function getRoleOptions(t: (k: string) => string) {
  return [
    { value: "", label: t("roles.allRoles") },
    { value: "Admin", label: t("roles.admin") },
    { value: "Researcher", label: t("roles.researcher") },
    { value: "Lab Technician", label: t("roles.technician") },
  ];
}

function getUserRoleName(user: User): string {
  if (user.role && typeof user.role === "string") return user.role;
  return getRoleName(user.roleId);
}

const PAGE_SIZE = 10;

/* ─── Animation variants ──────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.32, delay: (i as number) * 0.045, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

/* ─── Avatar helper ───────────────────────────────────── */
function UserAvatar({ user: u, size = "md" }: { user: User; size?: "sm" | "md" | "lg" }) {
  const initials = (u.name ?? "?")
    .split(" ")
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const sizeMap = {
    sm: "w-8 h-8 text-xs rounded-lg",
    md: "w-10 h-10 text-sm rounded-xl",
    lg: "w-24 h-24 text-3xl rounded-3xl",
  };

  if (u.avatarUrl) {
    return (
      <img
        src={u.avatarUrl}
        alt={u.name}
        className={`${sizeMap[size]} object-cover border-2 border-white shadow-sm flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeMap[size]} bg-gradient-to-br from-rose-100 to-rose-200 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-[#9f1239]">{initials}</span>
    </div>
  );
}

/* ─── Role badge ──────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();
  if (normalized === "admin")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
        <ShieldCheck className="w-3 h-3" /> {role}
      </span>
    );
  if (normalized === "researcher")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <FlaskConical className="w-3 h-3" /> {role}
      </span>
    );
  if (normalized === "lab technician" || normalized === "technician")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <Wrench className="w-3 h-3" /> {role}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
      {role}
    </span>
  );
}

/* ─── View User Modal ─────────────────────────────────── */
function ViewUserModal({ user: u, onClose }: { user: User; onClose: () => void }) {
  const { t } = useTranslation();
  const role = getUserRoleName(u);

  const initials = (u.name ?? "?")
    .split(" ")
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const fields: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    {
      icon: <Mail className="w-4 h-4 text-rose-400" />,
      label: t("common.email"),
      value: <span className="font-mono text-sm">{u.email ?? "—"}</span>,
    },
    {
      icon: <Phone className="w-4 h-4 text-rose-400" />,
      label: t("common.phone"),
      value: u.phoneNumber
        ? <span className="text-sm">{u.phoneNumber}</span>
        : <span className="italic text-slate-400 text-xs">{t("common.noPhoneNumber") || "Chưa cập nhật"}</span>,
    },
    {
      icon: <BadgeCheck className="w-4 h-4 text-rose-400" />,
      label: t("common.role"),
      value: <RoleBadge role={role} />,
    },
    {
      icon: <Calendar className="w-4 h-4 text-rose-400" />,
      label: t("common.createdAt"),
      value: (
        <span className="text-sm">
          {u.createdDate
            ? new Date(u.createdDate).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ minHeight: "100vh" }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.93, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 28 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header banner ── */}
        <div className="relative bg-gradient-to-br from-[#9f1239] via-[#be123c] to-[#e11d48] px-8 pt-10 pb-20">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-xs font-semibold text-rose-200 uppercase tracking-widest mb-6">
            {t("user.userDetail") || "Chi tiết người dùng"}
          </p>
        </div>

        {/* ── Avatar overlapping banner ── */}
        <div className="relative -mt-12 px-8 mb-4 flex items-end gap-5">
          <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-[#9f1239]">{initials}</span>
            )}
          </div>
          <div className="pb-1">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{u.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{u.email}</p>
          </div>
        </div>

        {/* ── Info card ── */}
        <div className="mx-6 mb-6">
          <div className="bg-slate-50 rounded-2xl border border-rose-100 overflow-hidden">
            {fields.map((f, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i < fields.length - 1 ? "border-b border-rose-50" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-rose-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    {f.label}
                  </p>
                  <div className="text-slate-800 truncate">{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {t("common.close") || "Đóng"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Confirm Delete Modal ────────────────────────────── */
function ConfirmDeleteModal({
  name, onClose, onConfirm,
}: {
  name: string; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ minHeight: "100vh" }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <motion.div
            className="bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 w-16 h-16"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("user.deleteUser")}</h2>
          <p className="text-sm text-gray-500 mb-1">{t("user.deleteUserConfirm")}</p>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="mt-3 text-xs font-medium text-rose-500 bg-rose-50 inline-block px-3 py-1 rounded-full">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 bg-gray-50/50">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            {t("common.cancel")}
          </button>
          <motion.button type="button" onClick={() => void handleConfirm()} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm disabled:opacity-60 transition-colors"
            whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xóa...</> : t("common.delete")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Add User Modal ──────────────────────────────────── */
function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState({ name: "", email: "", phoneNumber: "", roleId: 2 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!data.name.trim()) {
      enqueueSnackbar(t("user.nameRequired") || "Name is required", { variant: "error", autoHideDuration: 3000 });
      return;
    }
    if (!data.email.trim()) {
      enqueueSnackbar(t("user.emailRequired") || "Email is required", { variant: "error", autoHideDuration: 3000 });
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post("/api/authentication/register", data);
      onSuccess();
      onClose();
      enqueueSnackbar(t("user.userAdded"), { variant: "success", autoHideDuration: 3000, preventDuplicate: true });
    } catch (error) {
      const e = error as { response?: { data?: string }; message?: string };
      enqueueSnackbar(e.response?.data ?? e.message ?? t("user.userAddFailed"), { variant: "error", autoHideDuration: 5000 });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ minHeight: "100vh" }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <Plus className="w-4 h-4 text-[#9f1239]" />
          </div>
          <h2 className="text-base font-bold text-slate-800">{t("user.addUser")}</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("common.name")} <span className="text-rose-500">*</span>
            </label>
            <input type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder={t("common.name")}
              value={data.name}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("common.email")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder={t("common.email")}
              value={data.email}
              onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("common.phone")}</label>
            <input type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder={t("common.phone")}
              value={data.phoneNumber}
              onChange={(e) => setData((d) => ({ ...d, phoneNumber: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("common.role")} <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              value={data.roleId}
              onChange={(e) => setData((d) => ({ ...d, roleId: parseInt(e.target.value) }))}>
              <option value={2}>{t("roles.researcher")}</option>
              <option value={3}>{t("roles.technician")}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            {t("common.cancel")}
          </button>
          <motion.button type="button" onClick={() => void handleAdd()} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#9f1239] rounded-xl hover:bg-[#be123c] shadow-sm disabled:opacity-60 transition-colors"
            whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang thêm...</> : t("common.add")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
export default function DashboardAdmin() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [viewTarget, setViewTarget] = useState<User | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  /* ── GSAP progress bar ── */
  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => { runProgress(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    runProgress();
    try {
      const res = await axiosInstance.get(`/api/user?pageNumber=${page}&pageSize=${PAGE_SIZE}`);
      const data = res.data as UserApiResponse;
      setUsers(data.data || []);
      setTotal(Number(data.totalCount) || 0);
      setTotalPages(Number(data.pageCount) || 1);
    } catch {
      setUsers([]); setTotal(0); setTotalPages(1);
    } finally { setLoading(false); }
  };

  useEffect(() => { void fetchUsers(); }, [page]);

  /* ── Filter ── */
  const filteredUsers = users
    .filter((u) => u.id !== currentUser?.id)
    .filter((u) => {
      const matchSearch =
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || getUserRoleName(u) === roleFilter;
      return matchSearch && matchRole;
    });

  /* ── Stats ── */
  const adminCount = users.filter((u) => getUserRoleName(u).toLowerCase() === "admin").length;
  const researcherCount = users.filter((u) => getUserRoleName(u).toLowerCase() === "researcher").length;
  const technicianCount = users.filter((u) => getUserRoleName(u).toLowerCase() === "lab technician").length;

  const stats = [
    { label: t("user.totalUsers"), value: total, icon: Users, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-[#9f1239]", valColor: "text-[#9f1239]" },
    { label: t("user.admins"), value: adminCount, icon: ShieldCheck, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-600", valColor: "text-purple-700" },
    { label: t("user.researchers"), value: researcherCount, icon: FlaskConical, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-600", valColor: "text-blue-700" },
    { label: t("user.technicians"), value: technicianCount, icon: Wrench, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600", valColor: "text-emerald-700" },
  ];

  const hasFilter = search.trim() || roleFilter;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await axiosInstance.delete("/api/user", { data: { id: deleteTarget.id } });
    await fetchUsers();
    enqueueSnackbar(t("user.userDeleted"), { variant: "success", autoHideDuration: 3000, preventDuplicate: true });
  };

  const tableHeaders = [
    t("common.name"), t("common.email"), t("common.phone"),
    t("common.role"), t("common.createdAt"), t("common.action"),
  ];

  return (
    <main className="admin-users-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#9f1239] to-[#f43f5e] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
                {t("user.userManagement")}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Quản lý tài khoản và phân quyền người dùng trong hệ thống
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9f1239] text-white text-sm font-semibold rounded-xl hover:bg-[#be123c] transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            {t("user.addUser")}
          </motion.button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className={`${s.bg} border ${s.border} rounded-2xl p-5 shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                  <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                </div>
                <p className={`text-3xl font-extrabold ${s.valColor}`}>{s.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Filter card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-base font-semibold text-[#9f1239] mb-4">
            {t("seedling.filterAndSearch") || "Lọc & Tìm kiếm"}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
            >
              {getRoleOptions(t).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`${t("common.search")} tên hoặc email...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
              />
            </div>

            {hasFilter && (
              <motion.button
                type="button"
                onClick={() => { setSearch(""); setRoleFilter(""); }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-rose-100 rounded-xl hover:bg-rose-50 hover:text-[#9f1239] transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                {t("common.clearFilters") || "Xoá bộ lọc"}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {hasFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-rose-50"
              >
                <span className="text-xs text-slate-400">{t("seedling.appliedFilters") || "Bộ lọc đang áp dụng"}</span>
                {search.trim() && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    Tìm kiếm: "{search}"
                  </span>
                )}
                {roleFilter && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    {t("common.role")}: {roleFilter}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#fff1f2] to-[#fffbfb] border-b border-rose-100">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-center p-4 font-semibold text-gray-900 whitespace-nowrap"
                    >
                      {h}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-rose-50 animate-pulse">
                      {Array.from({ length: 6 }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-rose-100 rounded w-full" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">👥</div>
                      <div className="text-lg font-medium">{t("common.noData")}</div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((u, idx) => (
                      <motion.tr
                        key={u.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden" animate="visible" exit="exit"
                        layout
                        onClick={() => setViewTarget(u)}
                        whileHover={{ backgroundColor: "rgba(255,241,242,0.85)", transition: { duration: 0.15 } }}
                        className="border-b border-rose-50 cursor-pointer"
                      >
                        {/* Name + Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={u} size="sm" />
                            <span className="font-medium text-gray-900 whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="p-4 text-center text-gray-600 text-sm">
                          {u.email}
                        </td>
                        {/* Phone */}
                        <td className="p-4 text-center text-gray-500 text-sm whitespace-nowrap">
                          {u.phoneNumber ?? (
                            <span className="text-slate-300 italic text-xs">{t("common.noPhoneNumber") || "—"}</span>
                          )}
                        </td>
                        {/* Role */}
                        <td className="p-4 text-center">
                          <RoleBadge role={getUserRoleName(u)} />
                        </td>
                        {/* Created */}
                        <td className="p-4 text-center text-gray-500 text-sm whitespace-nowrap">
                          {u.createdDate
                            ? new Date(u.createdDate).toLocaleDateString("vi-VN", {
                                day: "2-digit", month: "2-digit", year: "numeric",
                              })
                            : "—"}
                        </td>
                        {/* Actions */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              type="button" title={t("common.view") || "Xem"}
                              onClick={(e) => { e.stopPropagation(); setViewTarget(u); }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-[#9f1239] hover:border-rose-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              type="button" title={t("common.delete")}
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: u.id, name: u.name }); }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <AnimatePresence>
            {!loading && total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-rose-100"
              >
                <span className="font-medium">
                  {t("user.showing") || "Hiển thị"} {filteredUsers.length} {t("user.usersOutOf") || "trong"} {total} {t("user.users") || "người dùng"}
                </span>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    {page > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">←</motion.button>
                    )}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pn: number;
                      if (totalPages <= 5) pn = i + 1;
                      else if (page <= 3) pn = i + 1;
                      else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                      else pn = page - 2 + i;
                      return (
                        <motion.button key={pn} type="button"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setPage(pn)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            page === pn ? "bg-[#9f1239] text-white" : "bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300"
                          }`}>{pn}</motion.button>
                      );
                    })}
                    {page < totalPages && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">→</motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewTarget && (
          <ViewUserModal
            user={viewTarget}
            onClose={() => setViewTarget(null)}
          />
        )}
        {showAdd && (
          <AddUserModal
            onClose={() => setShowAdd(false)}
            onSuccess={() => { void fetchUsers(); setPage(1); }}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </AnimatePresence>
    </main>
  );
}