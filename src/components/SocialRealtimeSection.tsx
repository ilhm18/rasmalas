import { useState, type FormEvent } from 'react';
import { ExternalLink, Heart, MessageSquare, Radio, Send } from 'lucide-react';
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
  wsConnected: boolean;
  onlineCount: number;
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
  wsConnected,
  onlineCount,
  onLikePost,
  onSendShoutout,
}: SocialRealtimeSectionProps) {
  const [senderName, setSenderName] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  async function handleSubmitShoutout(e: FormEvent) {
    e.preventDefault();
    if (!senderName.trim() || !message.trim() || sending) return;
    setSending(true);
    setFormFeedback(null);
    try {
      await onSendShoutout(senderName.trim(), city.trim() || 'Nusantara', message.trim());
      setMessage('');
      setFormFeedback('Pesan berhasil disiarkan secara real-time.');
    } catch (err) {
      setFormFeedback(err instanceof Error ? err.message : 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id={sectionMeta?.slug || 'sosial'}
      className="border-b border-[#2A2620] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#EAB308] mb-2">
              {sectionMeta?.kicker || '05. Integrasi Media Sosial Real-Time'}
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Kanal Resmi & Siaran Langsung Komunitas'}
            </h2>
            {sectionMeta?.subtitle && (
              <p className="mt-2 text-sm text-[#A8A092] max-w-[54ch]">
                {sectionMeta.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#D6CFC2] font-mono tabular-nums">
            <Radio
              className={`w-4 h-4 ${wsConnected ? 'text-[#4ADE80]' : 'text-[#A8A092]'}`}
              aria-hidden="true"
            />
            <span>
              {wsConnected
                ? `Sinkronisasi WebSocket Aktif · ${onlineCount} pengunjung terhubung`
                : 'Menyambungkan ulang WebSocket...'}
            </span>
          </div>
        </div>

        {/* Connected Social Channels Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {channels
            .filter((c) => c.connected)
            .map((channel) => (
              <a
                key={channel.platform}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-5 flex items-start justify-between gap-3 hover:border-[#EAB308] transition-colors"
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

        {/* Two-column Real-Time Feed + Live Fan Shoutouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Official Social Feed Stream */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#F5F2EB]">
              Pembaruan Lintas Platform
            </h3>

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-8 text-center text-sm text-[#A8A092]">
                Belum ada kiriman media sosial.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-[#EAB308]">{post.platform}</span>
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

                    <p className="text-sm leading-relaxed text-[#D6CFC2]">{post.content}</p>

                    {post.mediaUrl && (
                      <div className="overflow-hidden rounded-xl border border-[#2A2620] aspect-[16/9] max-h-72 bg-black">
                        {post.mediaType === 'video' ||
                        /\.(mp4|webm|mov)(\?|$)/i.test(post.mediaUrl) ? (
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

                    <div className="pt-2 border-t border-[#2A2620] flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => onLikePost(post.id)}
                        className="inline-flex items-center gap-2 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] rounded-lg border border-[#2A2620] bg-[#0C0B09] cursor-pointer transition-colors"
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
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Fan Shoutout Wall */}
          <div className="lg:col-span-5 rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-[#F5F2EB]">
                Dinding Sapaan Pendengar
              </h3>
              <MessageSquare className="w-4 h-4 text-[#EAB308]" aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmitShoutout} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama Anda"
                  aria-label="Nama pengirim"
                  className="min-h-[40px] px-3 py-2 text-sm bg-[#0C0B09] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
                />
                <input
                  type="text"
                  maxLength={40}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kota (opsional)"
                  aria-label="Kota asal"
                  className="min-h-[40px] px-3 py-2 text-sm bg-[#0C0B09] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
                />
              </div>
              <textarea
                required
                rows={2}
                maxLength={240}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis sapaan atau request lagu untuk tampil real-time..."
                aria-label="Pesan untuk band"
                className="w-full px-3 py-2 text-sm bg-[#0C0B09] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
              />
              <div className="flex items-center justify-between gap-3">
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

            <div className="border-t border-[#2A2620] pt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {shoutouts.map((item) => (
                <div
                  key={item.id}
                  className="pb-3 border-b border-[#2A2620]/70 last:border-b-0 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#F5F2EB]">
                      {item.senderName} ·{' '}
                      <span className="font-normal text-[#A8A092]">{item.city}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[#787166]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#D6CFC2]">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
