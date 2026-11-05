'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import type { Invoice, Client, CaseRecord } from '@/types/mycase';

export default function BillingPage() {
  const { t, locale } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [invNumber, setInvNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [totalAmount, setTotalAmount] = useState(15000);
  const [paidAmount, setPaidAmount] = useState(10000);
  const [status, setStatus] = useState<'paid' | 'partially_paid' | 'unpaid'>('partially_paid');
  const [notes, setNotes] = useState('Drafting fee and appearance fee');

  const loadData = () => {
    fetch('/api/my-case/billing')
      .then(r => r.json())
      .then(data => {
        if (data.invoices) setInvoices(data.invoices);
      })
      .catch(console.error);

    fetch('/api/my-case/clients')
      .then(r => r.json())
      .then(data => {
        if (data.clients) {
          setClients(data.clients);
          if (!clientId && data.clients.length > 0) setClientId(data.clients[0].id);
        }
      })
      .catch(() => {});

    fetch('/api/my-case/cases')
      .then(r => r.json())
      .then(data => {
        if (data.cases) setCases(data.cases);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/my-case/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          case_id: caseId || undefined,
          invoice_number: invNumber,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          status,
          notes
        })
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.total_amount), 0);
  const totalReceived = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const totalOutstanding = totalBilled - totalReceived;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <CreditCard className="w-4 h-4" />
            <span>Advocate Fee & Practice Ledger</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'फीस एवं लेखा बही (बिलिंग लेजर)' : 'Fee Notes, Invoices & Client Ledger'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record retention fees, court appearance notes, expense disbursements, and pending client dues.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Fee Note / Invoice</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs uppercase font-bold text-slate-400">Total Billed Fees</span>
          <div className="text-2xl font-bold font-serif text-slate-900">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">Agreed practice fees</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs uppercase font-bold text-emerald-700">Fees Received</span>
          <div className="text-2xl font-bold font-serif text-emerald-800">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600">Discharged receipts</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs uppercase font-bold text-amber-700">Outstanding Dues</span>
          <div className="text-2xl font-bold font-serif text-amber-800">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-amber-700">Balance due on next stage</span>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-slate-900">
            Fee Notes & Invoices Ledger
          </h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No fee records entered. Generate your first fee note above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 font-mono">{inv.invoice_number}</span>
                    <span className="text-slate-500 font-medium">{inv.client_name || 'Client'}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  {inv.case_title && (
                    <div className="text-slate-500 font-mono text-[11px]">Matter: {inv.case_title}</div>
                  )}
                  {inv.notes && (
                    <p className="text-slate-600">{inv.notes}</p>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-0.5 font-mono">
                  <div className="font-bold text-sm text-slate-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-emerald-700">Paid: ₹{Number(inv.paid_amount).toLocaleString('en-IN')}</div>
                  {Number(inv.total_amount) > Number(inv.paid_amount) && (
                    <div className="text-[11px] text-red-600 font-semibold">
                      Due: ₹{(Number(inv.total_amount) - Number(inv.paid_amount)).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Record Fee Note / Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Related Case (Optional)</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">-- General Legal Retainer --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Total Fee (₹)</label>
                  <input
                    required
                    type="number"
                    value={totalAmount}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Paid to Date (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Fee Description & Stage</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Interim injunction argument fee"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-amber-300 rounded font-semibold">
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
