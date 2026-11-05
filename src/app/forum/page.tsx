'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  MessageSquare, Plus, Search, ThumbsUp, MessageCircle, ShieldAlert, 
  CheckCircle, Tag, Filter, UserCheck, AlertTriangle 
} from 'lucide-react';
import type { ForumPost, ForumCategory } from '@/types/forum';

export default function ForumPage() {
  const { t, locale } = useLanguage();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [newPostModal, setNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchPosts = () => {
    fetch(`/api/forum/posts?category=${selectedCategory}&q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        if (data.posts) setPosts(data.posts);
        if (data.categories) {
          setCategories(data.categories);
          if (!newCatId && data.categories.length > 0) {
            setNewCatId(data.categories[0].id);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, search]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setPostError('');

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: newCatId,
          title: newTitle,
          content: newContent,
          language: locale
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit discussion');
      }

      setNewTitle('');
      setNewContent('');
      setNewPostModal(false);
      fetchPosts();
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : 'Error creating post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      {/* Forum Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-6 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Advocates Community Forum</span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
            {locale === 'hi' ? 'अधिवक्ता विचार मंच' : 'Advocates Legal Practice Forum'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Professional exchange on trial tactics, BNSS bail jurisprudence, revenue partition disputes, and mentor guidance for advocates in Alwar.
          </p>
        </div>

        <button
          onClick={() => setNewPostModal(true)}
          className="mt-4 md:mt-0 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold rounded-lg shadow transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Start New Discussion</span>
        </button>
      </div>

      {/* Confidentiality Reminder Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Advocate Privilege Reminder:</strong> This is an open professional discussion forum. Never disclose client identities, confidential litigation facts, FIR records of victims, or privileged attorney-client correspondence.
        </p>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Topics
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.slug
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {locale === 'hi' ? cat.name_hi : cat.name_en}
          </button>
        ))}
      </div>

      {/* Discussion Posts List */}
      <div className="space-y-4">
        {posts.map(post => (
          <article
            key={post.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3 hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{post.author_name}</span>
                {post.author_enrollment && (
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {post.author_enrollment}
                  </span>
                )}
                {post.author_verified && (
                  <span className="text-emerald-600 text-[10px] flex items-center space-x-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            <Link href={`/forum/${post.id}`} className="block group">
              <h2 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-800 transition">
                {post.title}
              </h2>
            </Link>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {post.content}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {locale === 'hi' ? post.category_name_hi : post.category_name_en}
              </span>

              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>{post.upvotes} helpful</span>
                </span>
                <Link
                  href={`/forum/${post.id}`}
                  className="flex items-center space-x-1 font-medium text-amber-800 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{post.replies_count} Replies</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* New Discussion Modal */}
      {newPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200 space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Start Professional Legal Discussion
            </h3>

            {postError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {postError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Legal Practice Area</label>
                <select
                  value={newCatId}
                  onChange={e => setNewCatId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} / {c.name_hi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic Title (Question or Precedent)</label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Practical questions on Section 480 BNSS bail in Alwar Courts..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Discussion Points</label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Describe procedural challenge, citation, or judicial approach..."
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                Notice: You must be signed in as an advocate or member to post. Your enrollment will be displayed alongside your name.
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setNewPostModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {posting ? 'Submitting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
