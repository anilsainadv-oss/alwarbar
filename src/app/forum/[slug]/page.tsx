'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  ArrowLeft, ThumbsUp, MessageSquare, CheckCircle, ShieldAlert, 
  Send, AlertCircle, CheckCircle2, Flag 
} from 'lucide-react';
import type { ForumPost, ForumReply } from '@/types/forum';

export default function ForumDetailPage() {
  const params = useParams();
  const id = params?.slug as string;
  const { locale } = useLanguage();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate content');
  const [reportSuccess, setReportSuccess] = useState(false);

  const loadData = () => {
    if (!id) return;
    fetch(`/api/forum/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.post) setPost(data.post);
        if (data.replies) setReplies(data.replies);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/forum/posts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit reply');

      setReplyText('');
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    try {
      await fetch('/api/forum/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: id, reason: reportReason })
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModal(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading discussion...</div>;
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-900">Discussion Not Found</h2>
        <Link href="/forum" className="text-xs text-amber-700 hover:underline">
          ← Return to Advocates Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <Link
        href="/forum"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Discussions</span>
      </Link>

      {/* Main Post Card */}
      <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-legal-navy text-amber-400 font-bold flex items-center justify-center font-serif">
              {post.author_name[0]}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <span>{post.author_name}</span>
                {post.author_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {post.author_enrollment ? `Bar Enrollment: ${post.author_enrollment}` : 'Advocate Member'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setReportModal(true)}
            className="text-xs text-slate-400 hover:text-red-600 flex items-center space-x-1 transition"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>

        <h1 className="font-serif font-bold text-2xl text-slate-900 leading-snug">
          {post.title}
        </h1>

        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded font-medium">
            {post.category_name_en}
          </span>
          <span className="flex items-center space-x-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{post.upvotes} Colleagues found this helpful</span>
          </span>
        </div>
      </article>

      {/* Replies Section */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-amber-700" />
          <span>Responses & Senior Opinions ({replies.length})</span>
        </h3>

        {replies.map(reply => (
          <div
            key={reply.id}
            className={`bg-white rounded-xl shadow-sm border p-6 space-y-3 ${
              reply.is_accepted_answer ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">{reply.author_name}</span>
                {reply.author_enrollment && (
                  <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                    {reply.author_enrollment}
                  </span>
                )}
                {reply.is_accepted_answer && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Accepted Practice Opinion</span>
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[11px]">
                {new Date(reply.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {reply.content}
            </p>
          </div>
        ))}

        {/* Reply Form */}
        <form onSubmit={handleReplySubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Submit Your Legal Opinion or Procedural Input:
          </h4>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <textarea
            required
            rows={4}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="w-full p-3 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Cite relevant Rajasthan High Court or Supreme Court authority, or trial practice in Alwar Courts..."
          />

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-400">
              Only authenticated advocates can publish replies.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Reply'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-slate-900 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Report Forum Discussion</h3>
            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded">
                Report logged for moderator review.
              </div>
            ) : (
              <>
                <p className="text-slate-500">
                  Select the reason for reporting this post to the Bar Portal Moderator:
                </p>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option>Breach of Client Confidentiality / Case Details</option>
                  <option>Spam or Commercial Advertisement</option>
                  <option>Defamatory or Unprofessional Remarks</option>
                  <option>Factually Inaccurate Legal Misrepresentation</option>
                </select>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button onClick={() => setReportModal(false)} className="px-3 py-1.5 border rounded">
                    Cancel
                  </button>
                  <button onClick={handleReport} className="px-3 py-1.5 bg-red-600 text-white rounded font-medium">
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
