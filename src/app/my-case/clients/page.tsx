'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Users, Plus, Phone, Mail, MapPin, Search, ShieldCheck, 
  Edit2, Trash2, Folder, ExternalLink, AlertCircle 
} from 'lucide-react';
import type { Client, CaseRecord } from '@/types/mycase';

export default function ClientsPage() {
  const { t, locale } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState('');

  // Add Client Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Client Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // View Client Details Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientCases, setClientCases] = useState<CaseRecord[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Client Communication History State (P4)
  const [clientCommunications, setClientCommunications] = useState<any[]>([]);
  const [commMsg, setCommMsg] = useState('');
  const [commChannel, setCommChannel] = useState<'email' | 'whatsapp' | 'in_app'>('email');
  const [commType, setCommType] = useState<'hearing_reminder' | 'case_status_update' | 'custom_message'>('hearing_reminder');
  const [commSending, setCommSending] = useState(false);
  const [commSuccess, setCommSuccess] = useState('');
  const [commError, setCommError] = useState('');

  // Delete Client state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    fetch('/api/my-case/clients')
      .then(r => r.json())
      .then(data => {
        if (data.clients) setClients(data.clients);
      })
      .catch(console.error);

    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) setCases(data.cases);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/my-case/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          address,
          confidential_notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setAddModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating client');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (cl: Client) => {
    setEditingClient(cl);
    setFullName(cl.full_name);
    setPhone(cl.phone || '');
    setEmail(cl.email || '');
    setAddress(cl.address || '');
    setNotes(cl.confidential_notes || '');
    setEditModalOpen(true);
    setError('');
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/my-case/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          address,
          confidential_notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client');

      setEditModalOpen(false);
      setEditingClient(null);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating client');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = async (cl: Client) => {
    setViewingClient(cl);
    setViewModalOpen(true);
    setLoadingCases(true);
    setCommSuccess('');
    setCommError('');
    setCommMsg('');
    try {
      const res = await fetch(`/api/my-case/clients/${cl.id}`);
      const data = await res.json();
      if (data.cases) {
        setClientCases(data.cases);
      } else {
        setClientCases(cases.filter(c => c.client_id === cl.id));
      }
    } catch {
      setClientCases(cases.filter(c => c.client_id === cl.id));
    } finally {
      setLoadingCases(false);
    }

    // Load Client Communications History (P4)
    fetch(`/api/my-case/communications?clientId=${cl.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.communications) setClientCommunications(data.communications);
      })
      .catch(() => {});
  };

  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingClient || !commMsg.trim()) return;
    setCommSending(true);
    setCommError('');
    setCommSuccess('');

    try {
      const res = await fetch('/api/my-case/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: viewingClient.id,
          channel: commChannel,
          message_type: commType,
          subject: commType === 'hearing_reminder' ? 'Upcoming Hearing Reminder' : 'Client Legal Notice',
          content: commMsg
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setCommSuccess('Notice dispatched successfully!');
      setCommMsg('');
      const refreshRes = await fetch(`/api/my-case/communications?clientId=${viewingClient.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.communications) setClientCommunications(refreshData.communications);
      setTimeout(() => setCommSuccess(''), 3000);
    } catch (err: unknown) {
      setCommError(err instanceof Error ? err.message : 'Error sending notice');
    } finally {
      setCommSending(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/my-case/clients/${deletingClient.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete client');
      }

      setDeleteModalOpen(false);
      setDeletingClient(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting client');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
            <Users className="w-4 h-4" />
            <span>Confidential Client Directory</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'मुवक्किल पंजिका (क्लाइंट डायरेक्टरी)' : 'Client Directory & Consultation Notes'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict attorney-client privileged directory. Only visible to you.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setPhone('');
            setEmail('');
            setAddress('');
            setNotes('');
            setAddModalOpen(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client name, phone, email, address..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Total: <strong>{clients.length}</strong> clients
        </span>
      </div>

      {/* Clients Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 text-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No clients found</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            No client records matching your search. Add clients to link their consultation notes with active court cases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(cl => {
            const associatedCases = cases.filter(c => c.client_id === cl.id);
            return (
              <div key={cl.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs hover:border-purple-300 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">{cl.full_name}</h3>
                      <span className="text-[10px] text-slate-400">Added: {new Date(cl.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-medium flex items-center space-x-1 border border-purple-200">
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                        <span>Privileged</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    {cl.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{cl.phone}</span>
                      </div>
                    )}
                    {cl.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cl.email}</span>
                      </div>
                    )}
                    {cl.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cl.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Associated Cases count badge */}
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center space-x-1">
                      <Folder className="w-3 h-3" />
                      <span>{associatedCases.length} Associated Case{associatedCases.length === 1 ? '' : 's'}</span>
                    </span>
                  </div>

                  {cl.confidential_notes && (
                    <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 italic line-clamp-2">
                      "{cl.confidential_notes}"
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between border-t pt-3 mt-2 border-slate-100">
                  <button
                    onClick={() => openViewModal(cl)}
                    className="text-purple-800 hover:text-purple-900 font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <span>View Dossier & Cases →</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(cl)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] flex items-center space-x-1"
                      title="Edit Client"
                    >
                      <Edit2 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingClient(cl);
                        setDeleteModalOpen(true);
                      }}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] flex items-center space-x-1"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif border-b pb-2">
              Add New Client Record
            </h3>
            {error && <p className="text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Mukesh Kumar Saini"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="94140XXXXX"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="client@mail.com"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Village / Ward / Tehsil, Alwar"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Confidential Consultation Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Record retention details, fee agreement terms, or factual history..."
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded-lg font-semibold"
                >
                  {submitting ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif border-b pb-2">
              Edit Client Record: {editingClient.full_name}
            </h3>
            {error && <p className="text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <form onSubmit={handleUpdateClient} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Confidential Consultation Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details & Associated Cases Modal */}
      {viewModalOpen && viewingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">{viewingClient.full_name}</h3>
                <span className="text-[11px] text-slate-400">Client ID: {viewingClient.id}</span>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800">{viewingClient.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                <span className="font-medium text-slate-800">{viewingClient.email || 'Not provided'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Address</span>
                <span className="font-medium text-slate-800">{viewingClient.address || 'Not provided'}</span>
              </div>
            </div>

            {/* Privileged Notes */}
            {viewingClient.confidential_notes && (
              <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-800 block">
                  Attorney-Client Privileged Notes:
                </span>
                <p className="text-purple-950 leading-relaxed italic">{viewingClient.confidential_notes}</p>
              </div>
            )}

            {/* Associated Cases */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Associated Court Cases ({clientCases.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">Active Dossiers</span>
              </h4>

              {loadingCases ? (
                <div className="p-4 text-center text-slate-400">Loading cases...</div>
              ) : clientCases.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-400 text-center">
                  No cases currently linked to this client. You can link cases when creating or editing a case in the Case Docket.
                </div>
              ) : (
                <div className="space-y-2">
                  {clientCases.map(c => (
                    <div
                      key={c.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 transition"
                    >
                      <div>
                        <Link
                          href={`/my-case/cases/${c.id}`}
                          className="font-bold text-slate-900 hover:text-amber-800 hover:underline"
                        >
                          {c.case_title}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono flex gap-x-2">
                          <span>No: {c.case_number || 'Unnumbered'}</span>
                          <span>Court: {c.court_name}</span>
                        </div>
                      </div>
                      <Link
                        href={`/my-case/cases/${c.id}`}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold shrink-0"
                      >
                        Open Dossier →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communication History & Send Notice Section (P4) */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Client Communication History & Notices</span>
                <span className="text-[10px] text-slate-400 font-mono">{clientCommunications.length} sent</span>
              </h4>

              {/* Send Quick Notice Box */}
              <form onSubmit={handleSendCommunication} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-700 block text-[11px]">Dispatch Quick Legal Notice / Hearing Reminder</span>
                
                {commSuccess && <div className="text-[11px] text-emerald-700 font-medium">{commSuccess}</div>}
                {commError && <div className="text-[11px] text-red-600 font-medium">{commError}</div>}

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={commChannel}
                    onChange={e => setCommChannel(e.target.value as any)}
                    className="p-1.5 border rounded-lg bg-white text-[11px]"
                  >
                    <option value="email">Email Notice ({viewingClient.email || 'No email'})</option>
                    <option value="whatsapp">WhatsApp API ({viewingClient.phone || 'No phone'})</option>
                    <option value="in_app">In-App Secure Portal</option>
                  </select>

                  <select
                    value={commType}
                    onChange={e => setCommType(e.target.value as any)}
                    className="p-1.5 border rounded-lg bg-white text-[11px]"
                  >
                    <option value="hearing_reminder">Upcoming Hearing Reminder</option>
                    <option value="case_status_update">Case Status Update</option>
                    <option value="custom_message">General Practice Notice</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={commMsg}
                    onChange={e => setCommMsg(e.target.value)}
                    placeholder="Enter message content for client..."
                    className="flex-1 p-2 border rounded-lg bg-white text-xs"
                  />
                  <button
                    type="submit"
                    disabled={commSending || !commMsg.trim()}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition disabled:opacity-50 shrink-0"
                  >
                    {commSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>

              {/* History List */}
              <div className="max-h-36 overflow-y-auto space-y-2">
                {clientCommunications.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center text-[11px]">
                    No past communications recorded for this client.
                  </div>
                ) : (
                  clientCommunications.map((cm: any) => (
                    <div key={cm.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 uppercase text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {cm.channel} • {cm.message_type?.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {new Date(cm.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600">{cm.content}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Status: <span className="text-emerald-700 font-semibold">{cm.status}</span> ({cm.provider})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteModalOpen && deletingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Client Record?</h3>
              <p className="text-slate-500">
                Are you sure you want to permanently delete <strong>"{deletingClient.full_name}"</strong> from your directory? Any cases previously linked to this client will remain in your docket.
              </p>
            </div>
            <div className="pt-3 flex justify-end space-x-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={submitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
