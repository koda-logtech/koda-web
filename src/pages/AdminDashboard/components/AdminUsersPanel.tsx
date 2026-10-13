import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Loading from "@components/common/Loading";
import Button from "@components/common/Button";
import Select from "@components/common/Select";
import StatusToggle from "@components/common/StatusToggle";
import ConfirmModal from "@components/common/ConfirmModal";
import { useUsers, useUpdateUser, useDeleteUser } from "@controllers/userController";
import { useAuth } from "@hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { User } from "@/types/models";
import "./AdminUsersPanel.css";

type RoleFilter = "all" | "admin" | "driver" | "user";
type StatusFilter = "all" | "active" | "inactive";
type FilterMenu = "role" | "status" | null;

const ROLE_OPTIONS = [
  { value: "user", labelKey: "admin.users.roleUser" },
  { value: "driver", labelKey: "admin.users.roleDriver" },
  { value: "admin", labelKey: "admin.users.roleAdmin" },
];

function formatDateTime(dateStr?: string, locale: string = "pt-BR") {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

function countActiveAdmins(users: User[]) {
  return users.filter((u) => normalizeRole(u.role) === "admin" && u.is_active).length;
}

/** Select do Koda envia evento `{ target: { value } }`, não o valor direto. */
function readSelectValue(raw: unknown): string {
  if (raw && typeof raw === "object" && "target" in raw) {
    const v = (raw as { target?: { value?: unknown } }).target?.value;
    return String(v ?? "");
  }
  return String(raw ?? "");
}

function normalizeRole(role: string | undefined): string {
  const r = (role ?? "").trim().toLowerCase();
  if (r === "admin" || r === "driver" || r === "user") return r;
  return r || "user";
}

interface AdminUsersPanelProps {
  refreshSignal?: number;
}

export default function AdminUsersPanel({ refreshSignal = 0 }: AdminUsersPanelProps) {
  const { t, i18n } = useTranslation();
  const { user: sessionUser } = useAuth();
  const { addToast } = useToast();
  const locale = i18n.language?.startsWith("en") ? "en-US" : "pt-BR";

  const { data: usersRaw = [], isLoading, isFetching, refetch } = useUsers(1, 200);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = usersRaw as User[];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openFilter, setOpenFilter] = useState<FilterMenu>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (refreshSignal > 0) {
      refetch();
    }
  }, [refreshSignal, refetch]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const roleSelectOptions = useMemo(
    () =>
      ROLE_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey, o.value),
      })),
    [t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = users.filter((u) => {
      const role = normalizeRole(u.role);
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", locale, { sensitivity: "base" }),
    );
  }, [users, search, roleFilter, statusFilter, locale]);

  const isSelf = (u: User) => sessionUser?.id === u.id;

  const wouldRemoveLastAdmin = (target: User, nextRole?: string, nextActive?: boolean) => {
    if (normalizeRole(target.role) !== "admin" || !target.is_active) return false;
    const admins = countActiveAdmins(users);
    if (admins > 1) return false;
    if (nextRole !== undefined && nextRole !== "admin") return true;
    if (nextActive === false) return true;
    return false;
  };

  const handleRoleChange = async (target: User, roleRaw: string) => {
    const role = normalizeRole(roleRaw);
    if (isSelf(target)) return;
    if (role === normalizeRole(target.role)) return;
    if (wouldRemoveLastAdmin(target, role)) {
      addToast({
        message: t("admin.users.lastAdminError", "Não é possível remover o último administrador ativo."),
        type: "error",
      });
      return;
    }

    setPendingUserId(target.id);
    try {
      await updateUser.mutateAsync({
        id: target.id,
        payload: { role },
      });
      addToast({
        message: t("admin.users.roleUpdateSuccess", "Perfil atualizado com sucesso."),
        type: "success",
      });
    } catch (err) {
      addToast({
        message: `${t("admin.users.roleUpdateError", "Não foi possível atualizar o perfil.")} ${getApiErrorMessage(err)}`,
        type: "error",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleActiveChange = async (target: User, nextActive: boolean) => {
    if (isSelf(target)) return;
    if (nextActive === target.is_active) return;
    if (wouldRemoveLastAdmin(target, undefined, nextActive)) {
      addToast({
        message: t("admin.users.lastAdminError", "Não é possível remover o último administrador ativo."),
        type: "error",
      });
      return;
    }

    setPendingUserId(target.id);
    try {
      await updateUser.mutateAsync({
        id: target.id,
        payload: { is_active: nextActive },
      });
      addToast({
        message: t("admin.users.statusUpdateSuccess", "Status atualizado com sucesso."),
        type: "success",
      });
    } catch (err) {
      addToast({
        message: `${t("admin.users.statusUpdateError", "Não foi possível atualizar o status.")} ${getApiErrorMessage(err)}`,
        type: "error",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (isSelf(deleteTarget)) {
      addToast({
        message: t("admin.users.cannotDeleteSelf", "Você não pode excluir sua própria conta."),
        type: "error",
      });
      setDeleteTarget(null);
      return;
    }
    if (wouldRemoveLastAdmin(deleteTarget)) {
      addToast({
        message: t("admin.users.lastAdminError", "Não é possível remover o último administrador ativo."),
        type: "error",
      });
      setDeleteTarget(null);
      return;
    }

    setPendingUserId(deleteTarget.id);
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      addToast({
        message: t("admin.users.deleteSuccess", "Usuário excluído com sucesso."),
        type: "success",
      });
      setDeleteTarget(null);
    } catch (err) {
      addToast({
        message: `${t("admin.users.deleteError", "Não foi possível excluir o usuário.")} ${getApiErrorMessage(err)}`,
        type: "error",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const roleFilterLabel =
    roleFilter === "all"
      ? t("admin.users.filterRoleAll", "Perfil: Todos")
      : t("admin.users.filterRoleValue", "Perfil: {{role}}", {
          role: t(`admin.users.role${roleFilter.charAt(0).toUpperCase()}${roleFilter.slice(1)}`, roleFilter),
        });

  const statusFilterLabel =
    statusFilter === "all"
      ? t("admin.users.filterStatusAll", "Status: Todos")
      : statusFilter === "active"
        ? t("admin.users.filterStatusActive", "Status: Ativos")
        : t("admin.users.filterStatusInactive", "Status: Inativos");

  if (isLoading && users.length === 0) {
    return (
      <div className="admin-users-loading">
        <Loading />
      </div>
    );
  }

  return (
    <div className="admin-users-panel">
      <div className="admin-users-toolbar" ref={toolbarRef}>
        <div className="admin-users-search search-bar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder", "Buscar por nome ou e-mail...")}
            aria-label={t("admin.users.searchPlaceholder", "Buscar por nome ou e-mail...")}
          />
        </div>

        <div className="admin-users-filters">
          <div className="admin-filter-anchor">
            <button
              type="button"
              className={`admin-filter-chip ${openFilter === "role" ? "is-open" : ""}`}
              onClick={() => setOpenFilter((v) => (v === "role" ? null : "role"))}
              aria-expanded={openFilter === "role"}
            >
              {roleFilterLabel}
            </button>
            {openFilter === "role" && (
              <div className="admin-filter-popover" role="dialog" aria-label={t("admin.users.filterRoleTitle", "Filtrar por perfil")}>
                {(["all", "admin", "driver", "user"] as RoleFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`admin-filter-option ${roleFilter === value ? "is-selected" : ""}`}
                    onClick={() => {
                      setRoleFilter(value);
                      setOpenFilter(null);
                    }}
                  >
                    {value === "all"
                      ? t("admin.users.filterRoleAllShort", "Todos")
                      : t(`admin.users.role${value.charAt(0).toUpperCase()}${value.slice(1)}`, value)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-filter-anchor">
            <button
              type="button"
              className={`admin-filter-chip ${openFilter === "status" ? "is-open" : ""}`}
              onClick={() => setOpenFilter((v) => (v === "status" ? null : "status"))}
              aria-expanded={openFilter === "status"}
            >
              {statusFilterLabel}
            </button>
            {openFilter === "status" && (
              <div className="admin-filter-popover" role="dialog" aria-label={t("admin.users.filterStatusTitle", "Filtrar por status")}>
                {(["all", "active", "inactive"] as StatusFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`admin-filter-option ${statusFilter === value ? "is-selected" : ""}`}
                    onClick={() => {
                      setStatusFilter(value);
                      setOpenFilter(null);
                    }}
                  >
                    {value === "all" && t("admin.users.filterStatusAllShort", "Todos")}
                    {value === "active" && t("admin.users.statusActive", "Ativo")}
                    {value === "inactive" && t("admin.users.statusInactive", "Inativo")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isFetching && users.length > 0 && (
        <p className="admin-users-fetching-hint">{t("admin.users.refreshingList", "Atualizando lista...")}</p>
      )}

      <div className="table-responsive">
        <table className="admin-table admin-users-table">
          <thead>
            <tr>
              <th>{t("admin.users.table.name", "Nome")}</th>
              <th>{t("admin.users.table.email", "E-mail")}</th>
              <th>{t("admin.users.table.profile", "Perfil")}</th>
              <th>{t("admin.users.table.status", "Status")}</th>
              <th>{t("admin.users.table.createdAt", "Cadastro em")}</th>
              <th>{t("admin.users.table.actions", "Ações")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const self = isSelf(row);
              const rowBusy = pendingUserId === row.id;
              return (
                <tr key={row.id} className={self ? "admin-users-row-self" : undefined}>
                  <td>
                    {row.name}
                    {self && (
                      <span className="admin-users-you-badge">{t("admin.users.youBadge", "você")}</span>
                    )}
                  </td>
                  <td>{row.email}</td>
                  <td className="admin-users-cell-profile">
                    {self ? (
                      <span className="admin-users-role-readonly" title={t("admin.users.cannotEditSelfRole", "Você não pode alterar seu próprio perfil")}>
                        {roleSelectOptions.find((o) => o.value === normalizeRole(row.role))?.label ?? row.role}
                      </span>
                    ) : (
                      <Select
                        variant="outlined"
                        value={normalizeRole(row.role)}
                        options={roleSelectOptions}
                        onChange={(ev) => handleRoleChange(row, readSelectValue(ev))}
                        containerStyle={{ minWidth: "8.5rem" }}
                      />
                    )}
                  </td>
                  <td>
                    <StatusToggle
                      active={row.is_active}
                      disabled={self || rowBusy || updateUser.isPending}
                      onChange={(next) => handleActiveChange(row, next)}
                    />
                  </td>
                  <td className="date-cell">{formatDateTime(row.created_at, locale)}</td>
                  <td>
                    <Button
                      size="small"
                      variant="danger"
                      disabled={self || rowBusy || deleteUser.isPending}
                      onClick={() => setDeleteTarget(row)}
                    >
                      {t("admin.users.delete", "Excluir")}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  {t("admin.users.empty", "Nenhum usuário encontrado.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("admin.users.deleteModalTitle", "Excluir usuário")}
        message={t("admin.users.deleteModalMessage", "Tem certeza que deseja excluir {{name}}? Esta ação não pode ser desfeita.", {
          name: deleteTarget?.name ?? "",
        })}
        cancelText={t("confirmModal.cancel", "Cancelar")}
        confirmText={t("admin.users.deleteConfirm", "Excluir")}
      />
    </div>
  );
}
