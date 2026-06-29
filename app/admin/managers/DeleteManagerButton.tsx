'use client';

import { useState } from 'react';
import { deleteManagerByAdmin } from '@/actions/manager-actions';
import { t } from '@/lib/i18n';

interface DeleteManagerButtonProps {
    managerId: string;
    managerName: string;
}

export default function DeleteManagerButton({ managerId, managerName }: DeleteManagerButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const executeDelete = async () => {
        setShowConfirmModal(false);
        setIsDeleting(true);
        try {
            await deleteManagerByAdmin(managerId);
            alert(`Gestore ${managerName} eliminato con successo.`);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isDeleting}
                className="h-[34px] w-[42px] flex shrink-0 items-center justify-center bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-sm transition-colors disabled:opacity-50 outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                title={`Elimina ${managerName}`}
            >
                {isDeleting ? (
                    <span className="text-xs font-black animate-pulse">...</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )}
            </button>

            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-sm shadow-2xl max-w-sm w-full border-t-4 border-red-500 animate-in zoom-in-95 duration-200">
                                                <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight mb-2">
                            {t('admin', 'MANAGER_DELETE_TITLE')}
                        </h3>
                        <p className="text-xs text-slate-600 mb-6 font-bold leading-relaxed uppercase tracking-wider">
                            {t('admin', 'MANAGER_DELETE_BODY', { name: managerName })}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-sm transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 rounded-sm transition-colors shadow-sm"
                            >
                                Sì, Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
