/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import type { User } from "../../types/Auth";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { getRoleName } from "../../utils/jwtHelper";
import "./ProfilePage.css";

// ─── Animation Variants ────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.08 },
  }),
};

const fieldVariants: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit:    { opacity: 0, x: 8,  transition: { duration: 0.18, ease: "easeIn"  } },
};

// ─── Sub-components ────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  name: string;
  type?: string;
  isEditing: boolean;
  readonly?: boolean;
  note?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  label,
  value,
  name,
  type = "text",
  isEditing,
  readonly = false,
  note,
  onChange,
}: FieldProps) {
  const editable = isEditing && !readonly;

  return (
    <div className="ol-field">
      <span className="ol-field__label">{label}</span>

      <AnimatePresence mode="wait" initial={false}>
        {editable ? (
          <motion.input
            key="input"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="ol-input"
            autoComplete="off"
          />
        ) : (
          <motion.div
            key="value"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className={`ol-field__value${!value ? " ol-field__value--empty" : ""}`}
          >
            {value || "—"}
          </motion.div>
        )}
      </AnimatePresence>

      {note && <span className="ol-field__note">{note}</span>}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────

interface CardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index?: number;
  full?: boolean;
}

function Card({ icon, title, children, index = 0, full = false }: CardProps) {
  return (
    <motion.div
      className={`ol-card${full ? " ol-card--full" : ""}`}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <div className="ol-card__header">
        <div className="ol-card__icon">{icon}</div>
        <span className="ol-card__title">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

// ── Icons (inline SVG helpers) ────────────────────────────────────────────

const IconUser = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconPhone = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const IconShield = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconEdit = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconSave = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconX = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconCamera = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ── Avatar component ──────────────────────────────────────────────────────

interface AvatarProps {
  user: User;
  isEditing: boolean;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

function Avatar({ user, isEditing, previewUrl, onFileChange, t }: AvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!isEditing) return;
    gsap.to(avatarRef.current, { scale: 1.06, duration: 0.35, ease: "back.out(1.7)" });
  };

  const handleMouseLeave = () => {
    gsap.to(avatarRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  const imgSrc = previewUrl ?? user.avatarUrl ?? null;
  const initial = user.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="ol-avatar-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className={`ol-avatar-ring${isEditing ? " ol-avatar-ring--active" : ""}`} />

      <div className="ol-avatar" ref={avatarRef}>
        {imgSrc ? (
          <img src={imgSrc} alt={t("profile.avatar")} />
        ) : (
          <span className="ol-avatar__initials">{initial}</span>
        )}
      </div>

      {isEditing && (
        <label className="ol-avatar__edit-overlay" title={t("profile.changeAvatar")}>
          <IconCamera />
          <span>{t("profile.changeAvatar")}</span>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </label>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user: authUser, updateUser, isAuthReady } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState({ id: "", name: "", email: "", phoneNumber: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Page-load GSAP reveal ──────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !user) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(heroRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45 }
    )
    .fromTo(
      gridRef.current ? Array.from(gridRef.current.children) : [],
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
      "-=0.2"
    );

    return () => { tl.kill(); };
  }, [isLoading, user]);

  // ── Data fetching ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) { setIsLoading(false); return; }

      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setUser(response.data);
        setEditUser({
          id:          response.data.id ?? "",
          name:        response.data.name ?? "",
          email:       response.data.email ?? "",
          phoneNumber: response.data.phoneNumber ?? "",
        });
      } catch {
        enqueueSnackbar(t("profile.cannotLoadUserInfo"), { variant: "error", autoHideDuration: 3000 });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthReady) fetchUserData();
  }, [authUser?.id, isAuthReady, enqueueSnackbar, t]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      let newAvatarUrl = user?.avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);
        const imageResponse = await axiosInstance.post("/api/images/user", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newAvatarUrl = imageResponse.data.value;
      }

      const infoChanged =
        editUser.name        !== user?.name ||
        editUser.email       !== user?.email ||
        editUser.phoneNumber !== user?.phoneNumber ||
        newAvatarUrl         !== user?.avatarUrl;

      if (infoChanged) {
        await axiosInstance.put("/api/user", { ...editUser, avatarUrl: newAvatarUrl });
      }

      const userRes     = await axiosInstance.get<User>(`/api/user/${editUser.id}`);
      const updatedUser = userRes.data;
      setUser(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);

      enqueueSnackbar(t("profile.updateSuccess"), { variant: "success", preventDuplicate: true, autoHideDuration: 2000 });
    } catch (error) {
      const apiError = error as { response?: { data?: string; status?: number }; message?: string };
      const backendMessage = apiError.response?.data ?? apiError.message ?? t("profile.updateFailed");
      enqueueSnackbar(backendMessage, { variant: "error", autoHideDuration: 5000, preventDuplicate: true });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setPreviewUrl(null);
    setEditUser({
      id:          user?.id ?? "",
      name:        user?.name ?? "",
      email:       user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    });
  };

  // ── Guard states ───────────────────────────────────────────────────────
  if (!isAuthReady || isLoading) {
    return (
      <main className="ml-64 mt-16 ol-profile-root">
        <div className="ol-loading">
          <div className="ol-spinner" />
          <span className="ol-loading__text">{t("profile.loadingInfo")}</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="ml-64 mt-16 ol-profile-root">
        <div className="ol-empty">
          <svg className="ol-empty__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="ol-empty__title">{t("profile.noUserFound")}</p>
          <p className="ol-empty__sub">{t("profile.pleaseLoginAgain")}</p>
          <button
            type="button"
            onClick={() => { window.location.href = "/login"; }}
            className="ol-btn ol-btn--primary"
            style={{ marginTop: 12 }}
          >
            {t("common.login")}
          </button>
        </div>
      </main>
    );
  }

  const roleName = user.role ?? getRoleName(user.roleId) ?? "—";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="ml-64 mt-16 ol-profile-root">
      <div className="ol-page">

        {/* ── Hero card ── */}
        <div className="ol-hero" ref={heroRef} style={{ opacity: 0 }}>
          <Avatar
            user={user}
            isEditing={isEditing}
            previewUrl={previewUrl}
            onFileChange={handleAvatarChange}
            t={t}
          />

          <div className="ol-hero-text">
            <h1 className="ol-hero-text__name">{user.name || t("profile.noName")}</h1>
            <p className="ol-hero-text__email">{user.email || t("profile.noEmail")}</p>
            <div className="ol-role-badge">
              <span className="ol-role-badge__dot" />
              {roleName}
            </div>
          </div>

          <AnimatePresence>
            {!isEditing && (
              <motion.button
                type="button"
                onClick={() => setIsEditing(true)}
                className="ol-edit-btn"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <IconEdit />
                {t("profile.editInfo")}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Info cards grid ── */}
        <motion.div ref={gridRef} className="ol-cards-grid" layout>

          <Card icon={<IconUser />} title={t("profile.fullName")} index={0}>
            <Field label={t("profile.fullName")} value={editUser.name} name="name" isEditing={isEditing} onChange={handleChange} />
          </Card>

          <Card icon={<IconPhone />} title={t("profile.phoneNumber")} index={1}>
            <Field label={t("profile.phoneNumber")} value={editUser.phoneNumber} name="phoneNumber" isEditing={isEditing} onChange={handleChange} />
          </Card>

          <Card icon={<IconShield />} title={t("profile.emailAddress")} index={2} full>
            <Field label={t("profile.emailAddress")} value={editUser.email} name="email" type="email" isEditing={isEditing} readonly note={t("profile.emailNote")} onChange={handleChange} />
          </Card>

          <Card icon={<IconShield />} title={t("profile.detailedInfo")} index={3} full>
            <div className="ol-account-row">
              <span className="ol-account-row__key">{t("profile.fullName")}</span>
              <span className="ol-account-row__val">{user.name || "—"}</span>
            </div>
            <div className="ol-account-row">
              <span className="ol-account-row__key">Role</span>
              <span className="ol-account-row__val">{roleName}</span>
            </div>
            <div className="ol-account-row">
              <span className="ol-account-row__key">ID</span>
              <span className="ol-account-row__val" style={{ fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                {user.id ?? "—"}
              </span>
            </div>
          </Card>

          <AnimatePresence>
            {isEditing && (
              <motion.div
                className="ol-action-bar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <button type="button" onClick={handleCancel} className="ol-btn ol-btn--ghost">
                  <IconX />
                  {t("profile.cancelEdit")}
                </button>
                <button type="button" onClick={() => { void handleSave(); }} className="ol-btn ol-btn--primary">
                  <IconSave />
                  {t("profile.saveChanges")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </main>
  );
}