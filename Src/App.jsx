import React, { useState, useEffect, useCallback } from "react";
import { signUp, signIn, signOut, getSession, getCurrentProfile } from "./lib/auth";
import {
  Home, BookOpen, Users, Radio, HeartHandshake, Coffee, Download,
  CheckCircle2, Play, Search, PlusCircle, Bookmark, BookmarkCheck,
  ExternalLink, X, ArrowLeft, ThumbsUp, Send, ShoppingBag, Newspaper,
  Landmark, Lock, Globe, Image as ImageIcon, MessageCircle, ChevronRight,
  Settings, Cross, UserPlus, Mail, User
} from "lucide-react";

/* ---------- fonts ---------- */
const FontLink = () => (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Serif+4:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
  />
);

/* ---------- palette ----------
ink #221A12  parchment #F4ECD8  navy #16233D  gold #C9A24B  oxblood #7A2E27  mist #8B816E
------------------------------- */

const T = {
  ink: "#221A12",
  parchment: "#F4ECD8",
  navy: "#16233D",
  navy2: "#1E314F",
  gold: "#C9A24B",
  goldSoft: "#E4CE95",
  oxblood: "#7A2E27",
  mist: "#8B816E",
  card: "#FFFDF7",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

/* ---------- divider signature element ---------- */
const GoldDivider = ({ tight }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: tight ? "10px 0" : "22px 0" }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.gold}88)` }} />
    <Cross size={12} color={T.gold} strokeWidth={2.2} />
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}88, transparent)` }} />
  </div>
);

/* ---------- seed data ---------- */
const SEED_LIBRARY = [
  { id: "l1", title: "On the Incarnation", author: "St. Athanasius the Great", type: "Audiobook", duration: "3h 12m", tag: "Patristic" },
  { id: "l2", title: "The Ladder of Divine Ascent", author: "St. John Climacus", type: "Audiobook", duration: "6h 40m", tag: "Ascetic" },
  { id: "l3", title: "Sunday of Orthodoxy Homily", author: "Fr. Josiah Trenham", type: "Sermon", duration: "38m", tag: "Homily" },
  { id: "l4", title: "The Way of a Pilgrim", author: "Anonymous", type: "Audiobook", duration: "4h 05m", tag: "Prayer" },
  { id: "l5", title: "On Fasting & the Body", author: "Fr. Thomas Hopko", type: "Sermon", duration: "51m", tag: "Fasting" },
  { id: "l6", title: "The Orthodox Church", author: "Metropolitan Kallistos Ware", type: "Audiobook", duration: "9h 20m", tag: "Catechism" },
];

const LIVE_DIRECTORY = [
  { name: "Orthodox Christian Network — Live Services", url: "https://myocn.net/live-streaming-orthodox-church-services-around-the-world/", note: "Parishes across the US & worldwide, updated listing" },
  { name: "GOARCH — Live Internet Broadcasts", url: "https://www.goarch.org/live-broadcasts", note: "Searchable directory, Greek Orthodox Archdiocese of America" },
  { name: "OrthodoxWiki — Live Stream List", url: "https://orthodoxwiki.org/List_of_Live_Streams_of_Orthodox_Christian_Church_Services", note: "Comprehensive multi-jurisdiction list" },
  { name: "LiveLiturgy.com — North America", url: "http://liveliturgy.com/orthodox/north-america/", note: "OCA, Antiochian, ROCOR, Serbian, Romanian & more, by state" },
  { name: "OrthodoxLiveStream.com", url: "https://www.orthodoxlivestream.com/", note: "Curated by timezone, so you can pray along" },
];

const SEED_CHURCHES = [
  { id: "c1", name: "Holy Transfiguration Orthodox Church", city: "Marietta, GA", description: "Sunday Divine Liturgy 9:30am. All are welcome.", paypal: "", cashapp: "", venmo: "" },
];

/* ---------- storage helpers ---------- */
async function loadShared(key, fallback) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : fallback;
  } catch { return fallback; }
}
async function saveShared(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), true); } catch (e) { console.error(e); }
}
async function loadPersonal(key, fallback) {
  try {
    const r = await window.storage.get(key, false);
    return r ? JSON.parse(r.value) : fallback;
  } catch { return fallback; }
}
async function savePersonal(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch (e) { console.error(e); }
}

/* ---------- generic small UI ---------- */
const Pill = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 14px", borderRadius: 999, border: `1px solid ${active ? T.gold : "#D9CDA9"}`,
      background: active ? T.navy : "transparent", color: active ? T.goldSoft : T.mist,
      fontFamily: "Inter", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
    }}
  >{children}</button>
);

const IconBtn = ({ icon, label, onClick, tone = "gold" }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
    border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 13,
    background: tone === "gold" ? T.gold : tone === "oxblood" ? T.oxblood : "#EDE3C6",
    color: tone === "muted" ? T.ink : "#fff",
  }}>{icon}{label}</button>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 4 }}>
    <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 26, color: T.navy, letterSpacing: 0.2 }}>{children}</div>
    {sub && <div style={{ fontFamily: "Inter", fontSize: 12.5, color: T.mist, marginTop: 2 }}>{sub}</div>}
  </div>
);

const EmptyState = ({ icon, title, body }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: T.mist }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.6 }}>{icon}</div>
    <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 600, fontSize: 19, color: T.navy }}>{title}</div>
    <div style={{ fontFamily: "Inter", fontSize: 13, marginTop: 4 }}>{body}</div>
  </div>
);

