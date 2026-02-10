import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose, icon: Icon, color = "blue" }) => (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
        <div className={`p-6 bg-gradient-to-r from-${color}-600 to-${color}-700 text-white flex justify-between items-center shadow-md shrink-0`}>
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10">
                        <Icon size={24} />
                    </div>
                )}
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={28} />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {children}
            </div>
        </div>
    </div>
);

export default Modal;
