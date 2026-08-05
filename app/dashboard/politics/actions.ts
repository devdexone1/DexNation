'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const POLITICS_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_politics`

async function runPoliticsAction(
  nationId: string,
  actionName: string,
  rpcName: string,
  rpcParams: Record<string, unknown>
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(POLITICS_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: actionName })
    return { error: 'Too many political actions — please slow down.' }
  }

  const { error } = await supabase.rpc(rpcName, rpcParams)
  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: actionName, error: error.message })
    return { error: error.message }
  }
  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: actionName, ...rpcParams })
  return { success: true }
}

export async function reformIdeologyAction(nationId: string, newIdeology: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'reform_ideology', 'reform_ideology', {
    p_nation_id: nationId,
    p_new_ideology: newIdeology,
  })
}

export async function createAllianceAction(nationId: string, name: string, tag: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'create_alliance', 'create_alliance', {
    p_nation_id: nationId,
    p_name: name,
    p_tag: tag,
  })
}

export async function joinAllianceAction(nationId: string, allianceId: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'join_alliance', 'join_alliance', {
    p_nation_id: nationId,
    p_alliance_id: allianceId,
  })
}

export async function leaveAllianceAction(nationId: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'leave_alliance', 'leave_alliance', {
    p_nation_id: nationId,
  })
}

export async function proposeAllianceTreatyAction(nationId: string, targetAllianceId: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'propose_alliance_treaty', 'propose_alliance_treaty', {
    p_nation_id: nationId,
    p_target_alliance_id: targetAllianceId,
  })
}

export async function respondAllianceTreatyAction(
  nationId: string,
  treatyId: string,
  accept: boolean
): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'respond_alliance_treaty', 'respond_alliance_treaty', {
    p_nation_id: nationId,
    p_treaty_id: treatyId,
    p_accept: accept,
  })
}

export async function cancelAllianceTreatyAction(nationId: string, treatyId: string): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'cancel_alliance_treaty', 'cancel_alliance_treaty', {
    p_nation_id: nationId,
    p_treaty_id: treatyId,
  })
}

export async function allianceBailoutAction(leaderNationId: string, targetNationId: string): Promise<ActionResult> {
  return runPoliticsAction(leaderNationId, 'alliance_bailout', 'alliance_bailout', {
    p_leader_nation_id: leaderNationId,
    p_target_nation_id: targetNationId,
  })
}

export async function proposeResolutionAction(
  nationId: string,
  resolutionType: string,
  targetNationId: string | null
): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'propose_resolution', 'propose_resolution', {
    p_nation_id: nationId,
    p_resolution_type: resolutionType,
    p_target_nation_id: targetNationId,
  })
}

export async function castResolutionVoteAction(
  nationId: string,
  resolutionId: string,
  voteChoice: string
): Promise<ActionResult> {
  return runPoliticsAction(nationId, 'cast_resolution_vote', 'cast_resolution_vote', {
    p_nation_id: nationId,
    p_resolution_id: resolutionId,
    p_vote_choice: voteChoice,
  })
}