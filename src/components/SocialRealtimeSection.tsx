import { useState, type FormEvent } from 'react';
import { ExternalLink, Heart, MessageSquare, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveAssetUrl } from '../shared/assetUrl';
import {
  getLikedPostIds,
  markPostLikedOnDevice,
  unmarkPostLikedOnDevice,
} from '../shared/deviceLikes';
import type {
  FanShoutout,
  SiteSection,
  SocialChannel,
  SocialPost,
} from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface SocialRealtimeSectionProps {
  channels: SocialChannel[];
  posts: SocialPost[];
  shoutouts: FanShoutout[];
  sectionMeta?: SiteSection;
  onLikePost: (postId: string, unlike?: boolean) => Promise<void>;
  onSendShoutout: (senderName: string, city: string, message: string) => Promise<void>;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatRelativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

export function SocialRealtimeSection({
  channels,
  posts,
  shoutouts,
  sectionMeta,
  onLikePost,
  onSendShoutout,
}: SocialRealtimeSectionProps) {
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => getLikedPostIds());

  async function handleDeviceLike(postId: string) {
    if (likedPostIds.has(postId)) {
      const next = unmarkPostLikedOnDevice(postId);
      setLikedPostIds(new Set(next));
      await onLikePost(postId, true);
      return;
    }
    const next = markPostLikedOnDevice(postId);
    setLikedPostIds(new Set(next));
    await onLikePost(postId, false);
  }

  async function handleSubmitShoutout(e: FormEvent) {
    e.preventDefault();
    if (!senderName.trim() || !message.trim() || sending) return;
    setSending(true);
    setFormFeedback(null);
    try {
      await onSendShoutout(senderName.trim(), '', message.trim());
      setMessage('');
      setFormFeedback('Pesan berhasil dikirim.');
    } catch (err) {
      setFormFeedback(err instanceof Error ? err.message : 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id={sectionMeta?.slug || 'sosial'}
      className="border-b border-[#2A2620] py-14 sm:py-16 lg:py-20 overflow-hidden"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10"
        >
          <div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Kanal Resmi & Siaran Langsung Komunitas'}
            </h2>
            {sectionMeta?.subtitle && (
              <p className="mt-2 text-sm text-[#A8A092] max-w-[54ch]">
                {sectionMeta.subtitle}
              </p>
            )}
          </div>
        </motion.div>

        {/* Connected Social Channels Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {channels
            .filter((c) => c.connected)
            .map((channel, idx) => (
              <motion.a
                key={channel.platform}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.07,
                  ease: EASE_OUT_EXPO,
                }}
                whileHover={{ y: -4, scale: 1.015 }}
                className="group rounded-xl border border-[#2A3024] dub-surface p-4 sm:p-5 flex items-start justify-between gap-3 hover:border-[#EAB308] transition-colors shadow-lg"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#EAB308]">{channel.platform}</p>
                  <p className="text-sm font-semibold text-[#F5F2EB] mt-1 truncate">
                    {channel.handle}
                  </p>
                  <p className="text-xs font-mono tabular-nums text-[#A8A092] mt-1">
                    {channel.followersLabel}
                  </p>
                </div>
                <ExternalLink
                  className="w-4 h-4 text-[#A8A092] group-hover:text-[#EAB308] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </motion.a>
            ))}
        </div>

        {/* Balanced Two-Column Desktop Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Official Social Feed Panel */}
          <motion.div
            initial={{ opacity: 0, x: -28, y: 16 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7 rounded-2xl border border-[#2A3024] dub-surface flex flex-col lg:h-[620px] overflow-hidden shadow-2xl relative"
          >
            <div className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0" aria-hidden="true" />
            <div className="px-5 py-4 border-b border-[#2A2620] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F5F2EB]">
                  Pembaruan Lintas Platform
                </h3>
                <p className="text-xs text-[#A8A092]">
                  Kabar panggung, rilis studio &amp; video terbaru
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums text-[#EAB308] shrink-0">
                {posts.length} kiriman
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#A8A092] flex-1 flex items-center justify-center">
                Belum ada kiriman media sosial.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {posts.map((post, idx) => {
                  const isVideo =
                    post.mediaType === 'video' ||
                    (post.mediaUrl ? /\.(mp4|webm|mov)(\?|$)/i.test(post.mediaUrl) : false);
                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{
                        duration: 0.45,
                        delay: Math.min(idx * 0.06, 0.3),
                        ease: EASE_OUT_EXPO,
                      }}
                      className="rounded-xl border border-[#2A3024] bg-[#0B0E0A]/90 p-4 sm:p-5 space-y-3 hover:border-[#2A3024]/90 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-[#EAB308] shrink-0">
                            {post.platform}
                          </span>
                          <span aria-hidden="true" className="text-[#575046]">
                            ·
                          </span>
                          <span className="text-[#F5F2EB] font-medium truncate">
                            {post.authorHandle}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-[#A8A092] shrink-0">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>

                      <div
                        className={
                          post.mediaUrl
                            ? 'flex flex-col sm:flex-row gap-4 items-start'
                            : 'space-y-3'
                        }
                      >
                        <div className="flex-1 min-w-0 space-y-3">
                          <p className="text-sm leading-relaxed text-[#D6CFC2]">
                            {post.content}
                          </p>
                        </div>

                        {post.mediaUrl && (
                          <div className="w-full sm:w-44 md:w-48 aspect-[16/10] sm:aspect-[4/3] shrink-0 overflow-hidden rounded-lg border border-[#2A2620] bg-black">
                            {isVideo ? (
                              <video
                                src={resolveAssetUrl(post.mediaUrl)}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageWithFallback
                                src={post.mediaUrl}
                                alt={`Lampiran ${post.platform} oleh ${post.authorHandle}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-[#2A2620]/80 flex flex-wrap items-center justify-between gap-3">
                        {(() => {
                          const hasLiked = likedPostIds.has(post.id);
                          return (
                            <motion.button
                              type="button"
                              aria-pressed={hasLiked}
                              title={
                                hasLiked
                                  ? 'Klik untuk batalkan suka'
                                  : 'Sukai kiriman ini'
                              }
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => void handleDeviceLike(post.id)}
                              className={`inline-flex items-center gap-2 min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                                hasLiked
                                  ? 'border-[#EAB308]/60 bg-[#EAB308]/14 text-[#EAB308] hover:border-[#F87171]/60 hover:bg-[#F87171]/10'
                                  : 'border-[#2A2620] bg-[#11150F] text-[#D6CFC2] hover:text-[#EAB308] hover:border-[#EAB308]/50'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 text-[#EAB308] transition-transform ${
                                  hasLiked ? 'fill-[#EAB308] scale-110' : ''
                                }`}
                                aria-hidden="true"
                              />
                              <span className="font-mono tabular-nums">
                                {post.likes.toLocaleString('id-ID')} Suka
                              </span>
                            </motion.button>
                          );
                        })()}

                        {post.externalUrl && (
                          <a
                            href={post.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#A8A092] hover:text-[#F5F2EB]"
                          >
                            Buka di {post.platform}
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Fan Shoutout Wall Panel */}
          <motion.div
            initial={{ opacity: 0, x: 28, y: 16 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5 rounded-2xl border border-[#2A3024] dub-surface flex flex-col lg:h-[620px] overflow-hidden shadow-2xl relative"
          >
            <div className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0" aria-hidden="true" />
            <div className="px-5 py-4 border-b border-[#2A2620] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F5F2EB]">
                  Dinding Sapaan Pendengar
                </h3>
                <p className="text-xs text-[#A8A092]">
                  {shoutouts.length} pesan komunitas tersimpan
                </p>
              </div>
              <MessageSquare className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
            </div>

            <form
              onSubmit={handleSubmitShoutout}
              className="p-4 sm:p-5 border-b border-[#2A2620] space-y-3 shrink-0 bg-[#0D100B]/60"
            >
              <input
                type="text"
                required
                maxLength={50}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nama Anda"
                aria-label="Nama pengirim"
                className="w-full min-h-[40px] px-3 py-2 text-sm bg-[#090B08] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
              />
              <textarea
                required
                rows={2}
                maxLength={240}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis sapaan atau request lagu..."
                aria-label="Pesan untuk band"
                className="w-full px-3 py-2 text-sm bg-[#090B08] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-semibold bg-[#EAB308] text-[#0C0B09] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  {sending ? 'Mengirim...' : 'Kirim Sapaan'}
                </motion.button>
                {formFeedback && (
                  <span className="text-xs text-[#4ADE80]">{formFeedback}</span>
                )}
              </div>
            </form>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[360px] lg:max-h-none">
              {shoutouts.length === 0 ? (
                <p className="text-xs text-[#A8A092] text-center py-6">
                  Belum ada sapaan. Jadilah yang pertama mengirim salam!
                </p>
              ) : (
                shoutouts.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(idx * 0.05, 0.25),
                      ease: EASE_OUT_EXPO,
                    }}
                    className="rounded-xl border border-[#2A3024]/70 bg-[#0B0E0A]/75 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#F5F2EB] truncate">
                        {item.senderName}
                      </span>
                      <span className="font-mono tabular-nums text-[#787166] shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[#D6CFC2] leading-relaxed">{item.message}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
