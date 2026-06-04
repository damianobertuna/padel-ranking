import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm'; // Importiamo il form che hai appena rinominato

export default async function LoginPage() {
    const supabase = await createClient();

    // 1. Il server controlla i cookie prima di fare qualsiasi cosa
    const { data: { user } } = await supabase.auth.getUser();

    // 2. LA PROTEZIONE: Se l'utente esiste già, lo spariamo subito alla Home!
    if (user) {
        redirect('/');
    }

    // 3. Se non è loggato, allora gli mostriamo il tuo Client Component con il form
    return <LoginForm />;
}
