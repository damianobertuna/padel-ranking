import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPendingMatch, deletePendingMatch, updateMatchPlayers, joinMatchAction, leaveMatchAction } from './match-actions';
import { deletePlayerByAdmin, updateOwnProfile, updatePlayerAvatar } from './player-actions';
import { createClub, deleteClub } from './club-actions';
import { updateManagerProfile } from './manager-actions';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(), createAdminClient: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAction: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// ============================================================================
// Shared helper: creates a mock supabase client with eq-tracking per query chain.
// For club_managers, maybeSingle only returns data if the eq filter's club_id
// matches the managerRow's club_id (or if managedClubIds includes it).
// ============================================================================
function mkSupabase(overrides: {
    playerRow?: any;
    userRoleRow?: any;
    managerRow?: any;
    matchRow?: any;
    deleteReturns?: any;
    managedClubIds?: number[];
}) {
    const uid = 'auth-uuid';
    const pRow = overrides.playerRow ?? null;
    const urRow = overrides.userRoleRow ?? null;
    const mRow = overrides.managerRow ?? null;
    const mIds = overrides.managedClubIds ?? null;

    function fromHandler(table: string) {
        const eqFilter: Record<string, any> = {};

        const chain: any = {};
        chain.select = vi.fn(() => chain);
        chain.in = vi.fn(() => chain);
        chain.eq = vi.fn((key: string, val: any) => { eqFilter[key] = val; return chain; });

        // update — returns thenable with data
        chain.update = vi.fn(() => {
            const up: any = {};
            up.eq = vi.fn(() => up);
            up.select = vi.fn(() => up);
            up.in = vi.fn(() => up);
            up.then = (r: any) => r({ data: [{ id: 1 }], error: null });
            return up;
        });

        // insert
        chain.insert = vi.fn(() => {
            const ins: any = {};
            ins.select = vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null }))
            }));
            ins.eq = vi.fn(() => ins);
            ins.then = (r: any) => r({ data: { id: 'new-id' }, error: null });
            return ins;
        });

        // delete
        chain.delete = vi.fn(() => {
            const del: any = {};
            del.eq = vi.fn((k: string, v: any) => { eqFilter[k] = v; return del; });
            del.select = vi.fn(() => del);
            del.in = vi.fn(() => del);
            del.then = (r: any) => {
                const d = overrides.deleteReturns ?? [{ id: 'match-1' }];
                return r({ data: d, error: null });
            };
            return del;
        });

        // Default then (for operations that don't chain further)
        chain.then = (r: any) => r({ data: null, error: null });

        // maybeSingle
        chain.maybeSingle = vi.fn(() => {
            if (table === 'players') return Promise.resolve({ data: pRow, error: null });
            if (table === 'user_roles') return Promise.resolve({ data: urRow, error: null });
            if (table === 'club_managers') {
                if (mIds) {
                    const qClubId = eqFilter['club_id'];
                    const matches = qClubId !== undefined && mIds.includes(qClubId);
                    return Promise.resolve({ data: matches ? mRow : null, error: null });
                }
                return Promise.resolve({ data: mRow, error: null });
            }
            return Promise.resolve({ data: null, error: null });
        });

        // single
        chain.single = vi.fn(() => {
            if (table === 'matches') {
                return Promise.resolve({
                    data: overrides.matchRow ?? {
                        id: 'match-1', status: 'pending',
                        team_a_left_id: 1, team_a_right_id: 2,
                        team_b_left_id: 3, team_b_right_id: 4,
                        club_id: 10, organizer_id: 1,
                        is_friendly: false, match_type: 'male'
                    },
                    error: null
                });
            }
            if (table === 'players') return Promise.resolve({ data: pRow, error: null });
            return Promise.resolve({ data: null, error: null });
        });

        return chain;
    }

    return {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: uid } }, error: null }) },
        from: vi.fn(fromHandler),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(() => Promise.resolve({ error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } }))
            }))
        }
    };
}

const player = (id: number, role = 'user') => ({
    id, role, first_name: 'A', last_name: 'B',
    preferred_side: 'Both', ranking: 5.0,
    avatar_url: 'old.jpg', user_id: 'auth-uuid'
});
const admin = (id = 99) => player(id, 'admin');
const fullMatch = {
    id: 'match-1', status: 'pending',
    team_a_left_id: 1, team_a_right_id: 2,
    team_b_left_id: 3, team_b_right_id: 4,
    club_id: 10, organizer_id: 1,
    is_friendly: false, match_type: 'male'
};
const emptyMatch = {
    id: 'match-1', status: 'pending',
    team_a_left_id: null, team_a_right_id: null,
    team_b_left_id: null, team_b_right_id: null,
    club_id: 10, organizer_id: null,
    is_friendly: false, match_type: 'male'
};