/* ============================================================ HOME */
function HomeTab({ goto, requests, churches, newsPosts, account }) {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{
        background: `linear-gradient(155deg, ${T.navy}, ${T.navy2})`, borderRadius: 18, padding: "26px 20px",
        color: T.parchment, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -18, top: -18, opacity: 0.15 }}><Cross size={110} color={T.gold} /></div>
        <div style={{ fontFamily: "Inter", fontSize: 11.5, letterSpacing: 2, color: T.goldSoft, textTransform: "uppercase" }}>Glory to Jesus Christ</div>
        <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 32, marginTop: 6, lineHeight: 1.1 }}>
          {account?.display_name ? `Welcome, ${account.display_name.split(" ")[0]}` : "Crucifixion"}
        </div>
        <div style={{ fontFamily: "Source Serif 4", fontSize: 14, marginTop: 8, color: "#DCD2B8", maxWidth: 260 }}>
          Audiobooks, sermons, and community — for the Orthodox faithful, wherever you are.
        </div>
      </div>

      {account?.role === "ministry" && (
        <button onClick={() => goto("give")} style={{
          width: "100%", marginTop: 12, textAlign: "left", background: T.card, border: `1px solid ${T.gold}66`,
          borderRadius: 14, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        }}>
          <Landmark size={20} color={T.oxblood} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 14, color: T.ink }}>Set up {account.ministry_name || "your"} church page</div>
            <div style={{ fontFamily: "Inter", fontSize: 11.5, color: T.mist }}>Add donation options in the Give tab</div>
          </div>
          <ChevronRight size={16} color={T.mist} />
        </button>
      )}

      <GoldDivider />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <HomeTile icon={<BookOpen size={20} color={T.oxblood} />} title="Library" sub="Listen & download" onClick={() => goto("library")} />
        <HomeTile icon={<Users size={20} color={T.oxblood} />} title="Community" sub="Parishes & groups" onClick={() => goto("community")} />
        <HomeTile icon={<Radio size={20} color={T.oxblood} />} title="Live" sub="Services now" onClick={() => goto("live")} />
        <HomeTile icon={<HeartHandshake size={20} color={T.oxblood} />} title="Give" sub="Support & donate" onClick={() => goto("give")} />
        <HomeTile icon={<Newspaper size={20} color={T.oxblood} />} title="News" sub="Blog & bookmarks" onClick={() => goto("news")} />
        <HomeTile icon={<ShoppingBag size={20} color={T.oxblood} />} title="Shop" sub="Coming soon" onClick={() => goto("market")} />
      </div>

      <GoldDivider />
      <SectionTitle>Recently requested</SectionTitle>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.slice(0, 3).map(r => (
          <div key={r.id} style={{ background: T.card, borderRadius: 12, padding: "10px 14px", border: "1px solid #EADFC0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 14, color: T.ink }}>{r.title}</div>
              <div style={{ fontFamily: "Inter", fontSize: 11.5, color: T.mist }}>{r.type} · requested by {r.by}</div>
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 12, color: T.oxblood, fontWeight: 700 }}>▲ {r.votes}</div>
          </div>
        ))}
        {requests.length === 0 && <div style={{ fontFamily: "Inter", fontSize: 13, color: T.mist }}>No requests yet — be the first in the Library tab.</div>}
      </div>
    </div>
  );
}

