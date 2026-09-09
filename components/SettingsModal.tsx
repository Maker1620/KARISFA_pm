import React, { useState } from 'react';
import { getClientId, setStoredClientId, getAppId, setStoredAppId, getApiKey, setStoredApiKey } from '../services/driveService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [clientId, setClientId] = useState(getClientId() === 'YOUR_CLIENT_ID_HERE' ? '' : getClientId());
    const [appId, setAppId] = useState(getAppId());
    const [apiKey, setApiKey] = useState(getApiKey());

    if (!isOpen) return null;

    const handleSave = () => {
        if (clientId) {
            setStoredClientId(clientId);
        }
        setStoredAppId(appId);
        setStoredApiKey(apiKey);
        // Reload to re-init Google API with new settings
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-2">
                        <strong className="block text-sm font-bold">Fixing "Authorization Error 400"</strong>
                        <p>
                            The error <em>"Storagerelay URI is not allowed for 'NATIVE_DESKTOP' client type"</em> means you created the wrong type of Client ID.
                        </p>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li>Go to Google Cloud Console &gt; Credentials.</li>
                            <li>Create Credential &gt; OAuth Client ID.</li>
                            <li><strong>CRITICAL:</strong> Select <strong>"Web application"</strong> as the Application Type. (Do NOT select Desktop).</li>
                            <li>Add <code>{window.location.origin}</code> to <strong>"Authorized JavaScript origins"</strong>.</li>
                            <li>Use the new Client ID below.</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Google Cloud Client ID</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm text-slate-700 placeholder:text-slate-400"
                            placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Must be from a "Web application" credential type.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Google Project Number</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm text-slate-700 placeholder:text-slate-400"
                            placeholder="e.g. 123456789012"
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Required for the Folder Picker. Found on the Google Cloud Dashboard home page.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Google API Key (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm text-slate-700 placeholder:text-slate-400"
                            placeholder="AIzaSy..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Used for Google Drive Picker. Leave blank if you don't have one.
                        </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                        >
                            Save & Reload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};