"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => (
        <div className="h-[150px] border border-gray-300 rounded-lg animate-pulse bg-gray-100" />
    ),
});

interface RichTextEditorProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string | boolean;
    className?: string;
}

export default function RichTextEditor({
    label,
    value,
    onChange,
    placeholder = "Enter description...",
    required = false,
    error,
    className = "",
}: RichTextEditorProps) {
    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ indent: "-1" }, { indent: "+1" }],
                ["link"],
                ["clean"],
            ],
        }),
        []
    );

    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "indent",
        "link",
    ];

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div
                className={`rich-text-editor ${
                    error ? "border-red-500" : ""
                }`}
            >
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                />
            </div>
            {error && typeof error === "string" && (
                <span className="text-sm text-red-500">{error}</span>
            )}
            <style jsx global>{`
                .rich-text-editor .ql-container {
                    min-height: 120px;
                    font-size: 14px;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                }
                .rich-text-editor .ql-toolbar {
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                    background-color: #f9fafb;
                }
                .rich-text-editor .ql-editor {
                    min-height: 100px;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
            `}</style>
        </div>
    );
}