const HomeTile = ({ icon, title, sub, onClick }) => (
  <button onClick={onClick} style={{
    textAlign: "left", background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: "14px 14px",
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 999, background: "#F4E9CB", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.gold}55` }}>{icon}</div>
    <div>
      <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 17, color: T.navy }}>{title}</div>
      <div style={{ fontFamily: "Inter", fontSize: 11.5, color: T.mist }}>{sub}</div>
    </div>
  </button>
);

/* ============================================================ LIBRARY */
function LibraryTab({ downloads, toggleDownload, requests, addRequest, upvote }) {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", type: "Audiobook", notes: "" });

  const items = SEED_LIBRARY.filter(i =>
    (filter === "All" || i.type === filter) &&
    (i.title.toLowerCase().includes(q.toLowerCase()) || i.author.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Audiobooks & sermons, saved for offline listening">Library</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, background: T.card, border: "1px solid #EADFC0", borderRadius: 12, padding: "9px 12px" }}>
        <Search size={16} color={T.mist} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles or authors"
          style={{ border: "none", outline: "none", background: "transparent", fontFamily: "Inter", fontSize: 13.5, flex: 1, color: T.ink }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
        {["All", "Audiobook", "Sermon"].map(f => <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>)}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(item => {
          const dl = downloads.includes(item.id);
          return (
            <div key={item.id} style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: "13px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Inter", fontSize: 10.5, letterSpacing: 1, color: T.oxblood, fontWeight: 700, textTransform: "uppercase" }}>{item.type} · {item.tag}</div>
                  <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 16, color: T.ink, marginTop: 3 }}>{item.title}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2 }}>{item.author} · {item.duration}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <IconBtn icon={<Play size={14} />} label="Play" onClick={() => {}} />
                <IconBtn
                  icon={dl ? <CheckCircle2 size={14} /> : <Download size={14} />}
                  label={dl ? "Downloaded" : "Download"}
                  tone={dl ? "muted" : "gold"}
                  onClick={() => toggleDownload(item.id)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <GoldDivider />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle sub="Vote up what you'd like to see added">Community requests</SectionTitle>
        <button onClick={() => setShowForm(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <PlusCircle size={26} color={T.oxblood} />
        </button>
      </div>

      {showForm && (
        <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <FormInput placeholder="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <FormInput placeholder="Author / speaker" value={form.author} onChange={v => setForm({ ...form, author: v })} />
          <div style={{ display: "flex", gap: 8 }}>
            {["Audiobook", "Sermon"].map(t => <Pill key={t} active={form.type === t} onClick={() => setForm({ ...form, type: t })}>{t}</Pill>)}
          </div>
          <IconBtn icon={<Send size={14} />} label="Submit request" onClick={() => {
            if (!form.title.trim()) return;
            addRequest(form);
            setForm({ title: "", author: "", type: "Audiobook", notes: "" });
            setShowForm(false);
          }} />
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 14, color: T.ink }}>{r.title}</div>
              <div style={{ fontFamily: "Inter", fontSize: 11.5, color: T.mist }}>{r.author || "Unknown"} · {r.type}</div>
            </div>
            <button onClick={() => upvote(r.id)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F4E9CB", border: `1px solid ${T.gold}66`, borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}>
              <ThumbsUp size={13} color={T.oxblood} />
              <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 12, color: T.oxblood }}>{r.votes}</span>
            </button>
          </div>
        ))}
        {requests.length === 0 && <EmptyState icon={<BookOpen size={34} />} title="No requests yet" body="Add the first audiobook or sermon you'd love to hear." />}
      </div>
    </div>
  );
}

const FormInput = ({ placeholder, value, onChange, multiline }) => {
  const Comp = multiline ? "textarea" : "input";
  return (
    <Comp value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={multiline ? 3 : undefined}
      style={{
        width: "100%", boxSizing: "border-box", border: "1px solid #E2D6B4", borderRadius: 9, padding: "9px 11px",
        fontFamily: "Inter", fontSize: 13.5, outline: "none", color: T.ink, resize: multiline ? "vertical" : "none",
      }} />
  );
};

/* ============================================================ COMMUNITY */
function CommunityTab({ communities, joined, joinByCode, joinOpen, addCommunity, posts, addPost, addComment }) {
  const [active, setActive] = useState(null);
  const [code, setCode] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newC, setNewC] = useState({ name: "", description: "", isOpen: true });
  const [joinMsg, setJoinMsg] = useState("");

  if (active) {
    const c = communities.find(x => x.id === active);
    const p = posts[active] || [];
    return <CommunityDetail community={c} posts={p} onBack={() => setActive(null)} addPost={addPost} addComment={addComment} />;
  }

  const myCommunities = communities.filter(c => joined.includes(c.id));
  const openCommunities = communities.filter(c => c.isOpen && !joined.includes(c.id));

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Parishes, monasteries, and study groups">Community</SectionTitle>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter join code"
          style={{ flex: 1, border: "1px solid #E2D6B4", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter", fontSize: 13.5, outline: "none" }} />
        <IconBtn icon={<Lock size={14} />} label="Join" onClick={() => {
          const res = joinByCode(code.trim());
          setJoinMsg(res ? "" : "No community found with that code.");
          setCode("");
        }} />
      </div>
      {joinMsg && <div style={{ fontFamily: "Inter", fontSize: 12, color: T.oxblood, marginTop: 6 }}>{joinMsg}</div>}

      {myCommunities.length > 0 && (
        <>
          <GoldDivider tight />
          <div style={{ fontFamily: "Inter", fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: T.mist, textTransform: "uppercase", marginBottom: 8 }}>Your communities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myCommunities.map(c => <CommunityRow key={c.id} c={c} onClick={() => setActive(c.id)} joined />)}
          </div>
        </>
      )}

      <GoldDivider tight />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Inter", fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: T.mist, textTransform: "uppercase" }}>Open groups</div>
        <button onClick={() => setShowNew(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}><PlusCircle size={22} color={T.oxblood} /></button>
      </div>

      {showNew && (
        <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <FormInput placeholder="Community name" value={newC.name} onChange={v => setNewC({ ...newC, name: v })} />
          <FormInput placeholder="Short description" value={newC.description} onChange={v => setNewC({ ...newC, description: v })} multiline />
          <div style={{ display: "flex", gap: 8 }}>
            <Pill active={newC.isOpen} onClick={() => setNewC({ ...newC, isOpen: true })}>Open to all</Pill>
            <Pill active={!newC.isOpen} onClick={() => setNewC({ ...newC, isOpen: false })}>Code only</Pill>
          </div>
          <IconBtn icon={<Send size={14} />} label="Create community" onClick={() => {
            if (!newC.name.trim()) return;
            addCommunity(newC);
            setNewC({ name: "", description: "", isOpen: true });
            setShowNew(false);
          }} />
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {openCommunities.map(c => <CommunityRow key={c.id} c={c} onClick={() => setActive(c.id)} />)}
        {openCommunities.length === 0 && myCommunities.length === 0 && (
          <EmptyState icon={<Users size={34} />} title="No communities yet" body="Create one, or join with a code from your parish." />
        )}
      </div>
    </div>
  );
}

const CommunityRow = ({ c, onClick, joined }) => (
  <button onClick={onClick} style={{ textAlign: "left", background: T.card, border: "1px solid #EADFC0", borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 15, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}>
        {c.isOpen ? <Globe size={13} color={T.mist} /> : <Lock size={13} color={T.mist} />} {c.name}
      </div>
      <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2 }}>{c.description || "No description"}</div>
      {!c.isOpen && <div style={{ fontFamily: "Inter", fontSize: 11, color: T.oxblood, marginTop: 3 }}>Code: {c.code}</div>}
    </div>
    <ChevronRight size={18} color={T.mist} />
  </button>
);

function CommunityDetail({ community, posts, onBack, addPost, addComment }) {
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [commentDraft, setCommentDraft] = useState({});

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.navy, fontFamily: "Inter", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        <ArrowLeft size={16} /> Communities
      </button>
      <SectionTitle sub={community.description}>{community.name}</SectionTitle>

      <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <FormInput placeholder="Share something with the group…" value={text} onChange={setText} multiline />
        <FormInput placeholder="Photo or video URL (optional)" value={img} onChange={setImg} />
        <IconBtn icon={<Send size={14} />} label="Post" onClick={() => {
          if (!text.trim() && !img.trim()) return;
          addPost(community.id, { text, imageUrl: img });
          setText(""); setImg("");
        }} />
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.slice().reverse().map(p => (
          <div key={p.id} style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14 }}>
            <div style={{ fontFamily: "Inter", fontSize: 11.5, color: T.mist, marginBottom: 6 }}>{p.author} · {timeAgo(p.ts)}</div>
            {p.text && <div style={{ fontFamily: "Source Serif 4", fontSize: 14.5, color: T.ink }}>{p.text}</div>}
            {p.imageUrl && (
              <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", background: "#EFE6CB", display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
                <ImageIcon size={15} color={T.mist} />
                <span style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, wordBreak: "break-all" }}>{p.imageUrl}</span>
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {(p.comments || []).map(c => (
                <div key={c.id} style={{ fontFamily: "Inter", fontSize: 12.5, color: T.ink, background: "#F4ECD8", borderRadius: 8, padding: "6px 10px" }}>
                  <b>{c.author}:</b> {c.text}
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input
                  value={commentDraft[p.id] || ""}
                  onChange={e => setCommentDraft({ ...commentDraft, [p.id]: e.target.value })}
                  placeholder="Add a comment"
                  style={{ flex: 1, border: "1px solid #E2D6B4", borderRadius: 8, padding: "7px 10px", fontFamily: "Inter", fontSize: 12.5, outline: "none" }}
                />
                <button onClick={() => {
                  const v = (commentDraft[p.id] || "").trim();
                  if (!v) return;
                  addComment(community.id, p.id, v);
                  setCommentDraft({ ...commentDraft, [p.id]: "" });
                }} style={{ background: T.oxblood, border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer" }}>
                  <Send size={13} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && <EmptyState icon={<MessageCircle size={34} />} title="No posts yet" body="Be the first to share with this community." />}
      </div>
    </div>
  );
}

/* ============================================================ LIVE */
function LiveTab() {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Real parish live-stream directories, updated by each source">Live services</SectionTitle>
      <div style={{ background: "#F4E9CB", border: `1px solid ${T.gold}66`, borderRadius: 12, padding: "12px 14px", marginTop: 14, fontFamily: "Inter", fontSize: 12.5, color: T.ink }}>
        These link out to real Orthodox streaming directories — tap one to find a parish streaming Divine Liturgy, Vespers, or Matins near your time zone right now.
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {LIVE_DIRECTORY.map(d => (
          <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: "13px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 15, color: T.ink }}>{d.name}</div>
                <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2 }}>{d.note}</div>
              </div>
              <ExternalLink size={16} color={T.oxblood} />
            </div>
          </a>
        ))}
      </div>
      <GoldDivider />
      <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, lineHeight: 1.6 }}>
        Most US parishes stream Divine Liturgy Sunday mornings between roughly 8:30–11am local time, with Vespers Saturday evenings. Exact times vary by jurisdiction and parish — check the linked directory for your parish's schedule.
      </div>
    </div>
  );
}

/* ============================================================ GIVE */
function GiveTab({ churches, addChurch, donationConfig, saveDonationConfig }) {
  const [tab, setTab] = useState("app");
  const [amount, setAmount] = useState(10);
  const [showChurchForm, setShowChurchForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [cfgDraft, setCfgDraft] = useState(donationConfig);
  const [newChurch, setNewChurch] = useState({ name: "", city: "", description: "", paypal: "", cashapp: "", venmo: "" });

  const payLinks = (paypal, cashapp) => ({
    paypal: paypal ? `https://paypal.me/${paypal}/${amount}` : null,
    cashapp: cashapp ? `https://cash.app/$${cashapp.replace("$", "")}/${amount}` : null,
  });

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Buy the app a coffee, or support a parish directly">Give</SectionTitle>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Pill active={tab === "app"} onClick={() => setTab("app")}>Support Crucifixion</Pill>
        <Pill active={tab === "church"} onClick={() => setTab("church")}>Church pages</Pill>
      </div>

      {tab === "app" && (
        <div style={{ marginTop: 14 }}>
          <div style={{ background: `linear-gradient(155deg, ${T.navy}, ${T.navy2})`, borderRadius: 16, padding: 18, color: T.parchment }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Coffee size={20} color={T.gold} />
              <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 20 }}>Buy the app a coffee</div>
            </div>
            <div style={{ fontFamily: "Source Serif 4", fontSize: 13, color: "#DCD2B8", marginTop: 6 }}>
              Keeps hosting, storage, and new features going. Every bit helps.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {[5, 10, 25, 50].map(a => (
                <button key={a} onClick={() => setAmount(a)} style={{
                  padding: "8px 16px", borderRadius: 999, border: `1px solid ${amount === a ? T.gold : "#4A5A78"}`,
                  background: amount === a ? T.gold : "transparent", color: amount === a ? T.navy : "#DCD2B8",
                  fontFamily: "Inter", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>${a}</button>
              ))}
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)}
                style={{ width: 70, borderRadius: 999, border: "1px solid #4A5A78", background: "transparent", color: "#fff", padding: "8px 12px", fontFamily: "Inter", fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {donationConfig.paypal
                ? <a href={`https://paypal.me/${donationConfig.paypal}/${amount}`} target="_blank" rel="noopener noreferrer"><IconBtn icon={<HeartHandshake size={14} />} label="Give via PayPal" /></a>
                : <span style={{ fontFamily: "Inter", fontSize: 12, color: "#9DA9C0" }}>PayPal not set up yet</span>}
              {donationConfig.cashapp
                ? <a href={`https://cash.app/$${donationConfig.cashapp.replace("$", "")}/${amount}`} target="_blank" rel="noopener noreferrer"><IconBtn icon={<HeartHandshake size={14} />} label="Give via Cash App" tone="oxblood" /></a>
                : null}
            </div>
          </div>

          <button onClick={() => setShowConfig(s => !s)} style={{ marginTop: 10, background: "none", border: "none", color: T.mist, fontFamily: "Inter", fontSize: 12, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <Settings size={13} /> Admin: set app payment handles
          </button>
          {showConfig && (
            <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 12, padding: 12, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              <FormInput placeholder="PayPal.me username" value={cfgDraft.paypal} onChange={v => setCfgDraft({ ...cfgDraft, paypal: v })} />
              <FormInput placeholder="Cash App $cashtag" value={cfgDraft.cashapp} onChange={v => setCfgDraft({ ...cfgDraft, cashapp: v })} />
              <IconBtn icon={<CheckCircle2 size={14} />} label="Save" onClick={() => { saveDonationConfig(cfgDraft); setShowConfig(false); }} />
            </div>
          )}
        </div>
      )}

      {tab === "church" && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setShowChurchForm(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}><PlusCircle size={24} color={T.oxblood} /></button>
          </div>
          {showChurchForm && (
            <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <FormInput placeholder="Church name" value={newChurch.name} onChange={v => setNewChurch({ ...newChurch, name: v })} />
              <FormInput placeholder="City, State" value={newChurch.city} onChange={v => setNewChurch({ ...newChurch, city: v })} />
              <FormInput placeholder="Short description / service times" value={newChurch.description} onChange={v => setNewChurch({ ...newChurch, description: v })} multiline />
              <FormInput placeholder="PayPal.me username" value={newChurch.paypal} onChange={v => setNewChurch({ ...newChurch, paypal: v })} />
              <FormInput placeholder="Cash App $cashtag" value={newChurch.cashapp} onChange={v => setNewChurch({ ...newChurch, cashapp: v })} />
              <IconBtn icon={<Send size={14} />} label="Create church page" onClick={() => {
                if (!newChurch.name.trim()) return;
                addChurch(newChurch);
                setNewChurch({ name: "", city: "", description: "", paypal: "", cashapp: "", venmo: "" });
                setShowChurchForm(false);
              }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {churches.map(c => {
              const links = payLinks(c.paypal, c.cashapp);
              return (
                <div key={c.id} style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Landmark size={17} color={T.oxblood} />
                    <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 15, color: T.ink }}>{c.name}</div>
                  </div>
                  <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 4 }}>{c.city}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 12.5, color: T.ink, marginTop: 6 }}>{c.description}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {links.paypal && <a href={links.paypal} target="_blank" rel="noopener noreferrer"><IconBtn icon={<HeartHandshake size={13} />} label={`Give $${amount} via PayPal`} /></a>}
                    {links.cashapp && <a href={links.cashapp} target="_blank" rel="noopener noreferrer"><IconBtn icon={<HeartHandshake size={13} />} label={`Give $${amount} via Cash App`} tone="oxblood" /></a>}
                    {!links.paypal && !links.cashapp && <span style={{ fontFamily: "Inter", fontSize: 12, color: T.mist }}>No payment method added yet</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ NEWS */
function NewsTab({ newsPosts, addNews, bookmarks, toggleBookmark, sharedItems, addShared }) {
  const [tab, setTab] = useState("blog");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "" });
  const [shareForm, setShareForm] = useState({ type: "Article", title: "", url: "" });
  const [showShareForm, setShowShareForm] = useState(false);

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Blog posts, Christian news, and shared resources">News & Sharing</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Pill active={tab === "blog"} onClick={() => setTab("blog")}>Blog</Pill>
        <Pill active={tab === "share"} onClick={() => setTab("share")}>Shared resources</Pill>
        <Pill active={tab === "bookmarks"} onClick={() => setTab("bookmarks")}>Bookmarks</Pill>
      </div>

      {tab === "blog" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={() => setShowForm(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}><PlusCircle size={24} color={T.oxblood} /></button>
          </div>
          {showForm && (
            <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <FormInput placeholder="Post title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
              <FormInput placeholder="Write your post…" value={form.excerpt} onChange={v => setForm({ ...form, excerpt: v })} multiline />
              <IconBtn icon={<Send size={14} />} label="Publish" onClick={() => {
                if (!form.title.trim()) return;
                addNews(form);
                setForm({ title: "", excerpt: "" });
                setShowForm(false);
              }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {newsPosts.slice().reverse().map(p => (
              <NewsCard key={p.id} p={p} bookmarked={bookmarks.includes(p.id)} onBookmark={() => toggleBookmark(p.id)} />
            ))}
            {newsPosts.length === 0 && <EmptyState icon={<Newspaper size={34} />} title="No posts yet" body="Share the first bit of Christian news or reflection." />}
          </div>
        </>
      )}

      {tab === "share" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={() => setShowShareForm(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}><PlusCircle size={24} color={T.oxblood} /></button>
          </div>
          {showShareForm && (
            <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["Article", "Book", "Audio"].map(t => <Pill key={t} active={shareForm.type === t} onClick={() => setShareForm({ ...shareForm, type: t })}>{t}</Pill>)}
              </div>
              <FormInput placeholder="Title" value={shareForm.title} onChange={v => setShareForm({ ...shareForm, title: v })} />
              <FormInput placeholder="Link or note" value={shareForm.url} onChange={v => setShareForm({ ...shareForm, url: v })} />
              <IconBtn icon={<Send size={14} />} label="Share" onClick={() => {
                if (!shareForm.title.trim()) return;
                addShared(shareForm);
                setShareForm({ type: "Article", title: "", url: "" });
                setShowShareForm(false);
              }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sharedItems.slice().reverse().map(s => (
              <div key={s.id} style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontFamily: "Inter", fontSize: 10.5, letterSpacing: 1, color: T.oxblood, fontWeight: 700, textTransform: "uppercase" }}>{s.type}</div>
                <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 15, color: T.ink, marginTop: 2 }}>{s.title}</div>
                {s.url && <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2, wordBreak: "break-all" }}>{s.url}</div>}
                <div style={{ fontFamily: "Inter", fontSize: 11, color: T.mist, marginTop: 4 }}>shared by {s.by} · {timeAgo(s.ts)}</div>
              </div>
            ))}
            {sharedItems.length === 0 && <EmptyState icon={<Share2 size={34} />} title="Nothing shared yet" body="Pass along an article, book, or audio you loved." />}
          </div>
        </>
      )}

      {tab === "bookmarks" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {newsPosts.filter(p => bookmarks.includes(p.id)).map(p => (
            <NewsCard key={p.id} p={p} bookmarked onBookmark={() => toggleBookmark(p.id)} />
          ))}
          {bookmarks.length === 0 && <EmptyState icon={<Bookmark size={34} />} title="No bookmarks yet" body="Tap the bookmark icon on any post to save it here." />}
        </div>
      )}
    </div>
  );
}

