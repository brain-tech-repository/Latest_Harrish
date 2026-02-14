"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";

interface SmartBackLinkProps {
  href: string;   
  back?: boolean;
  children: React.ReactNode;
  [key: string]: any;
}

export default function Link({ href, back, children, ...props }: SmartBackLinkProps) {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    if (typeof window !== "undefined" && window.history.length <= 2) {
      router.push(href);
    } else {
      router.back();
    }
  }

  return (
    back ? (
      <span
        {...props}
        onClick={handleClick}
        style={{ cursor: 'pointer', ...props.style }}
      >
        {children}
      </span>
    ): (<NextLink
      {...props}
      href={href}
      style={{ cursor: 'pointer', ...props.style }}
    >
      {children}
    </NextLink>)
  );
}