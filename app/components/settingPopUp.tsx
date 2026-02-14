"use client";
import { useState } from "react";
import SidebarBtn from "./dashboardSidebarBtn";
import InputFields from "./inputFields";

interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  prefix?: string;
  setPrefix?: (val: string) => void;
  onSave?: (mode: "auto" | "manual", code?: string) => void;
}

export default function SettingPopUp({ isOpen, onClose, title, prefix = "", setPrefix, onSave }: ModalProps) {
  const [option, setOption] = useState<"auto"|"manual">("auto");
  const [nextNumber, setNextNumber] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        className="rounded-lg shadow-lg w-full max-w-md p-6 relative"
        style={{
          backgroundColor: 'var(--popup-bg, #FFFFFF)',
          color: 'var(--popup-text, #181D27)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 hover:opacity-70"
          style={{ color: 'var(--popup-secondary-text, #535862)' }}
        >
          ✕
        </button>

        {/* Title */}
        {title && (
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--popup-text, #181D27)' }}>{title}</h2>
        )}

        {/* Message */}
        <p className="text-sm mb-4" style={{ color: 'var(--popup-secondary-text, #535862)' }}>
          Your {title} number is set in auto-generate mode to save your time.
          Are you sure about changing this setting?
        </p>

        {/* Radio Options */}
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="auto"
              checked={option === "auto"}
              onChange={() => setOption("auto")}
            />
            Continue auto-generating {title}
          </label>
          {option === "auto" && (
            <div className="ml-6 mt-2 flex gap-3">
              <InputFields
                label="Prefix"
                value={prefix}
                onChange={() => {}}
                disabled
              />
              <InputFields
                label="Next Number"
                value={nextNumber}
                onChange={(e) => setNextNumber(e.target.value)}
              />
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="manual"
              checked={option === "manual"}
              onChange={() => {
                setOption("manual");
                onSave && onSave("manual", ""); // clear code in parent when switching to manual
              }}
            />
            I will add them manually each time
          </label>
          {/* In manual mode, do not show Enter Code input. User will edit in main input field. */}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2 rounded-lg hover:opacity-80"
            style={{
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              borderColor: 'var(--card-border, #D1D5DB)',
              borderWidth: '1px',
              color: 'var(--popup-text, #374151)'
            }}
          >
            Cancel
          </button>
          <SidebarBtn
            label={`Save ${title}`}
            isActive={true}
            onClick={() => {
              if (option === "auto") {
                const code = prefix + nextNumber;
                onSave && onSave("auto", code);
              }
              onClose && onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