const NewsCard = ({ p, bookmarked, onBookmark }) => (
  <div style={{ background: T.card, border: "1px solid #EADFC0", borderRadius: 14, padding: "13px 14px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 16, color: T.ink }}>{p.title}</div>
      <button onClick={onBookmark} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
        {bookmarked ? <BookmarkCheck size={18} color={T.oxblood} /> : <Bookmark size={18} color={T.mist} />}
      </button>
    </div>
    <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 3 }}>{p.author} · {timeAgo(p.ts)}</div>
    {p.excerpt && <div style={{ fontFamily: "Source Serif 4", fontSize: 13.5, color: T.ink, marginTop: 6, lineHeight: 1.5 }}>{p.excerpt}</div>}
  </div>
);

/* ============================================================ MARKET */
function MarketTab() {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <SectionTitle sub="Icons, prayer ropes, books, and more — set up by the admin">Shop</SectionTitle>
      <div style={{ marginTop: 30 }}>
        <EmptyState icon={<ShoppingBag size={38} />} title="Coming soon" body="This is where items you upload for purchase will appear. Ready for you to add products whenever you'd like." />
      </div>
    </div>
  );
}

/* ============================================================ SPLASH */
function SplashScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(160deg, ${T.navy}, ${T.navy2})`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      maxWidth: 480, margin: "0 auto", position: "relative", overflow: "hidden",
    }}>
      <FontLink />
      <style>{`
        @keyframes riseCross { 0% { opacity: 0; transform: translateY(10px) scale(0.9); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeInName { 0% { opacity: 0; letter-spacing: 8px; } 100% { opacity: 1; letter-spacing: 3px; } }
        @keyframes fadeInTag { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes ringPulse { 0% { opacity: 0.5; transform: scale(0.9); } 100% { opacity: 0; transform: scale(1.5); } }
      `}</style>
      <div style={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${T.gold}`,
          animation: "ringPulse 2.2s ease-out infinite",
        }} />
        <div style={{
          width: 74, height: 74, borderRadius: "50%", background: "#1B2A4A",
          border: `1px solid ${T.gold}88`, display: "flex", alignItems: "center", justifyContent: "center",
          animation: "riseCross 0.9s ease-out",
        }}>
          <Cross size={30} color={T.gold} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{
        fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 30, color: T.goldSoft,
        marginTop: 22, letterSpacing: 3, animation: "fadeInName 1.2s ease-out 0.3s both",
      }}>
        CRUCIFIXION
      </div>
      <div style={{
        fontFamily: "Inter", fontSize: 12, color: "#9DA9C0", marginTop: 8,
        animation: "fadeInTag 1.4s ease-out 0.8s both",
      }}>
        Audiobooks, sermons & community
      </div>
    </div>
  );
}

