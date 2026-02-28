"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts/themeContext";
import { usePathname } from "next/navigation";
import Logo from "../../components/logo";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { LinkDataType, SidebarDataType } from "../data/dashboardLinks";
import { useRouter } from "next/navigation";
import { usePermissionManager } from "@/app/components/contexts/usePermission";

export default function Sidebar({
  onClickHandler,
  isOpen,
  setIsOpen
}: {
  onClickHandler: (href: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { filteredMenu } = usePermissionManager();
  const data: SidebarDataType[] = (() => {
    if (!filteredMenu) return [];
    // If filteredMenu items are grouped (have 'data') treat as SidebarDataType[]
    if (Array.isArray(filteredMenu) && filteredMenu.length > 0 && 'data' in filteredMenu[0]) {
      return filteredMenu as unknown as SidebarDataType[];
    }
    // Otherwise assume it's a flat LinkDataType[] and wrap into a single group
    return [
      {
        name: undefined,
        data: filteredMenu as unknown as LinkDataType[],
      },
    ];
  })();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [activeHref, setActiveHref] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? false),
    }));
  };

  const handleClick = (href: string, label: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleMenu(label);
      setIsOpen(true); // Ensure sidebar is open when interacting with menus
    } else {
      setActiveHref(href);
      onClickHandler(href);
    }
  };

  // Helper to check if a parent menu should be active if any child is active
  const isParentActive = (children: LinkDataType[] | undefined): boolean => {
    if (!children) return false;
    return children.some((child) => {
      if (child.href === pathname) return true;
      if (child.children && child.children.length > 0) {
        return child.children.some((grand) => grand.href === pathname);
      }
      return false;
    });
  };

  useEffect(() => {
    const current = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : "");
    setActiveHref(current);

    const initialOpen: Record<string, boolean> = {};
    data.forEach((group) => {
      group.data.forEach((link) => {
        if (link.children && link.children.length > 0) {
          const shouldOpen = link.children.some((child) => {
            if (child.href === current) return true;
            if (child.children && child.children.length > 0) {
              return child.children.some((grand) => grand.href === current);
            }
            return false;
          });
          if (shouldOpen) {
            initialOpen[link.label] = true;
          }
        }
      });
    });

    setOpenMenus((prev) => ({ ...prev, ...initialOpen }));
  }, [pathname]);

  // close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
        try { setIsOpen(false); } catch (err) { /* ignore */ }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const { mode } = useTheme();
  
  return (
    <div className="group peer" ref={wrapperRef}>
      <div className={`${isOpen ? "w-[250px]" : "w-0 overflow-hidden sm:w-[80px]"} group-hover:w-[250px] h-[100vh] absolute ease-in-out duration-600 bg-black z-50 pb-[40px] border-r border-gray-200 dark:border-gray-600`}>
        {/* logo */}
        <div className="w-full h-[60px] px-[16px] py-[12px] border-r-[1px] border-b-[1px] border-gray-200 dark:border-gray-600">
          <div
            onClick={() => router.push("/")}
            className={`${isOpen ? "w-full" : "w-[24px]"}  group-hover:w-full h-full m-auto cursor-pointer`}>
            <Logo
              width={128}
              height={35}
              twClass="object-cover h-full object-[0%_center]"
            />
          </div>
        </div>

        {/* menu */}
        <div className={`w-full h-[calc(100vh-60px)] text-white py-5 ${isOpen ? "px-2" : "px-4"} pb-40 group-hover:px-2 transition-all ease-in-out border-[1px] border-gray-200 dark:border-gray-600 border-t-0 overflow-y-auto scrollbar-none`}>
          {data.map((group: SidebarDataType, index) => (
            <div key={index} className={`${isOpen ? "mb-[20px]" : "m-0"} group-hover:mb-[20px]`}>
              <ul className="w-full flex flex-col gap-[6px]">
                {group.data.map((link: LinkDataType, index) => {
                  const hasChildren = Boolean(link.children && link.children.length > 0);
                  const isChildrenOpen = openMenus[link.label] ?? false;
                  const trailingIcon = hasChildren
                    ? isChildrenOpen
                      ? "mdi-light:chevron-down"
                      : "mdi-light:chevron-right"
                    : link.trailingIcon;
                  const isActive = link.href === pathname || isParentActive(link.children);
                  
                  return (
                    <li key={link.href + index} className="group/item">
                      {/* Removed background colors here */}
                      <div className={`transition-colors duration-200 ${isActive ? "text-blue-400" : "text-white hover:text-blue-400"}`}>
                        <SidebarBtn
                          isActive={isActive}
                          href={hasChildren ? "#" : link.href}
                          label={link.label}
                          labelTw={`${isOpen ? "block" : "hidden"} group-hover:block whitespace-nowrap ${isActive ? "text-blue-400" : "text-white"} group-hover/item:text-blue-400 transition-colors`}
                          leadingIcon={link.leadingIcon}
                          leadingIconSize={20}
                          className={`pr-[1px] bg-transparent ${isActive ? "text-blue-400" : "text-white"} group-hover/item:text-blue-400`}
                          {...(trailingIcon && { trailingIcon })}
                          trailingIconTw={`${isOpen ? "block" : "hidden"} group-hover:block ${isActive ? "text-blue-400" : "text-white"} group-hover/item:text-blue-400 transition-colors`}
                          onClick={() => handleClick(link.href, link.label, hasChildren)}
                        />
                      </div>
                      
                      {/* 2nd level menu */}
                      {hasChildren && isChildrenOpen && link.children && (
                        <ul className={`${isOpen ? "block" : "hidden"} group-hover:block mt-1 ml-[10px]`}>
                          {link.children.map((child: LinkDataType) => {
                            const isChildActive = child.href === pathname || (child.children && child.children.some((grand) => grand.href === pathname));
                            const hasThirdLevel = child.children && child.children.length > 0;
                            const isThirdLevelOpen = openMenus[child.label] ?? false;
                            
                            return (
                              <li key={child.href} className="w-full group/sub">
                                {/* Removed background colors here */}
                                <div
                                  className={`flex items-center gap-2 w-full cursor-pointer transition-all ${isChildActive ? "text-blue-400 font-medium" : "text-white hover:text-blue-400"}`}
                                  onClick={() => {
                                    if (hasThirdLevel) {
                                      toggleMenu(child.label);
                                      setIsOpen(true);
                                    } else {
                                      setActiveHref(child.href);
                                      onClickHandler(child.href);
                                    }
                                  }}
                                >
                                  {/* Line indicator */}
                                  <span
                                    className={`w-0.5 h-8 ml-4 flex-shrink-0 rounded ${isChildActive ? "bg-blue-400" : "bg-gray-300 dark:bg-gray-700"}`}
                                  ></span>
                                  
                                  {/* Label */}
                                  <div className="flex-1">
                                    <SidebarBtn
                                      isActive={false}
                                      href={child.href}
                                      label={child.label}
                                      className="bg-transparent!" // Removed nested hardcoded backgrounds
                                      labelTw={`${isOpen ? "block" : "hidden"} group-hover:block ${isChildActive ? "text-blue-400" : "text-white"} group-hover/sub:text-blue-400 transition-colors`}
                                      isSubmenu={true}
                                      trailingIcon={hasThirdLevel ? (isThirdLevelOpen ? "mdi-light:chevron-down" : "mdi-light:chevron-right") : child.trailingIcon}
                                      trailingIconTw={`${isChildActive ? "text-blue-400 font-medium" : "text-white"} group-hover/sub:text-blue-400 transition-colors`}
                                    />
                                  </div>
                                </div>
                                
                                {/* 3rd level menu */}
                                {hasThirdLevel && isThirdLevelOpen && (
                                  <ul className="ml-8 mt-1">
                                    {(child.children || []).map((third: LinkDataType) => {
                                      const isThirdActive = third.href === pathname;
                                      return (
                                        <li key={third.href} className={`w-full cursor-pointer transition-all ${isThirdActive ? "text-blue-400 font-medium" : "text-white hover:text-blue-400 hover:font-medium"} group/third px-2`}>
                                          <div
                                            className="flex items-center gap-2 w-full"
                                            onClick={() => {
                                              setActiveHref(third.href);
                                              onClickHandler(third.href);
                                            }}
                                          >
                                            {/* Subtle vertical line for indentation */}
                                            <span className={`w-1 h-6 rounded mr-2 transition-colors ${isThirdActive ? "bg-blue-400" : "bg-gray-200 dark:bg-gray-700 group-hover/third:bg-blue-400"}`}></span>
                                            <div className="flex-1">
                                              <SidebarBtn
                                                isActive={false}
                                                href={third.href}
                                                label={third.label}
                                                className="hover:bg-transparent bg-transparent"
                                                labelTw={`block text-xs transition-colors ${isThirdActive ? "text-blue-400" : "text-white"} group-hover/third:text-blue-400`}
                                                isSubmenu={true}
                                              />
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}