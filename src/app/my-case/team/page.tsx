'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Building2, Users, UserPlus, Shield, CheckCircle, Clock, 
  Trash2, Edit2, AlertCircle, Copy, Check, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import type { Chamber, ChamberMember, ChamberInvitation, ChamberUsageMetrics, ChamberMemberRole } from '@/types/mycase';

export default function ChamberTeamPage() {
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [hasChamber, setHasChamber] = useState(false);
  const [chamber, setChamber] = useState<Chamber | null>(null);
  const [members, setMembers] = useState<ChamberMember[]>([]);
  const [invitations, setInvitations] = useState<ChamberInvitation[]>([]);
  const [usage, setUsage] = useState<ChamberUsageMetrics | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Modals state
  const [chamberModalOpen, setChamberModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChamberMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<ChamberMemberRole>('associate_advocate');

  // Form states
  const [chamberName, setChamberName] = useState('');
  const [courtComplex, setCourtComplex] = useState('District & Sessions Court, Alwar');
  const [chamberNumber, setChamberNumber] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ChamberMemberRole>('associate_advocate');
  const [inviteFullName, setInviteFullName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadTeamData = () => {
    setLoading(true);
    fetch('/api/my-case/team')
      .then(r => r.json())
      .then(data => {
        setHasChamber(data.hasChamber);
        if (data.chamber) {
          setChamber(data.chamber);
          setChamberName(data.chamber.name);
          setCourtComplex(data.chamber.court_complex);
          setChamberNumber(data.chamber.chamber_number || '');
        }
        if (data.members) setMembers(data.members);
        if (data.invitations) setInvitations(data.invitations);
        if (data.usage) setUsage(data.usage);
        setIsOwner(data.isOwner || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const handleSaveChamber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chamberName,
          court_complex: courtComplex,
          chamber_number: chamberNumber || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save chamber');

      setSuccess('Chamber profile updated successfully.');
      setChamberModalOpen(false);
      loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving chamber');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/my-case/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          full_name: inviteFullName || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation');

      setSuccess(`Invitation generated for ${inviteEmail}!`);
      setInviteEmail('');
      setInviteFullName('');
      setInviteModalOpen(false);
      loadTeamData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/my-case/team/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');

      setRoleModalOpen(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this chamber?`)) return;
    try {
      const res = await fetch(`/api/my-case/team/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      loadTeamData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Revoke this pending invitation?')) return;
    try {
      const res = await fetch(`/api/my-case/team/invitations?id=${invitationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke invitation');
      loadTeamData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error revoking invitation');
    }
  };

  const copyInviteToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const getRoleBadge = (role: ChamberMemberRole) => {
    switch (role) {
      case 'senior_advocate':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Senior Advocate (Head)</span>;
      case 'associate_advocate':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">Associate Advocate</span>;
      case 'chamber_clerk':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold">Chamber Clerk</span>;
      case 'intern':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-semibold">Legal Intern</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">{role}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Building2 className="w-4 h-4" />
            <span>Advocate Chamber & Team Management</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'चेम्बर सहयोग एवं टीम प्रबंधन' : 'Chamber Colleague & Team Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize chamber partners, assign juniors and clerks, manage invitations, and control role-based case access.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {hasChamber && (
            <button
              onClick={() => {
                setError('');
                setInviteModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Team Member</span>
            </button>
          )}
          <button
            onClick={() => {
              setError('');
              setChamberModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{hasChamber ? 'Edit Chamber Profile' : 'Set Up Chamber'}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Chamber Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {usage?.plan_name || 'Practice Plan'}
              </span>
              {isOwner && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  Chamber Head (Owner)
                </span>
              )}
            </div>
            <h2 className="font-serif font-bold text-2xl text-white">
              {chamber ? chamber.name : 'Chamber Profile Pending Set Up'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              {chamber
                ? `${chamber.court_complex}${chamber.chamber_number ? ` • Chamber No. ${chamber.chamber_number}` : ''}`
                : 'Create your chamber profile to invite associates, chamber clerks, and legal interns under your practice license.'}
            </p>
          </div>

          {/* Seat Meter */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-64 space-y-2 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-200">Team Seats Utilized:</span>
              <span className="font-bold text-amber-300 font-mono">
                {usage?.team_members_count || 1} / {usage?.max_team_members || 1}
              </span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((usage?.team_members_count || 1) / (usage?.max_team_members || 1)) * 100))}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>{Math.max(0, (usage?.max_team_members || 1) - (usage?.team_members_count || 1))} seats available</span>
              <Link 
                href="/my-case/billing" 
                className="text-amber-300 hover:text-amber-200 font-semibold underline flex items-center space-x-0.5"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Chamber Colleagues & Roster ({members.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Active associates, legal clerks, and interns authorized to access case proceedings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p>No colleagues registered in this chamber yet.</p>
            {hasChamber && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Invite Your First Associate
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Colleague / Advocate</th>
                  <th className="p-3.5">Chamber Role & Permissions</th>
                  <th className="p-3.5">Bar Enrollment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined Date</th>
                  {isOwner && <th className="p-3.5 text-right">Access Control</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{m.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{m.email}</div>
                    </td>
                    <td className="p-3.5">
                      {getRoleBadge(m.role)}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      {m.bar_enrollment_no || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px] font-mono">
                      {new Date(m.joined_at).toLocaleDateString('en-IN')}
                    </td>
                    {isOwner && (
                      <td className="p-3.5 text-right space-x-2">
                        {m.role !== 'senior_advocate' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setSelectedRole(m.role);
                                setRoleModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => handleRemoveMember(m.id, m.full_name)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {isOwner && invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Invitations ({invitations.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Invitations are valid for 7 days.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Invitee Email</th>
                  <th className="p-3">Designated Role</th>
                  <th className="p-3">Token Code</th>
                  <th className="p-3">Expires On</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{inv.invitee_email}</td>
                    <td className="p-3">{getRoleBadge(inv.role)}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <span className="truncate max-w-32">{inv.token}</span>
                        <button
                          onClick={() => copyInviteToken(inv.token)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600"
                          title="Copy Invitation Token"
                        >
                          {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(inv.expires_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role-Based Access Control (RBAC) Reference Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
        <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2 border-b pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Chamber Role-Based Access Control (RBAC) Permissions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="font-bold text-slate-900">Senior Advocate (Head)</div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>Full practice administration</li>
              <li>Chamber subscription & billing</li>
              <li>Invite & remove colleagues</li>
              <li>Access all cases & client ledgers</li>
              <li>Authorize legal document exports</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="font-bold text-slate-900">Associate Advocate</div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>View & edit assigned cases</li>
              <li>Draft pleadings with Legal AI</li>
              <li>Record court hearing outcomes</li>
              <li>Upload evidence & pleadings</li>
              <li>Dispatch client notifications</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="font-bold text-slate-900">Chamber Clerk (Munshi)</div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>Track daily cause list matching</li>
              <li>Update next court dates</li>
              <li>View client contact phone numbers</li>
              <li>No access to confidential AI notes</li>
              <li>No access to bank/billing settings</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
            <div className="font-bold text-slate-900">Legal Intern</div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>Read-only access to assigned files</li>
              <li>Search statutory precedents</li>
              <li>Draft research memorandums</li>
              <li>No client billing access</li>
              <li>Cannot delete or export filings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Set Up / Edit Chamber */}
      {chamberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 font-serif flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{hasChamber ? 'Edit Chamber Profile' : 'Register Practice Chamber'}</span>
              </h3>
              <button onClick={() => setChamberModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            {error && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

            <form onSubmit={handleSaveChamber} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Chamber / Firm Name</label>
                <input
                  type="text"
                  required
                  value={chamberName}
                  onChange={e => setChamberName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                  placeholder="e.g. Sain & Associates Legal Chambers"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Court Complex</label>
                <input
                  type="text"
                  required
                  value={courtComplex}
                  onChange={e => setCourtComplex(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                  placeholder="District & Sessions Court, Alwar"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Chamber Room / Office Number</label>
                <input
                  type="text"
                  value={chamberNumber}
                  onChange={e => setChamberNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                  placeholder="e.g. Chamber No. 42, Civil Bar Wing"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setChamberModalOpen(false)}
                  className="px-3.5 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !chamberName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Chamber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Team Member */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 font-serif flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Invite Chamber Colleague</span>
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            {error && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Colleague Full Name (Optional)</label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={e => setInviteFullName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                  placeholder="e.g. Advocate Vikas Sharma"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Chamber Role & Access Level</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as ChamberMemberRole)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="associate_advocate">Associate Advocate (Full Case & Drafting Access)</option>
                  <option value="chamber_clerk">Chamber Clerk (Cause List & Diary Date Tracker)</option>
                  <option value="intern">Legal Intern (Read-Only & Research Memorandums)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Generating Invite...' : 'Generate & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 font-serif border-b pb-2">
              Modify Role: {selectedMember.full_name}
            </h3>

            <form onSubmit={handleUpdateRole} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select New Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as ChamberMemberRole)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="associate_advocate">Associate Advocate</option>
                  <option value="chamber_clerk">Chamber Clerk</option>
                  <option value="intern">Legal Intern</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  {submitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
