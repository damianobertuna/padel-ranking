import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NewClubForm from './NewClubForm';
import DeleteClubButton from './DeleteClubButton';
import { Club } from '@/types';
import BackToHomeButton from "@/components/BackToHomeButton";
import InviteManagerModal from "@/components/InviteManagerModal";

export const revalidate = 0;
const CLUBS_PER_PAGE = 10;

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function AdminClubsPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: player } = await supabase.from('players').select('role').eq('user_id', user.id).single();
    if (!player || player.role !== 'admin') redirect('/');

    // Risolviamo i parametri per la paginazione (Next.js 15)
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;

    // Calcolo range per la query paginata
    const fromRange = (currentPage - 1) * CLUBS_PER_PAGE;
    const toRange = fromRange + CLUBS_PER_PAGE - 1;

    // Fetch mirato con conteggio esatto per la tabella
    const { data: clubsData, count: totalClubsCount } = await supabase
        .from('clubs')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(fromRange, toRange);

    // Fetch ultraleggero di TUTTI i circoli per popolare la tendina della modale
    const { data: allClubsData } = await supabase
        .from('clubs')
        .select('id, name, city')
        .order('name');

    const clubs: Club[] = clubsData || [];
    const allClubs = allClubsData || [];
    const totalPages = totalClubsCount ? Math.ceil(totalClubsCount / CLUBS_PER_PAGE) : 1;

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
                    <button key={`club-page-${label}`} type="button" disabled={true} title={title} className={buttonClass}>
                        {label}
                    </button>
                );
            }

            // Link attivi (aggiornano l'URL senza far scrollare la pagina)
            return (
                <Link key={`club-page-${label}`} href={`?page=${page}`} scroll={false} title={title} className={buttonClass}>
                    {label}
                </Link>
            );
        };

        return (
            <div className="flex items-center justify-center gap-1 mt-8 mb-4">
                {renderButton(1, '«', 'Prima Pagina', current === 1)}
                {renderButton(Math.max(1, current - 1), '‹', 'Precedente', current === 1)}
                {visiblePages.map(p => renderButton(p, p, `Pagina ${p}`, false, p === current))}
                {renderButton(Math.min(total, current + 1), '›', 'Successiva', current === total)}
                {renderButton(total, '»', 'Ultima Pagina', current === total)}
            </div>
        );
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 pb-12">
            <div className="max-w-3xl w-full mx-auto">
                <div className="mb-8 mt-2 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />

                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gestione Circoli</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Area Amministrativa Federale</p>
                        </div>

                        {/* Il nuovo bottone per invitare i gestori */}
                        <InviteManagerModal clubs={allClubs} />
                    </div>
                </div>

                <div className="mb-8">
                    <NewClubForm />
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
                    {clubs.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {clubs.map((club) => (
                                <li key={club.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 uppercase text-sm">{club.name}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{club.address} - {club.city}</span>
                                    </div>
                                    <DeleteClubButton clubId={club.id} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessun circolo registrato</div>
                    )}
                </div>

                {/* Componente Paginazione */}
                {renderPagination(totalPages, currentPage)}
            </div>
        </main>
    );
}
