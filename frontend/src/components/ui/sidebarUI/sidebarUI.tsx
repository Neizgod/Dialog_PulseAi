import { useState, useRef } from "react";
import { LogOut } from "lucide-react";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import logo from "../../../assets/images/DialogPulseLogo.svg";
import dashboardIcon from "../../../assets/images/dashboardIcon.svg";
import dialogsIcon from "../../../assets/images/dialogsIcon.svg";
import importsIcon from "../../../assets/images/importsicon.svg";
import managersIcon from "../../../assets/images/human.svg";
import settingsIcon from "../../../assets/images/settingsicon.svg";
import reportsIcon from "../../../assets/images/reportsicon.svg";
import panelicon from "../../../assets/images/panelicon.svg";
import tag from "../../../assets/images/tag-right.svg";
import { NavLink } from "react-router-dom";
import styles from "./sidebarUI.module.css";
import type { UserRole } from "../../../utils/types/common.types";

type SidebarUIProps = {
  nameUser: string;
  roleUser: UserRole;
  onLogout: () => void;
};

type NavItem = {
  icon: string;
  label: string;
  path: string;
  adminOnly?: boolean;
  // Точное совпадение пути (иначе подсветится и на вложенных, напр.
  // /dashboard/managers активировал бы и «Дашборд», и «Менеджеры»)
  end?: boolean;
};

const navItems: NavItem[] = [
  { icon: dashboardIcon, label: "Дашборд", path: "/dashboard", end: true },
  { icon: dialogsIcon, label: "Диалоги", path: "/dialogs" },
  { icon: managersIcon, label: "Менеджеры", path: "/dashboard/managers" },
  { icon: importsIcon, label: "Импорт данных", path: "/import" },
  { icon: reportsIcon, label: "Загрузки", path: "/downloads" },
  { icon: settingsIcon, label: "Настройки", path: "/settings", adminOnly: true },
];

export const SidebarUI = ({
  nameUser,
  roleUser,
  onLogout,
}: SidebarUIProps) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню профиля по клику вне и по Escape
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  return (
    <aside className={`${styles.sidebar} ${isSideBarOpen ? "" : styles.close}`}>
      <button
        className={styles.toggleBtn}
        type="button"
        onClick={() => setIsSideBarOpen(!isSideBarOpen)}
      >
        <img src={panelicon} />
      </button>
      <div className={styles.logo}>
        <img src={logo} alt="DialogPulse AI Logo" width={40} height={37} />
        {isSideBarOpen && <span>DialogPulse AI</span>}
      </div>
      <nav className={styles.nav}>
        <ul className={styles.ul}>
          {navItems.map((item) => {
            // Пункты только для админа — для остальных недоступны с подсказкой
            const locked = item.adminOnly && roleUser !== "admin";
            return (
              <li key={item.path} className={locked ? styles.lockedItem : ""}>
                {locked ? (
                  <>
                    <div
                      className={`${styles.navItem} ${styles.navlink} ${styles.disabled}`}
                    >
                      <span className={styles.icon}>
                        <img
                          height={24}
                          width={24}
                          src={item.icon}
                          alt={item.label}
                        />
                      </span>
                      {isSideBarOpen && <span>{item.label}</span>}
                    </div>
                    {/* Тултип вне .navItem (у него overflow: hidden) */}
                    <span className={styles.lockTooltip}>
                      Настройки доступны только администраторам
                    </span>
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.end ?? false}
                    className={({ isActive }) =>
                      `${styles.navItem} ${styles.navlink} ${isActive ? styles.active : ""}`
                    }
                  >
                    <span className={styles.icon}>
                      <img
                        height={24}
                        width={24}
                        src={item.icon}
                        alt={item.label}
                      />
                    </span>
                    {isSideBarOpen && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {isSideBarOpen && (
        <div className={styles.userBlockWrap} ref={menuRef}>
          {/* Меню профиля — появляется над блоком по клику */}
          {menuOpen && (
            <div className={styles.userMenu}>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={18} />
                Выход
              </button>
            </div>
          )}
          <div
            className={styles.userBlock}
            role="button"
            tabIndex={0}
            onClick={() => setMenuOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setMenuOpen((v) => !v);
            }}
          >
            <span className={styles.userIcon}> {nameUser[0].toUpperCase()}</span>
            <div className={styles.nameWrapper}>
              <span className={styles.name}>{nameUser}</span>
              <span className={styles.role}>
                {roleUser === "admin" ? "Админ." : "Пользователь"}
              </span>
            </div>
            <span
              className={`${styles.arrow} ${menuOpen ? styles.arrowOpen : ""}`}
            >
              <img src={tag} alt="" />
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
