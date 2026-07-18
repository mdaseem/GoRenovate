import React, { useEffect, useRef, useState } from "react";
import "./Overlay.style.css";
import Image from "next/image";

type PropsType = {
  children?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDisable: boolean;
  isLoginPage?: boolean;
  shouldReturnNull?: boolean;
  variant?: "page" | "menu";
  id?: string;
};

function MenuOverlay({
  isOpen,
  setIsOpen,
  children,
  id,
}: Pick<PropsType, "isOpen" | "setIsOpen" | "children" | "id">) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      panelRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id={id} ref={panelRef} className="overlay-menu-panel" role="menu">
      {children}
    </div>
  );
}

function Overlay(props: PropsType) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!props.isOpen) {
      setHasEntered(false);
      return;
    }
    let secondFrame: number;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setHasEntered(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [props.isOpen]);

  if (props.shouldReturnNull) return;
  if (props.isDisable) {
    return <>{props.children}</>;
  }

  if (props.variant === "menu") {
    return (
      <MenuOverlay
        isOpen={props.isOpen}
        setIsOpen={props.setIsOpen}
        id={props.id}
      >
        {props.children}
      </MenuOverlay>
    );
  }

  return (
    <div
      className={` product-detail-page-container product-overlay ${
        hasEntered ? "open" : ""
      }`}
    >
      <div className="overlay-sub-container">
        <div className="overlay-header-container">
          <div className="header-back">
            {props.isLoginPage ? null : (
              <button
                className="go-back"
                onClick={() => props.setIsOpen(false)}
              >
                <Image src="/back.svg" width={20} height={20} alt="Back" />
              </button>
            )}
          </div>
          <div className="temp-space" />
        </div>
        <div className="overlay-content">{props.children}</div>
      </div>
    </div>
  );
}

export default Overlay;
