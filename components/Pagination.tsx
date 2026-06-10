'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    // Se c'è solo una pagina o nessuna, non renderizziamo la paginazione
    if (totalPages <= 1) return null;

    // Algoritmo per calcolare la finestra delle pagine visibili (max 5 bottoni numerici)
    const getVisiblePages = () => {
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-center gap-1 mt-6 text-[10px] font-black uppercase tracking-wider">
            {/* 1. VAI ALL'INIZIO (Prima Pagina) */}
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-800 rounded-sm hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Prima Pagina"
            >
                «
            </button>

            {/* 2. PAGINA PRECEDENTE */}
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-800 rounded-sm hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors mr-1"
                title="Precedente"
            >
                ‹
            </button>

            {/* 3. PAGINE NUMERICHE CLICCABILI */}
            {visiblePages.map((page) => {
                const isActive = page === currentPage;
                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-colors ${
                            isActive
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {page}
                    </button>
                );
            })}

            {/* 4. PAGINA SUCCESSIVA */}
            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-800 rounded-sm hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors ml-1"
                title="Successiva"
            >
                ›
            </button>

            {/* 5. VAI ALLA FINE (Ultima Pagina) */}
            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-800 rounded-sm hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Ultima Pagina"
            >
                »
            </button>
        </div>
    );
}
