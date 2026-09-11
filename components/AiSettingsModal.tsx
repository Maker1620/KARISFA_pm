import React, { useState, useEffect } from 'react';

interface AiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('gemini_user_api_key');
            if (stored) {
                setApiKey(stored);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        localStorage.setItem('gemini_user_api_key', apiKey.trim());
        // Dispatch event to let other components know the key is active
        window.dispatchEvent(new Event('ai-key-updated'));
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_user_api_key');
        setApiKey('');
        window.dispatchEvent(new Event('ai-key-updated'));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white  shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                <div className="bg-blue-800 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <h3 className="text-lg font-bold">Enable AI Features</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-white transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Google provides free access to Gemini AI. To use the AI auto-generation tools (RACI, Task Generator, Charter), simply connect your free Google key. You will not be charged.
                    </p>

                    <div className="bg-slate-50 border border-slate-200  p-4 space-y-3">
                        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                            <li>
                                Click the button below and sign in with your Google account.
                                <div className="mt-2 mb-2">
                                    <a 
                                        href="https://aistudio.google.com/app/apikey" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 bg-slate-200 text-blue-900 hover:bg-slate-300  font-medium transition text-xs"
                                    >
                                        Get Free Key from Google
                                    </a>
                                </div>
                            </li>
                            <li>Click the blue <strong>+ Create API Key</strong> button and copy the key.</li>
                            <li>Paste the key below and click <strong>Save & Activate</strong>.</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Your Gemini API Key</label>
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"}
                                className="w-full px-4 py-2.5  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm text-slate-700 pr-10"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showKey ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50 items-center">
                    {localStorage.getItem('gemini_user_api_key') ? (
                        <button 
                            onClick={handleClear}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50  transition"
                        >
                            Clear Key
                        </button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200  transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900  transition shadow-sm disabled:opacity-50"
                        >
                            Save & Activate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
