'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  CreditCard, Plus, CheckCircle, Clock, AlertCircle, FileText, 
  Sparkles, Shield, Check, ArrowRight, Zap, RefreshCw, Building2, Download
} from 'lucide-react';
import type { 
  Invoice, Client, CaseRecord, SubscriptionPlan, AdvocateSubscription, 
  ChamberUsageMetrics, SubscriptionInvoice, SubscriptionPlanId, BillingCycle 
} from '@/types/mycase';

export default function BillingAndSubscriptionPage() {
  const { t, locale } = useLanguage();

  // Active view tab: 'subscriptions' | 'client_fees'
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'client_fees'>('subscriptions');

  // SaaS Subscription States
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<AdvocateSubscription | null>(null);
  const [usage, setUsage] = useState<ChamberUsageMetrics | null>(null);
  const [subInvoices, setSubInvoices] = useState<SubscriptionInvoice[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [subLoading, setSubLoading] = useState(true);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // Client Fee Ledger States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states for client fee note
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [invNumber, setInvNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [totalAmount, setTotalAmount] = useState(15000);
  const [paidAmount, setPaidAmount] = useState(10000);
  const [status, setStatus] = useState<'paid' | 'partially_paid' | 'unpaid'>('partially_paid');
  const [notes, setNotes] = useState('Drafting fee and appearance fee');

  const loadSubscriptionData = () => {
    setSubLoading(true);
    fetch('/api/my-case/subscriptions/plans')
      .then(r => r.json())
      .then(data => {
        if (data.plans) setPlans(data.plans);
        if (data.subscription) setSubscription(data.subscription);
        if (data.usage) setUsage(data.usage);
      })
      .catch(console.error)
      .finally(() => setSubLoading(false));

    fetch('/api/my-case/subscriptions/invoices')
      .then(r => r.json())
      .then(data => {
        if (data.invoices) setSubInvoices(data.invoices);
      })
      .catch(console.error);
  };

  const loadClientBillingData = () => {
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
    loadSubscriptionData();
    loadClientBillingData();
  }, []);

  // Initiate Razorpay checkout order
  const handleInitiateCheckout = async (plan: SubscriptionPlan) => {
    if (plan.id === 'starter' || plan.monthly_price_inr === 0) {
      alert('You are already eligible for the Starter Free Practice plan.');
      return;
    }

    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    try {
      const res = await fetch('/api/my-case/subscriptions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      setCheckoutData(data);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Error setting up payment');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Execute payment verification
  const handleConfirmPayment = async () => {
    if (!checkoutData || !selectedPlan) return;
    setPaymentVerifying(true);
    setCheckoutError('');

    try {
      // In simulator / test mode, use the test payment ID and server-generated HMAC signature
      const paymentId = checkoutData.simulatedPaymentId || `pay_sim_${Date.now()}`;
      const signature = checkoutData.simulatedSignature || 'test_signature';

      const verifyRes = await fetch('/api/my-case/subscriptions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: checkoutData.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle
        })
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      setCheckoutSuccess(data.message || `✓ Success! Your ${selectedPlan.name} plan is now active.`);
      loadSubscriptionData();
      setTimeout(() => {
        setCheckoutModalOpen(false);
        setCheckoutSuccess('');
      }, 2500);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setPaymentVerifying(false);
    }
  };

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
      loadClientBillingData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.total_amount), 0);
  const totalReceived = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const totalOutstanding = totalBilled - totalReceived;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <CreditCard className="w-4 h-4" />
            <span>Advocate Practice SaaS & Fee Management</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            {locale === 'hi' ? 'सदस्यता प्लान, बिलिंग एवं फीस लेजर' : 'Subscriptions, Practice Plans & Billing'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your practice SaaS subscription, review storage quotas, and maintain client professional fee ledgers.
          </p>
        </div>

        {activeTab === 'client_fees' && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Client Fee Note</span>
          </button>
        )}
      </div>

      {/* Top Tab Navigator */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-3 transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'subscriptions'
              ? 'border-blue-600 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>SaaS Plans & Subscription Quotas</span>
        </button>
        <button
          onClick={() => setActiveTab('client_fees')}
          className={`pb-3 px-3 transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'client_fees'
              ? 'border-emerald-600 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Client Fee Notes & Legal Ledger ({invoices.length})</span>
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        /* ==================================================== */
        /* TAB 1: SAAS PLANS & SUBSCRIPTIONS                     */
        /* ==================================================== */
        <div className="space-y-8">
          {/* Active Plan Banner & Usage Meters */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Active Subscription
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {subscription?.status || 'active'}
                  </span>
                </div>
                <h2 className="font-serif font-bold text-2xl text-white">
                  {usage?.plan_name || 'Starter Practice'}
                </h2>
                <p className="text-xs text-slate-300">
                  {subscription?.current_period_end 
                    ? `Current billing cycle active until ${new Date(subscription.current_period_end).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : 'Complimentary trial license active.'}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400">Subscription Fee</div>
                  <div className="text-xl font-bold text-amber-300">
                    ₹{subscription?.amount_inr ? subscription.amount_inr.toLocaleString('en-IN') : '0'}
                    <span className="text-xs text-slate-400 font-normal"> / {subscription?.billing_cycle || 'month'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Quota Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1.5">
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Active Cases:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {usage?.active_cases_count || 0} / {usage?.max_cases || 15}
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round(((usage?.active_cases_count || 0) / (usage?.max_cases || 15)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1.5">
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Document Vault:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {Math.round((usage?.storage_bytes_used || 0) / (1024 * 1024))} MB / {Math.round((usage?.max_storage_bytes || 262144000) / (1024 * 1024 * 1024))} GB
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round(((usage?.storage_bytes_used || 0) / (usage?.max_storage_bytes || 262144000)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1.5">
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Monthly AI Queries:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {usage?.ai_queries_used || 0} / {usage?.max_ai_queries || 25}
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-400 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round(((usage?.ai_queries_used || 0) / (usage?.max_ai_queries || 25)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1.5">
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Team Seats:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {usage?.team_members_count || 1} / {usage?.max_team_members || 1}
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-400 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round(((usage?.team_members_count || 1) / (usage?.max_team_members || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Choose Practice SaaS Plan
              </h3>
              <p className="text-xs text-slate-500">
                Transparent legal tech pricing designed specifically for District Court advocates and chambers.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                  billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                  2 Months Free
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const isCurrent = subscription?.plan_id === plan.id;
              const price = billingCycle === 'yearly' ? plan.yearly_price_inr : plan.monthly_price_inr;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    plan.highlight
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg relative'
                      : 'border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                      Most Popular for Advocates
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-slate-900">
                        {plan.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {plan.name_hi}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline space-x-1 font-serif">
                        <span className="text-3xl font-bold text-slate-900">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500">
                          / {billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {price > 0 ? '+ 18% GST (SAC 9982)' : '100% Free Forever'}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Up to <strong>{plan.limits.max_active_cases}</strong> Active Cases</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Up to <strong>{plan.limits.max_clients}</strong> Clients Directory</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>{Math.round(plan.limits.max_storage_bytes / (1024 * 1024 * (plan.limits.max_storage_bytes > 1024 * 1024 * 1024 ? 1024 : 1)))} {plan.limits.max_storage_bytes > 1024 * 1024 * 1024 ? 'GB' : 'MB'}</strong> Document Vault</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>{plan.limits.max_monthly_ai_queries}</strong> AI Legal Consultations/mo</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>{plan.limits.max_team_members}</strong> Chamber Team Seat{plan.limits.max_team_members > 1 ? 's' : ''}</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${plan.limits.has_docx_export ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        <Check className={`w-4 h-4 ${plan.limits.has_docx_export ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                        <span>Valid Word (.docx) Export</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${plan.limits.has_whatsapp_notifications ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        <Check className={`w-4 h-4 ${plan.limits.has_whatsapp_notifications ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                        <span>WhatsApp Hearing Reminders</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${plan.limits.has_priority_support ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        <Check className={`w-4 h-4 ${plan.limits.has_priority_support ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                        <span>Priority Chamber Support</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-xl font-semibold text-xs border cursor-default"
                      >
                        Current Active Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateCheckout(plan)}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 ${
                          plan.highlight
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-amber-300'
                        }`}
                      >
                        <span>Upgrade to {plan.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscription Invoices History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Subscription Tax Invoices & Payment Receipts</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  GST-compliant software tax invoices for chamber business expense deduction.
                </p>
              </div>
            </div>

            {subInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No subscription tax receipts generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Plan & Cycle</th>
                      <th className="p-3">Base Fee</th>
                      <th className="p-3">GST (18%)</th>
                      <th className="p-3">Total Paid</th>
                      <th className="p-3">Payment ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                    {subInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="p-3 font-sans font-medium text-slate-900">
                          {inv.plan_name} ({inv.billing_cycle})
                        </td>
                        <td className="p-3">₹{inv.amount_inr.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-500">₹{inv.tax_inr.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-emerald-800">₹{inv.total_amount_inr.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-400 truncate max-w-28">{inv.razorpay_payment_id || 'test_gateway'}</td>
                        <td className="p-3 text-slate-500">
                          {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                            Paid ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* TAB 2: CLIENT LEGAL FEES & INVOICE LEDGER            */
        /* ==================================================== */
        <div className="space-y-6">
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
                  <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
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
        </div>
      )}

      {/* Modal: Razorpay Checkout Order */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 font-serif flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Upgrade to {selectedPlan.name}</span>
              </h3>
              <button 
                onClick={() => setCheckoutModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {checkoutError}
              </div>
            )}

            {checkoutSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                {checkoutSuccess}
              </div>
            )}

            {checkoutLoading ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-600" />
                <p>Generating secure Razorpay payment order...</p>
              </div>
            ) : checkoutData ? (
              <div className="space-y-4">
                {checkoutData.isSimulated && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                    <div className="font-bold text-[11px] flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Razorpay Sandbox Test Mode</span>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      Live Razorpay keys are in test mode. No real money will be charged. Verification is cryptographically validated via server HMAC-SHA256 signature.
                    </p>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Base Subscription ({billingCycle}):</span>
                    <span>₹{checkoutData.baseAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  {checkoutData.discountApplied > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Annual Discount (2 Mo Free):</span>
                      <span>-₹{checkoutData.discountApplied?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-600">
                    <span>GST (18% SAC 9982):</span>
                    <span>₹{checkoutData.gstAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-bold text-sm text-slate-900">
                    <span>Total Amount Payable:</span>
                    <span className="text-blue-900">₹{checkoutData.amountINR?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>• Supported payment methods: UPI (Google Pay, PhonePe, Paytm), RuPay / Visa / MasterCard, and Netbanking.</p>
                  <p>• Tax invoice with GST breakdown generated immediately upon verification.</p>
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t">
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="px-3.5 py-2 border rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={paymentVerifying}
                    onClick={handleConfirmPayment}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    {paymentVerifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying HMAC Signature...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Activate Subscription</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal: Record Client Fee Note */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif">Record Fee Note / Client Invoice</h3>
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
