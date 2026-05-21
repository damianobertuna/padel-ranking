import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* Altre opzioni di configurazione che hai già... */

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
};

export default nextConfig;
