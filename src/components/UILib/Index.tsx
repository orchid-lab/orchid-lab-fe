/* ═══════════════════════════════════════════════════════════════════════════════ */
/* 🎨 ORCHID LAB - UI Components Library (Pro Max Edition)                           */
/* Reusable TypeScript/React Components aligned with Design System                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import React from "react";

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 1. BUTTONS - Pro Max Interactive Elements
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orchid-500 disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-orchid-500 text-white hover:bg-orchid-600 active:bg-orchid-700 hover:shadow-pro-lg focus:ring-orchid-500",
    secondary:
      "border-2 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-orchid-500 hover:text-orchid-500 dark:hover:text-orchid-400 hover:bg-orchid-50 dark:hover:bg-orchid-900/20",
    ghost:
      "bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    danger:
      "bg-error text-white hover:bg-red-700 active:bg-red-800 hover:shadow-lg",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {icon && !isLoading && <span className="flex-shrink-0">{icon}</span>}
      {isLoading && (
        <span className="flex-shrink-0 inline-block animate-spin">⏳</span>
      )}
      {children}
    </button>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 2. CARDS - Pro Max Container Elements
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  outlined?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
  outlined = true,
}) => {
  const baseClasses =
    "bg-white dark:bg-neutral-800 rounded-lg p-6 transition-all duration-200";
  const shadowClasses = hoverable
    ? "shadow-sm hover:shadow-md border border-neutral-200 dark:border-neutral-700"
    : "shadow-sm border border-neutral-200 dark:border-neutral-700";
  const hoverClasses = hoverable ? "hover:border-orchid-300 dark:hover:border-orchid-600" : "";

  return (
    <div className={`${baseClasses} ${shadowClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

interface DataCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  color?: "orchid" | "success" | "warning" | "error" | "info";
}

export const DataCard: React.FC<DataCardProps> = ({
  icon,
  label,
  value,
  description,
  color = "orchid",
}) => {
  const colorClasses = {
    orchid: "from-orchid-50 to-orchid-100 dark:from-orchid-900/20 dark:to-orchid-900/10 border-orchid-200 dark:border-orchid-800",
    success:
      "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800",
    warning:
      "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800",
    error:
      "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800",
    info: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800",
  };

  return (
    <Card
      className={`bg-gradient-to-br ${colorClasses[color]} border`}
      hoverable
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-bold mt-2 text-neutral-900 dark:text-neutral-50">
            {value}
          </p>
          {description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="text-3xl ml-4">{icon}</div>
      </div>
    </Card>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 3. BADGES & STATUS INDICATORS - Visual Status
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  icon,
  className = "",
}) => {
  const variantClasses = {
    success: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700",
    warning:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
    error:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700",
    info: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
    neutral:
      "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 4. INPUT FIELDS - Form Controls
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helperText,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-2.5 ${icon ? "pl-12" : ""} rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orchid-500 focus:border-transparent transition-all duration-200 ${
            error ? "border-error focus:ring-error" : ""
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-1 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 5. MODALS & DIALOGS - Overlay Components
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-11/12 ${sizeClasses[size]} animate-scale-in z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 6. PAGINATION - Table Navigation
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-neutral-200 dark:border-neutral-700">
      {showInfo && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
          {totalItems > 0 && itemsPerPage > 0 && (
            <>
              {" "}
              ({totalItems} items total)
            </>
          )}
        </p>
      )}

      <div className="flex gap-2">
        {/* Previous Button */}
        {currentPage > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            icon="←"
          />
        )}

        {/* Page Numbers */}
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                currentPage === pageNum
                  ? "bg-orchid-500 text-white shadow-pro-md"
                  : "border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-orchid-500 dark:hover:border-orchid-400"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        {currentPage < totalPages && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            icon="→"
          />
        )}
      </div>
    </div>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 7. LOADING SKELETON - Content Placeholder
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface SkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  count = 1,
  height = "h-4",
  width = "w-full",
  circle = false,
  className = "",
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded ${
            circle ? "rounded-full" : ""
          } ${height} ${width} ${className} mb-3`}
        />
      ))}
    </>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * 8. ALERT / TOAST - Notification Display
 * ───────────────────────────────────────────────────────────────────────────────
 */

interface AlertProps {
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  message: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  icon,
  onClose,
  dismissible = true,
  className = "",
}) => {
  const typeClasses = {
    success: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
    warning:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
    error:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
    info: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  };

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 ${typeClasses[type]} ${className}`}
    >
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-xl font-bold hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ───────────────────────────────────────────────────────────────────────────────

// Button Component
<Button variant="primary" size="md" onClick={handleClick}>
  Create Report
</Button>

// Card Component
<Card hoverable className="p-8">
  <h3 className="text-lg font-bold mb-4">Card Title</h3>
  <p>Card content here...</p>
</Card>

// DataCard Component
<DataCard
  icon="📊"
  label="Total Reports"
  value={245}
  color="orchid"
/>

// Badge Component
<Badge label="Approved" variant="success" icon="✓" />

// Input Component
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  icon="📧"
  error={emailError}
  helperText="We'll never share your email"
/>

// Modal Component
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Create New Report"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Create
      </Button>
    </>
  }
>
  {/* Modal content */}
</Modal>

// Pagination Component
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  showInfo
  totalItems={total}
/>

// Skeleton Component
<Skeleton count={3} height="h-6" width="w-3/4" />

// Alert Component
<Alert
  type="success"
  title="Success!"
  message="Report created successfully"
  icon="✓"
  dismissible
  onClose={() => setShowAlert(false)}
/>

 */
