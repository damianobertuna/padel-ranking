import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updatePlayerByAdmin } from '../../../actions/player-actions';
import { SubmitButton } from './SubmitButton';
import BackToHomeButton from "@/components/ui/BackToHomeButton";
import DeletePlayerButton from './DeletePlayerButton';

import { t } from '@/lib/i18n';

export const revalidate = 0;
const PLAYERS_PER_PAGE = 10;

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function AdminPlayersManagement({ searchParams }: PageProps) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: adminCheck } = await supabase
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck || adminCheck.role !== 'admin') {
        return (
            <main className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center">
                <p className="text-red-600 font-black uppercase text-sm mb-4 tracking-widest">🚫 {t('error', 'PERMISSION_DENIED_ADMIN')}</p>
                <Link href="/" className="text-blue-600 font-bold underline text-xs uppercase tracking-wider">{t('ui', 'BACK_TO_HOME')}</Link>
            </main>
        );
    }

    // Risolviamo i parametri per la paginazione (Next.js 15)
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;

    // Calcolo range per la query
    const fromRange = (currentPage - 1) * PLAYERS_PER_PAGE;
    const toRange = fromRange + PLAYERS_PER_PAGE - 1;

    // Fetch mirato con conteggio esatto
    const { data: allPlayers, count: totalPlayersCount } = await supabase
        .from('players')
        .select('*', { count: 'exact' })
        .order('last_name', { ascending: true })
        .range(fromRange, toRange);

    const totalPages = totalPlayersCount ? Math.ceil(totalPlayersCount / PLAYERS_PER_PAGE) : 1;

    // --- WRAPPER PER LA PAGINAZIONE LATO SERVER ---
    const renderPagination = (total: number, current: number) => {
        if (total <= 1) return null;

        // Finestra di max 5 bottoni
        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const visiblePages = [];
        for (let i = start; i <= end; i++) {
            visiblePages.push(i);
        }

        const renderButton = (page: number, label: string | number, title: string, disabled: boolean, isActive: boolean = false) => {
            const buttonClass = `w-8 h-8 flex items-center justify-center border rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors ${
                isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer'
            }`;

            // Bottoni disabilitati o attuali
            if (disabled || isActive) {
                return (
                    <button key={`player-page-${label}`} type="button" disabled={true} title={title} className={buttonClass}>
                        {label}
                    </button>
                );
            }

            // Link attivi (preservano i path esistenti, alterando solo ?page=)
            return (
                <Link key={`player-page-${label}`} href={`?page=${page}`} scroll={false} title={title} className={buttonClass}>
                    {label}
                </Link>
            );
        };

        return (
            <div className="flex items-center justify-center gap-1 mt-8 mb-4">
                {renderButton(1, '«', t('ui', 'PAGINATION_FIRST'), current === 1)}
                {renderButton(Math.max(1, current - 1), '‹', t('ui', 'PAGINATION_PREV'), current === 1)}
                {visiblePages.map(p => renderButton(p, p, `${t('ui', 'PAGINATION_PAGE')} ${p}`, false, p === current))}
                {renderButton(Math.min(total, current + 1), '›', t('ui', 'PAGINATION_NEXT'), current === total)}
                {renderButton(total, '»', t('ui', 'PAGINATION_LAST'), current === total)}
            </div>
        );
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 pb-12">
            <div className="max-w-4xl w-full">
                <div className="mb-8 mt-2 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />
                    <h1 className="text-3xl font-black text-slate-900 mt-2 uppercase tracking-tighter">{t('admin', 'PAGE_TITLE_PLAYERS')}</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('nav', 'ADMIN_AREA')}</p>
                </div>

                <div className="space-y-3">
                    {allPlayers && allPlayers.length > 0 ? (
                        allPlayers.map((player) => (
                            <div key={player.id} className="bg-white p-4 border border-slate-200 shadow-sm rounded-sm">
                                <form action={updatePlayerByAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <input type="hidden" name="playerId" value={player.id} />

                                    {/* Dati Anagrafici */}
                                    <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_NOME')}</label>
                                            <input type="text" name="firstName" defaultValue={player.first_name} required className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_COGNOME')}</label>
                                            <input type="text" name="lastName" defaultValue={player.last_name} required className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm" />
                                        </div>
                                    </div>

                                    {/* Ranking */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_RANKING')}</label>
                                        <input type="number" name="ranking" step="0.05" min="1.00" max="7.00" defaultValue={player.ranking} required className="w-full p-2 border border-slate-300 bg-blue-50 text-sm font-black text-blue-700 rounded-sm" />
                                    </div>

                                    {/* Opzioni */}
                                    <div className="md:col-span-5 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_SIDE')}</label>
                                            <select name="preferredSide" defaultValue={player.preferred_side} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                                <option value="Left">{t('form', 'ADMIN_PLAYER_SIDE_SX')}</option>
                                                <option value="Right">{t('form', 'ADMIN_PLAYER_SIDE_DX')}</option>
                                                <option value="Both">{t('form', 'ADMIN_PLAYER_SIDE_MIX')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_HAND')}</label>
                                            <select name="dominantHand" defaultValue={player.dominant_hand || 'Destro'} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                                <option value="Destro">{t('form', 'ADMIN_PLAYER_HAND_DX')}</option>
                                                <option value="Mancino">{t('form', 'ADMIN_PLAYER_HAND_SX')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('form', 'LABEL_ROLE')}</label>
                                            <select name="role" defaultValue={player.role || 'user'} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                                <option value="user">{t('form', 'ADMIN_PLAYER_OPTION_USER')}</option>
                                                <option value="admin">{t('form', 'ADMIN_PLAYER_OPTION_ADMIN')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Azione */}
                                    <div className="md:col-span-1 flex flex-col sm:flex-row items-end justify-end gap-2">
                                        <SubmitButton />
                                        <DeletePlayerButton
                                            playerId={player.id}
                                            playerName={`${player.first_name} ${player.last_name}`}
                                        />
                                    </div>
                                </form>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 border border-slate-200 text-center rounded-sm">
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{t('ui', 'EMPTY_NO_PLAYERS_PAGE')}</p>
                        </div>
                    )}
                </div>

                {/* Componente Paginazione */}
                {renderPagination(totalPages, currentPage)}
            </div>
        </main>
    );
}
