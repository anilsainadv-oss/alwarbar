'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Users, Plus, Phone, Mail, MapPin, Search, ShieldCheck } from 'lucide-react';
import type { Client } from '@/types/mycase';

export default function ClientsPage() {
  const { t, locale } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    fetch('/api/my-case/clients')
      .then(r => r.json())
      .then(data => {
        if (data.clients) setClients(data.clients);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/clients', {
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
      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Client</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client name, phone, address..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(cl => (
          <div key={cl.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">{cl.full_name}</h3>
                <span className="text-[10px] text-slate-400">Added: {new Date(cl.created_at).toLocaleDateString()}</span>
              </div>
              <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Privileged</span>
              </span>
            </div>

            <div className="space-y-1 text-slate-600">
              {cl.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cl.phone}</span>
                </div>
              )}
              {cl.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cl.email}</span>
                </div>
              )}
              {cl.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cl.address}</span>
                </div>
              )}
            </div>

            {cl.confidential_notes && (
              <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 italic">
                "{cl.confidential_notes}"
              </p>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Add Client Record</h3>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Client Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="94140XXXXX"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="client@mail.com"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Residential / Business Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Village / Ward / Tehsil, Alwar"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Confidential Consultation Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Record retention details, fee agreement terms, or factual history..."
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
