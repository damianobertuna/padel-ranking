'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Club {
    id: number;
    name: string;
}

interface ClubSelectFilterProps {
    clubs: Club[];
    currentClub: string;
}

export default function ClubSelectFilter({ clubs, currentClub }: ClubSelectFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (val === 'all') {
            params.set('completedClub', 'all');
        } else {
            params.set('completedClub', val);
        }

        // Quando cambi circolo, giustamente resettiamo la paginazione alla pagina 1
        params.set('page', '1');

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="relative w-full md:w-64 shrink-0">
            <select
                value={currentClub}
                onChange={handleChange}
                className="w-full bg-slate-100 border border-slate-300 rounded-sm py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer pr-10 shadow-sm"
            >
                <option value="all">📍 Tutti i Campi / Club</option>
                {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                        {club.name}
                    </option>
                ))}
            </select>
            {/* Freccetta custom del design sportivo */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[9px]">
                ▼
            </div>
        </div>
    );
}
