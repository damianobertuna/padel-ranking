import { t } from '@/lib/i18n';

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-sm flex flex-col items-center gap-4">
                {/* Spinner istituzionale */}
                <svg className="animate-spin h-6 w-6 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    {t('admin', 'LOADING_TEXT')}
                </p>
            </div>
        </div>
    );
}
