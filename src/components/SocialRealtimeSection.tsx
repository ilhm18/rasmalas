import { useState, type FormEvent } from 'react';
import { ExternalLink, Heart, MessageSquare, Send } from 'lucide-react';
import { resolveAssetUrl } from '../shared/assetUrl';
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
  onLikePost: (postId: string) => Promise<void>;
  onSendShoutout: (senderName: string, city: string, message: string) => Promise<void>;
}

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
      className="border-b border-[#2A2620] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
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
        </div>

        {/* Connected Social Channels Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {channels
            .filter((c) => c.connected)
            .map((channel) => (
              <a
                key={channel.platform}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-4 sm:p-5 flex items-start justify-between gap-3 hover:border-[#EAB308] transition-colors"
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
                  className="w-4 h-4 text-[#A8A092] group-hover:text-[#EAB308] shrink-0"
                  aria-hidden="true"
                />
              </a>
            ))}
        </div>

        {/* Balanced Two-Column Desktop Panels (Equal Height on Desktop, Natural Flow on Mobile/Tablet) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Official Social Feed Panel */}
          <div className="lg:col-span-7 rounded-2xl border border-[#2A3024] bg-[#11150F]/85 backdrop-blur-sm flex flex-col lg:h-[620px] overflow-hidden">
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
                {posts.map((post) => {
                  const isVideo =
                    post.mediaType === 'video' ||
                    (post.mediaUrl ? /\.(mp4|webm|mov)(\?|$)/i.test(post.mediaUrl) : false);
                  return (
                    <article
                      key={post.id}
                      className="rounded-xl border border-[#2A3024] bg-[#0B0E0A]/90 p-4 sm:p-5 space-y-3"
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
                        <button
                          type="button"
                          onClick={() => onLikePost(post.id)}
                          className="inline-flex items-center gap-2 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] rounded-lg border border-[#2A2620] bg-[#11150F] cursor-pointer transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                          <span className="font-mono tabular-nums">
                            {post.likes.toLocaleString('id-ID')} Suka
                          </span>
                        </button>

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
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fan Shoutout Wall Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-[#2A3024] bg-[#11150F]/85 backdrop-blur-sm flex flex-col lg:h-[620px] overflow-hidden">
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
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-semibold bg-[#EAB308] text-[#0C0B09] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  {sending ? 'Mengirim...' : 'Kirim Sapaan'}
                </button>
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
                shoutouts.map((item) => (
                  <div
                    key={item.id}
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