// ============================================================================
// 2.1 createPendingMatch
// ============================================================================
describe('createPendingMatch', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    const p = {
        matchDate: null, matchType: 'male' as const,
        teamALeft: null, teamARight: null,
        teamBLeft: null, teamBRight: null, clubId: 10
    };

    it('approves club_manager for OWN club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 10, user_id: 'auth-uuid' },
            managedClubIds: [10]
        }));
        await expect(createPendingMatch(p)).resolves.not.toThrow();
    });

    it('blocks club_manager for OTHER club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 99, user_id: 'auth-uuid' },
            managedClubIds: [99]
        }));
        await expect(createPendingMatch(p)).rejects.toThrow('OPERAZIONE NEGATA');
    });

    it('approves admin without slot', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(99) }));
        await expect(createPendingMatch({
            ...p, teamALeft: 1, teamARight: 2,
            teamBLeft: 3, teamBRight: 4, clubId: null
        })).resolves.not.toThrow();
    });

    it('blocks user without slot', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(99) }));
        await expect(createPendingMatch(p)).rejects.toThrow('Devi occupare almeno uno slot');
    });

    it('blocks duplicate player (anti-cloning)', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(createPendingMatch({
            ...p, teamALeft: 1, teamARight: 1, teamBLeft: 3, teamBRight: 4
        })).rejects.toThrow('Non puoi inserire lo stesso giocatore');
    });
});

// ============================================================================
// 2.2 deletePendingMatch
// ============================================================================
describe('deletePendingMatch', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('approves admin', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(99) }));
        await expect(deletePendingMatch('match-1')).resolves.not.toThrow();
    });

    it('approves player in match', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(deletePendingMatch('match-1')).resolves.not.toThrow();
    });

    it('approves club_manager of the club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 10, user_id: 'auth-uuid' },
            managedClubIds: [10]
        }));
        await expect(deletePendingMatch('match-1')).resolves.not.toThrow();
    });

    it('blocks club_manager of OTHER club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 99, user_id: 'auth-uuid' },
            managedClubIds: [99]
        }));
        await expect(deletePendingMatch('match-1')).rejects.toThrow('ACCESSO NEGATO');
    });

    it('blocks outsider user', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(99) }));
        await expect(deletePendingMatch('match-1')).rejects.toThrow('ACCESSO NEGATO');
    });
});

// ============================================================================
// 2.3 updateMatchPlayers
// ============================================================================
describe('updateMatchPlayers', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('approves club_manager of the club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 10, user_id: 'auth-uuid' },
            managedClubIds: [10]
        }));
        await expect(updateMatchPlayers('match-1', { match_type: 'mixed' })).resolves.not.toThrow();
    });

    it('blocks club_manager of OTHER club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 99, user_id: 'auth-uuid' },
            managedClubIds: [99]
        }));
        await expect(updateMatchPlayers('match-1', { match_type: 'mixed' })).rejects.toThrow('ACCESSO NEGATO');
    });

    it('blocks club_manager moving match to unmanaged club', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', club_id: 10, user_id: 'auth-uuid' },
            managedClubIds: [10]
        }));
        await expect(updateMatchPlayers('match-1', { club_id: 999 })).rejects.toThrow('Non puoi spostare la partita');
    });

    it('blocks user not in match', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(99) }));
        await expect(updateMatchPlayers('match-1', { match_type: 'mixed' })).rejects.toThrow('ACCESSO NEGATO');
    });

    it('approves player in match (organizer)', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(updateMatchPlayers('match-1', { match_type: 'mixed' })).resolves.not.toThrow();
    });
});

// ============================================================================
// 2.5 createClub — admin only
// ============================================================================
describe('createClub', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    const formData = () => { const f = new FormData(); f.append('name', 'C'); return f; };

    it('blocks club_manager', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: null }));
        await expect(createClub(formData())).rejects.toThrow('Accesso negato');
    });

    it('blocks normal user', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(createClub(formData())).rejects.toThrow('Accesso negato');
    });

    it('approves admin', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(1) }));
        const result = await createClub(formData());
        expect(result).toEqual({ success: true });
    });
});

// ============================================================================
// 2.6 deleteClub
// ============================================================================
describe('deleteClub', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('blocks club_manager', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: null }));
        await expect(deleteClub(1)).rejects.toThrow('Accesso negato');
    });

    it('blocks normal user', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(deleteClub(1)).rejects.toThrow('Accesso negato');
    });

    it('approves admin', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(1) }));
        await expect(deleteClub(1)).resolves.not.toThrow();
    });
});

// ============================================================================
// 2.7 updateManagerProfile
// ============================================================================
describe('updateManagerProfile', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    const fd = () => {
        const f = new FormData();
        f.append('firstName', 'Mario'); f.append('lastName', 'Rossi');
        return f;
    };

    it('approves club_manager', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            managerRow: { id: 'cm', user_id: 'auth-uuid', club_id: 10 }
        }));
        await expect(updateManagerProfile(fd())).resolves.not.toThrow();
    });

    it('blocks normal user', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(updateManagerProfile(fd())).rejects.toThrow('Azione non autorizzata');
    });

    it('blocks admin (no club_manager role)', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(1) }));
        await expect(updateManagerProfile(fd())).rejects.toThrow('Azione non autorizzata');
    });
});

