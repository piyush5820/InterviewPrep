import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const getDisplayDuration = () => {
        const baseTime = 2000;
        const messageLength = message.length;
        const readingTime = Math.max(messageLength * 50, 1000);

        // Error messages stay longer
        const typeMultiplier = type === "error" ? 1.5 : type === "warning" ? 1.2 : 1;

        return Math.min(baseTime + readingTime * typeMultiplier, 8000); 
    };

    const typeStyles = {
        success: {
            accent: "bg-[#0f766e]",
            softBg: "bg-[#d9efea]",
            iconColor: "text-[#0f766e]",
            title: "Successful"
        },
        error: {
            accent: "bg-[#d92d20]",
            softBg: "bg-[#fde3e1]",
            iconColor: "text-[#d92d20]",
            title: "Oh snap"
        },
        warning: {
            accent: "bg-[#9a5a0a]",
            softBg: "bg-[#fff0d2]",
            iconColor: "text-[#9a5a0a]",
            title: "Warning"
        }
    };

    const IconComponent =
        type === "success" ? CheckCircle :
            type === "error" ? XCircle :
                AlertTriangle;

    const styles = typeStyles[type];

    useEffect(() => {
        // Slow appearing animation with delay
        const appearTimer = setTimeout(() => {
            setIsVisible(true);
        }, 100); // Small delay before starting the animation

        const duration = getDisplayDuration();
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                onClose();
            }, 500); // Wait for exit animation
        }, duration + 100); // Account for the initial delay

        return () => {
            clearTimeout(appearTimer);
            clearTimeout(timer);
        };
    }, [onClose, message, type]);

    const handleManualClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 500); // Wait for slower exit animation
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div
                role="status"
                aria-live="polite"
                className={`
                    max-w-sm w-full pointer-events-auto overflow-hidden
                    bg-[#0f1e2e] text-white
                    border border-white/10 rounded-2xl
                    shadow-[0_18px_48px_rgba(15,30,46,0.32)]
                    flex items-start gap-3 p-4
                    transform transition-all duration-300 ease-out
                    ${isVisible && !isExiting
                        ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
                        : isExiting
                            ? 'translate-x-full opacity-0 scale-95'
                            : 'translate-x-full translate-y-2 opacity-0 scale-90'
                    }
                `}
            >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${styles.softBg} flex items-center justify-center mt-0.5`}>
                    <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-white text-[13px] font-bold tracking-tight">
                        {styles.title}
                    </h4>
                    <p className="text-white/70 text-[13px] mt-1 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={handleManualClose}
                    className="flex-shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
