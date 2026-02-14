"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify-icon/react";

type MapPreviewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    location: { lat: number; lng: number; label?: string } | null;
};

export default function MapPreviewModal({
    isOpen,
    onClose,
    location,
}: MapPreviewModalProps) {
    if (!location) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-100 flex items-center justify-center z-50 bg-black/20 px-4 backdrop-blur-[24px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* White Modal Box */}
                    <motion.div
                        className="
              relative bg-white rounded-2xl shadow-2xl
              w-[90%] max-w-[800px]
              h-[80vh] flex flex-col items-center justify-center
              overflow-hidden
            "
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Close Button (top-right) */}
                        <button
                            onClick={onClose}
                            className="absolute flex items-center rounded-full p-5 pt-3 pr-3 top-0 right-0 text-black hover:border-red-500 hover:text-red-500 hover:cursor-pointer transition z-10"
                        >
                            <Icon icon="mdi:close" width={30} />
                        </button>

                        {/* Header */}
                        <div className="absolute top-0 left-0 p-4 w-full bg-white border-b z-0">
                            <h3 className="text-lg font-semibold text-gray-800">{location.label || "Location Preview"}</h3>
                        </div>

                        {/* Map Iframe */}
                        <div className="w-full h-full pt-16 pb-4 px-4 bg-gray-50 flex items-center justify-center">
                            <iframe
                                width="100%"
                                height="100%"
                                className="rounded-lg border border-gray-200 shadow-inner"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                                allowFullScreen
                            ></iframe>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
