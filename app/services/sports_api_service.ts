import env from '#start/env'

export interface ApiAthlete {
  externalId: string
  name: string
  team: string | null
  sport: string | null
  photoUrl: string | null
}

/**
 * Busca atletas na TheSportsDB (https://www.thesportsdb.com/documentation).
 * A chave fica no .env (SPORTSDB_KEY); a chave gratuita de testes é "3".
 * A chamada acontece só no servidor, quando o admin pesquisa um atleta.
 */
export default class SportsApiService {
  async searchPlayers(name: string): Promise<ApiAthlete[]> {
    const key = env.get('SPORTSDB_KEY') || '3'
    const url = `https://www.thesportsdb.com/api/v1/json/${key}/searchplayers.php?p=${encodeURIComponent(name)}`

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`A API respondeu com status ${res.status}`)

    const data = (await res.json()) as { player: any[] | null }
    return (data.player ?? []).slice(0, 12).map((p) => ({
      externalId: String(p.idPlayer),
      name: p.strPlayer,
      team: p.strTeam ?? null,
      sport: p.strSport ?? null,
      photoUrl: p.strCutout || p.strThumb || null,
    }))
  }
}