/* ============================================================ ONBOARDING */
function AuthScreen({ onComplete }) {
  const [authMode, setAuthMode] = useState("choose"); // 'choose' | 'signup' | 'login'
  const [role, setRole] = useState(null); // for signup: 'individual' | 'ministry'
  const [form, setForm] = useState({ name: "", email: "", password: "", ministryName: "", city: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doSignUp = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in your name, email, and a password."); return;
    }
    if (form.password.length < 6) { setError("Password should be at least 6 characters."); return; }
    if (role === "ministry" && !form.ministryName.trim()) { setError("Please add your ministry or parish name."); return; }
    setBusy(true);
    try {
      const profile = await signUp({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role,
        ministryName: form.ministryName.trim(),
        city: form.city.trim(),
      });
      onComplete(profile);
    } catch (e) {
      setError(e.message || "Something went wrong creating your account.");
    } finally {
      setBusy(false);
    }
  };

  const doLogin = async () => {
    setError("");
    if (!form.email.trim() || !form.password) { setError("Please enter your email and password."); return; }
    setBusy(true);
    try {
      const profile = await signIn({ email: form.email.trim(), password: form.password });
      onComplete(profile);
    } catch (e) {
      setError(e.message || "Couldn't log you in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.parchment, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <FontLink />
      <div style={{ background: T.navy, padding: "16px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <Cross size={16} color={T.gold} />
        <span style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 18, color: T.goldSoft, letterSpacing: 0.5 }}>CRUCIFIXION</span>
      </div>

      <div style={{ padding: "28px 22px", flex: 1 }}>
        {authMode === "choose" && (
          <>
            <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 27, color: T.navy, lineHeight: 1.15 }}>
              Welcome. Let's get you set up.
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 13, color: T.mist, marginTop: 8 }}>
              Choose the account that fits you — you can always add a ministry page later too.
            </div>

            <GoldDivider />

            <button onClick={() => { setAuthMode("signup"); setRole("individual"); setError(""); }} style={{
              width: "100%", textAlign: "left", background: T.card, border: "1px solid #EADFC0", borderRadius: 16,
              padding: 18, cursor: "pointer", display: "flex", gap: 14, alignItems: "center", marginBottom: 12,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: "#F4E9CB", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.gold}55`, flexShrink: 0 }}>
                <UserPlus size={20} color={T.oxblood} />
              </div>
              <div>
                <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 18, color: T.navy }}>Create Account</div>
                <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2 }}>For listening, joining communities & giving</div>
              </div>
              <ChevronRight size={18} color={T.mist} style={{ marginLeft: "auto" }} />
            </button>

            <button onClick={() => { setAuthMode("signup"); setRole("ministry"); setError(""); }} style={{
              width: "100%", textAlign: "left", background: T.card, border: "1px solid #EADFC0", borderRadius: 16,
              padding: 18, cursor: "pointer", display: "flex", gap: 14, alignItems: "center", marginBottom: 12,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: "#F4E9CB", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.gold}55`, flexShrink: 0 }}>
                <Landmark size={20} color={T.oxblood} />
              </div>
              <div>
                <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 18, color: T.navy }}>Create Ministry Account</div>
                <div style={{ fontFamily: "Inter", fontSize: 12, color: T.mist, marginTop: 2 }}>For parishes, monasteries & Christian organizations</div>
              </div>
              <ChevronRight size={18} color={T.mist} style={{ marginLeft: "auto" }} />
            </button>

            <button onClick={() => { setAuthMode("login"); setError(""); }} style={{ width: "100%", textAlign: "center", background: "none", border: "none", padding: 10, cursor: "pointer" }}>
              <span style={{ fontFamily: "Inter", fontSize: 13, color: T.oxblood, fontWeight: 600 }}>Already have an account? Log in</span>
            </button>
          </>
        )}

        {authMode === "signup" && (
          <>
            <button onClick={() => { setAuthMode("choose"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.navy, fontFamily: "Inter", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 24, color: T.navy }}>
              {role === "individual" ? "Create your account" : "Create your ministry account"}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 12.5, color: T.mist, marginTop: 4 }}>
              {role === "individual" ? "Just a couple details to get started." : "You'll be able to set up your church page and donation options right after."}
            </div>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {role === "ministry" && (
                <div>
                  <FieldLabel icon={<Landmark size={13} />}>Ministry / parish name</FieldLabel>
                  <FormInput placeholder="e.g. Holy Transfiguration Orthodox Church" value={form.ministryName} onChange={v => setForm({ ...form, ministryName: v })} />
                </div>
              )}
              <div>
                <FieldLabel icon={<User size={13} />}>{role === "ministry" ? "Contact name" : "Your name"}</FieldLabel>
                <FormInput placeholder="Full name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
              </div>
              <div>
                <FieldLabel icon={<Mail size={13} />}>Email</FieldLabel>
                <FormInput placeholder="you@example.com" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              </div>
              <div>
                <FieldLabel icon={<Lock size={13} />}>Password</FieldLabel>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters"
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2D6B4", borderRadius: 9, padding: "9px 11px", fontFamily: "Inter", fontSize: 13.5, outline: "none", color: T.ink }} />
              </div>
              <div>
                <FieldLabel icon={<Globe size={13} />}>City, State</FieldLabel>
                <FormInput placeholder="Optional" value={form.city} onChange={v => setForm({ ...form, city: v })} />
              </div>
            </div>

            {error && <div style={{ fontFamily: "Inter", fontSize: 12, color: T.oxblood, marginTop: 10 }}>{error}</div>}

            <div style={{ marginTop: 18 }}>
              <IconBtn icon={<CheckCircle2 size={15} />} label={busy ? "Creating account…" : (role === "individual" ? "Create account" : "Create ministry account")} onClick={busy ? () => {} : doSignUp} />
            </div>
          </>
        )}

        {authMode === "login" && (
          <>
            <button onClick={() => { setAuthMode("choose"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.navy, fontFamily: "Inter", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 24, color: T.navy }}>Welcome back</div>
            <div style={{ fontFamily: "Inter", fontSize: 12.5, color: T.mist, marginTop: 4 }}>Log in to your account.</div>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <FieldLabel icon={<Mail size={13} />}>Email</FieldLabel>
                <FormInput placeholder="you@example.com" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              </div>
              <div>
                <FieldLabel icon={<Lock size={13} />}>Password</FieldLabel>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Your password"
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2D6B4", borderRadius: 9, padding: "9px 11px", fontFamily: "Inter", fontSize: 13.5, outline: "none", color: T.ink }} />
              </div>
            </div>

            {error && <div style={{ fontFamily: "Inter", fontSize: 12, color: T.oxblood, marginTop: 10 }}>{error}</div>}

            <div style={{ marginTop: 18 }}>
              <IconBtn icon={<CheckCircle2 size={15} />} label={busy ? "Logging in…" : "Log in"} onClick={busy ? () => {} : doLogin} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const FieldLabel = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "Inter", fontSize: 11.5, fontWeight: 600, color: T.mist, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>
    {icon}{children}
  </div>
);

/* ============================================================ APP SHELL */
const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "library", label: "Library", icon: BookOpen },
  { key: "community", label: "Groups", icon: Users },
  { key: "live", label: "Live", icon: Radio },
  { key: "give", label: "Give", icon: HeartHandshake },
];