// ============================================================================
// 2.8 deletePlayerByAdmin
// ============================================================================
describe('deletePlayerByAdmin', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('blocks club_manager', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: null }));
        await expect(deletePlayerByAdmin(5)).rejects.toThrow('Serve il ruolo Admin');
    });

    it('blocks normal user', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: player(1) }));
        await expect(deletePlayerByAdmin(5)).rejects.toThrow('Serve il ruolo Admin');
    });

    it('approves admin', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({ playerRow: admin(1) }));
        await expect(deletePlayerByAdmin(5)).resolves.not.toThrow();
    });

    it('handles FK error 23503', async () => {
        const s = mkSupabase({ playerRow: admin(1) });
        s.from = vi.fn((table: string) => {
            const chain = mkSupabase({ playerRow: admin(1) }).from(table);
            if (table === 'players') {
                chain.delete = vi.fn(() => ({
                    eq: vi.fn().mockReturnThis(),
                    then: (r: any) => r({ data: null, error: { code: '23503', message: 'fk violation' } })
                }));
            }
            return chain;
        });
        (createClient as any).mockResolvedValue(s);
        await expect(deletePlayerByAdmin(5)).rejects.toThrow('ha già disputato delle partite');
    });
});

// ============================================================================
// 2.9 updateOwnProfile
// ============================================================================
describe('updateOwnProfile', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    const fd = () => {
        const f = new FormData();
        f.append('playerId', '1');
        f.append('firstName', 'T'); f.append('lastName', 'U');
        f.append('preferredSide', 'Right'); f.append('dominantHand', 'Right');
        return f;
    };

    it('blocks editing another player', async () => {
        const s = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-uuid' } }, error: null }) },
            from: vi.fn((table: string) => {
                const b: any = {}
                b.select = vi.fn(() => b);
                b.eq = vi.fn(() => b);
                b.in = vi.fn(() => b);
                b.single = vi.fn(() => Promise.resolve({ data: { user_id: 'other-uuid', avatar_url: 'old.jpg' }, error: null }));
                b.update = vi.fn(() => b);
                b.then = (r: any) => r({ data: null, error: null });
                return b;
            })
        };
        (createClient as any).mockResolvedValue(s);
        await expect(updateOwnProfile(fd())).rejects.toThrow('Non sei autorizzato a modificare il profilo di un altro giocatore');
    });
});

// ============================================================================
// 2.10 updatePlayerAvatar
// ============================================================================
describe('updatePlayerAvatar', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('blocks editing another player avatar', async () => {
        const s = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-uuid' } }, error: null }) },
            from: vi.fn((table: string) => {
                const b: any = {}
                b.select = vi.fn(() => b); b.eq = vi.fn(() => b);
                b.update = vi.fn(() => b);
                b.single = vi.fn(() => Promise.resolve({ data: { id: 1, user_id: 'auth-uuid' }, error: null }));
                b.then = (r: any) => r({ data: null, error: null });
                return b;
            })
        };
        (createClient as any).mockResolvedValue(s);
        await expect(updatePlayerAvatar(99, 'new-url')).rejects.toThrow('Non puoi modificare la foto profilo di un altro giocatore');
    });

    it('approves own avatar edit', async () => {
        const s = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-uuid' } }, error: null }) },
            from: vi.fn((table: string) => {
                const b: any = {}
                b.select = vi.fn(() => b); b.eq = vi.fn(() => b);
                b.update = vi.fn(() => b);
                b.single = vi.fn(() => Promise.resolve({ data: { id: 1, user_id: 'auth-uuid' }, error: null }));
                b.then = (r: any) => r({ data: null, error: null });
                return b;
            })
        };
        (createClient as any).mockResolvedValue(s);
        await expect(updatePlayerAvatar(1, 'new-url')).resolves.toEqual({ success: true });
    });
});

// ============================================================================
// 2.11 joinMatchAction
// ============================================================================
describe('joinMatchAction', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('blocks club_manager (no player profile)', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' },
            matchRow: emptyMatch
        }));
        await expect(joinMatchAction('match-1')).rejects.toThrow('I Club Manager non possono unirsi');
    });

    it('approves normal user with free slot', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: player(10), matchRow: emptyMatch
        }));
        await expect(joinMatchAction('match-1')).resolves.not.toThrow();
    });
});

// ============================================================================
// 2.12 leaveMatchAction
// ============================================================================
describe('leaveMatchAction', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('blocks club_manager from leaving', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: null, userRoleRow: { role: 'club_manager' }
        }));
        await expect(leaveMatchAction('match-1')).rejects.toThrow('I Club Manager non possono abbandonare');
    });

    it('approves player in match leaving', async () => {
        (createClient as any).mockResolvedValue(mkSupabase({
            playerRow: player(1), userRoleRow: null
        }));
        await expect(leaveMatchAction('match-1')).resolves.not.toThrow();
    });
});