export default function App() {
  const [phase, setPhase] = useState("splash"); // 'splash' | 'auth' | 'app'
  const [account, setAccount] = useState(null);
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const session = await getSession();
        if (session) {
          const profile = await getCurrentProfile();
          setAccount(profile);
          setPhase(profile ? "app" : "auth");
        } else {
          setPhase("auth");
        }
      } catch (e) {
        console.error("Session check failed:", e);
        setPhase("auth");
      }
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  const completeAuth = useCallback((profile) => {
    setAccount(profile);
    setPhase("app");
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setAccount(null);
    setPhase("auth");
  }, []);

  const [downloads, setDownloads] = useState([]);
  const [requests, setRequests] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [joined, setJoined] = useState([]);
  const [posts, setPosts] = useState({});
  const [churches, setChurches] = useState([]);
  const [donationConfig, setDonationConfig] = useState({ paypal: "", cashapp: "" });
  const [newsPosts, setNewsPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [sharedItems, setSharedItems] = useState([]);

  useEffect(() => {
    (async () => {
      const [dl, req, comm, jn, ch, cfg, np, bm, sh] = await Promise.all([
        loadPersonal("downloads", []),
        loadShared("requests", []),
        loadShared("communities", null),
        loadPersonal("joinedCommunities", []),
        loadShared("churches", null),
        loadShared("donationConfig", { paypal: "", cashapp: "" }),
        loadShared("newsPosts", []),
        loadPersonal("bookmarks", []),
        loadShared("sharedItems", []),
      ]);
      const seededComm = comm || [
        { id: "seed1", name: "Holy Transfiguration Parish", description: "Official parish group — Marietta, GA", isOpen: true, code: "" },
        { id: "seed2", name: "Young Adult Fellowship", description: "Weekly readings & discussion", isOpen: true, code: "" },
        { id: "seed3", name: "St. Herman Men's Study", description: "Invite-only Bible study", isOpen: false, code: "HERMAN25" },
      ];
      if (!comm) await saveShared("communities", seededComm);
      const seededChurches = ch || SEED_CHURCHES;
      if (!ch) await saveShared("churches", seededChurches);

      setDownloads(dl); setRequests(req); setCommunities(seededComm); setJoined(jn);
      setChurches(seededChurches); setDonationConfig(cfg); setNewsPosts(np); setBookmarks(bm); setSharedItems(sh);

      const postKeys = {};
      for (const c of seededComm) postKeys[c.id] = await loadShared(`posts_${c.id}`, []);
      setPosts(postKeys);
      setLoaded(true);
    })();
  }, []);

  const toggleDownload = useCallback((id) => {
    setDownloads(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      savePersonal("downloads", next);
      return next;
    });
  }, []);

  const addRequest = useCallback((form) => {
    const r = { id: uid(), ...form, votes: 1, by: "You", ts: now() };
    setRequests(prev => { const next = [r, ...prev]; saveShared("requests", next); return next; });
  }, []);

  const upvote = useCallback((id) => {
    setRequests(prev => {
      const next = prev.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r).sort((a, b) => b.votes - a.votes);
      saveShared("requests", next);
      return next;
    });
  }, []);

  const addCommunity = useCallback((form) => {
    const c = { id: uid(), name: form.name, description: form.description, isOpen: form.isOpen, code: form.isOpen ? "" : uid().toUpperCase() };
    setCommunities(prev => { const next = [...prev, c]; saveShared("communities", next); return next; });
    setJoined(prev => { const next = [...prev, c.id]; savePersonal("joinedCommunities", next); return next; });
    setPosts(prev => ({ ...prev, [c.id]: [] }));
  }, []);

  const joinByCode = useCallback((code) => {
    let found = null;
    setCommunities(prev => { found = prev.find(c => c.code && c.code.toLowerCase() === code.toLowerCase()); return prev; });
    if (found) {
      setJoined(prev => {
        if (prev.includes(found.id)) return prev;
        const next = [...prev, found.id];
        savePersonal("joinedCommunities", next);
        return next;
      });
    }
    return found;
  }, []);

  const addPost = useCallback((communityId, form) => {
    const p = { id: uid(), author: "You", text: form.text, imageUrl: form.imageUrl, ts: now(), comments: [] };
    setPosts(prev => {
      const next = { ...prev, [communityId]: [...(prev[communityId] || []), p] };
      saveShared(`posts_${communityId}`, next[communityId]);
      return next;
    });
  }, []);

  const addComment = useCallback((communityId, postId, text) => {
    setPosts(prev => {
      const list = (prev[communityId] || []).map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { id: uid(), author: "You", text, ts: now() }] } : p);
      const next = { ...prev, [communityId]: list };
      saveShared(`posts_${communityId}`, list);
      return next;
    });
  }, []);

  const addChurch = useCallback((form) => {
    const c = { id: uid(), ...form };
    setChurches(prev => { const next = [...prev, c]; saveShared("churches", next); return next; });
  }, []);

  const saveDonationConfig = useCallback((cfg) => {
    setDonationConfig(cfg);
    saveShared("donationConfig", cfg);
  }, []);

  const addNews = useCallback((form) => {
    const p = { id: uid(), title: form.title, excerpt: form.excerpt, author: "You", ts: now() };
    setNewsPosts(prev => { const next = [...prev, p]; saveShared("newsPosts", next); return next; });
  }, []);

  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      savePersonal("bookmarks", next);
      return next;
    });
  }, []);

  const addShared = useCallback((form) => {
    const s = { id: uid(), ...form, by: "You", ts: now() };
    setSharedItems(prev => { const next = [...prev, s]; saveShared("sharedItems", next); return next; });
  }, []);

  if (phase === "splash") return <SplashScreen />;
  if (phase === "auth") return <AuthScreen onComplete={completeAuth} />;

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: T.parchment, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter" }}>
        <FontLink />
        <div style={{ color: T.mist, fontSize: 13 }}>Loading Crucifixion…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.parchment, maxWidth: 480, margin: "0 auto", position: "relative", fontFamily: "Source Serif 4" }}>
      <FontLink />

      {/* top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.navy, padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <Cross size={16} color={T.gold} />
        <span style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 18, color: T.goldSoft, letterSpacing: 0.5 }}>CRUCIFIXION</span>
      </div>

      <div style={{ minHeight: "calc(100vh - 130px)" }}>
        {tab === "home" && <HomeTab goto={setTab} requests={requests} churches={churches} newsPosts={newsPosts} account={account} />}
        {tab === "library" && <LibraryTab downloads={downloads} toggleDownload={toggleDownload} requests={requests} addRequest={addRequest} upvote={upvote} />}
        {tab === "community" && <CommunityTab communities={communities} joined={joined} joinByCode={joinByCode} addCommunity={addCommunity} posts={posts} addPost={addPost} addComment={addComment} />}
        {tab === "live" && <LiveTab />}
        {tab === "give" && <GiveTab churches={churches} addChurch={addChurch} donationConfig={donationConfig} saveDonationConfig={saveDonationConfig} />}
        {tab === "news" && <NewsTab newsPosts={newsPosts} addNews={addNews} bookmarks={bookmarks} toggleBookmark={toggleBookmark} sharedItems={sharedItems} addShared={addShared} />}
        {tab === "market" && <MarketTab />}
      </div>

      {/* bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: T.navy, display: "flex", justifyContent: "space-around", padding: "10px 6px 14px", borderTop: `1px solid ${T.gold}44`,
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, color: isActive ? T.gold : "#7C8BA8", padding: "2px 6px",
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span style={{ fontFamily: "Inter", fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
