import { useState, useRef, useCallback, useEffect } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
getFirestore, collection, doc, addDoc, deleteDoc,
onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyAVBE498bjM3pnhp1iId6wMiDY37zUSM2M",
authDomain: "our-scrapbook-178bc.firebaseapp.com",
projectId: "our-scrapbook-178bc",
storageBucket: "our-scrapbook-178bc.firebasestorage.app",
messagingSenderId: "364293330102",
appId: "1:364293330102:web:bce56503ae8bdde8914217"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PEOPLE = [
{ id: "person1", label: "Me 💛", color: "#e6a817", light: "#fff8dc", textColor: "#7a5c00" },
{ id: "person2", label: "You 💙", color: "#4a90d9", light: "#dceeff", textColor: "#0a3d6e" },
];

const CATEGORIES = [
{ id: "childhood", label: "Childhood Memories", emoji: "🧸", color: "#f5c8a0", accent: "#c97c3a" },
{ id: "teen", label: "Teen Years", emoji: "🎒", color: "#c8e6c9", accent: "#388e3c" },
{ id: "young_adult", label: "Young Adult", emoji: "🎓", color: "#b3d4f5", accent: "#1565c0" },
{ id: "trips", label: "Favourite Trips", emoji: "✈️", color: "#f8d7da", accent: "#c0392b" },
{ id: "scenic", label: "Scenic Moments", emoji: "🌅", color: "#fff3cd", accent: "#d4a017" },
{ id: "us", label: "Our Times Together", emoji: "💌", color: "#f3d7f5", accent: "#7b1fa2" },
{ id: "bucket", label: "Bucket List", emoji: "🪣", color: "#d4f5f0", accent: "#00796b" },
{ id: "food", label: "Food Adventures", emoji: "🍜", color: "#fde9cc", accent: "#e65100" },
{ id: "lovenotes", label: "Love Notes", emoji: "💝", color: "#fce4ec", accent: "#c2185b" },
];

const TAPE_COLORS = ["#ffd54f","#ff8a65","#81d4fa","#a5d6a7","#f48fb1","#ce93d8"];
const TAPE_ROTS = [-2,2,-1,1,-3,3];

function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
return new Promise(resolve => {
const img = new Image();
img.onload = () => {
const canvas = document.createElement("canvas");
const ratio = Math.min(1, maxWidth / img.width);
canvas.width = img.width * ratio;
canvas.height = img.height * ratio;
canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
resolve(canvas.toDataURL("image/jpeg", quality));
};
img.src = dataUrl;
});
}

function TapeStrip({ index = 0 }) {
return (
<div style={{
position:"absolute", top:-10, left:"50%",
transform:`translateX(-50%) rotate(${TAPE_ROTS[index%6]}deg)`,
width:48, height:18, background:TAPE_COLORS[index%6],
opacity:.75, borderRadius:2, zIndex:2,
boxShadow:"0 1px 3px rgba(0,0,0,.15)",
}}/>
);
}

function PersonBadge({ personId, small }) {
const p = PEOPLE.find(p => p.id === personId);
if (!p) return null;
return (
<span style={{
display:"inline-flex", alignItems:"center",
background:p.light, border:`1.5px solid ${p.color}`,
borderRadius:20, padding: small ? "1px 7px" : "3px 10px",
fontFamily:"'Caveat',cursive", fontSize: small ? 11 : 13,
color:p.textColor, fontWeight:700, whiteSpace:"nowrap",
}}>{p.label}</span>
);
}

function Spinner({ color = "#d4a017" }) {
return (
<div style={{
width:18, height:18, border:`3px solid ${color}33`,
borderTop:`3px solid ${color}`,
borderRadius:"50%", animation:"spin .7s linear infinite",
display:"inline-block",
}}/>
);
}

function PhotoCard({ photo, onDelete, cardIndex }) {
const rots = [-3,2,-1,3,-2,1];
const rot = rots[cardIndex % 6];
const [hovered, setHovered] = useState(false);
return (
<div
style={{
position:"relative", display:"inline-block",
transform: hovered ? "rotate(0deg) scale(1.06)" : `rotate(${rot}deg)`,
transition:"transform .2s ease",
margin:"14px 10px", zIndex: hovered ? 10 : 1,
}}
onMouseEnter={()=>setHovered(true)}
onMouseLeave={()=>setHovered(false)}
>
<TapeStrip index={cardIndex}/>
<div style={{
background:"#fffef5", padding:"10px 10px 30px",
boxShadow:"2px 4px 14px rgba(0,0,0,.22)",
border:"1px solid #e8e2d4", borderRadius:2,
minWidth:130, maxWidth:185,
}}>
<img src={photo.url} alt={photo.caption||"photo"}
style={{width:"100%",height:140,objectFit:"cover",display:"block",borderRadius:1}}/>
{photo.caption && (
<div style={{
marginTop:5, fontFamily:"'Caveat',cursive",
fontSize:13, color:"#6b5c4a", textAlign:"center", lineHeight:1.3,
}}>{photo.caption}</div>
)}
{photo.addedBy && (
<div style={{marginTop:5,textAlign:"center"}}>
<PersonBadge personId={photo.addedBy} small/>
</div>
)}
</div>
<button onClick={()=>onDelete(photo.id)} style={{
position:"absolute", top:4, right:4,
background:"rgba(0,0,0,.55)", color:"#fff",
border:"none", borderRadius:"50%",
width:20, height:20, fontSize:12,
cursor:"pointer", zIndex:10,
display:"flex", alignItems:"center", justifyContent:"center",
}}>×</button>
</div>
);
}

function DualNotes({ catId, notes, onNoteChange, accent }) {
return (
<div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
{PEOPLE.map(person => (
<div key={person.id} style={{
background:"rgba(255,255,255,.75)",
border:`1.5px solid ${person.color}`,
borderRadius:8, padding:"14px 16px",
boxShadow:"1px 2px 8px rgba(0,0,0,.07)",
position:"relative",
}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
<PersonBadge personId={person.id}/>
<span style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:10, color:accent,
letterSpacing:2, textTransform:"uppercase",
}}>notes</span>
</div>
<textarea
value={(notes[person.id])||""}
onChange={e=>onNoteChange(catId, person.id, e.target.value)}
placeholder={person.id==="person1"
? "Your thoughts on these memories..."
: "Their thoughts on these memories..."}
style={{
width:"100%", minHeight:72,
border:"none", background:"transparent",
fontFamily:"'Caveat',cursive", fontSize:16,
color:"#3d2b1f", resize:"vertical",
outline:"none", lineHeight:1.7, boxSizing:"border-box",
}}
/>
</div>
))}
</div>
);
}

function LoveNotesPage({ notes, onNoteChange }) {
const cat = CATEGORIES.find(c=>c.id==="lovenotes");
const catNotes = notes["lovenotes"] || {};
return (
<div style={{
minHeight:"100%",
background:`radial-gradient(ellipse at 70% 20%, ${cat.color}88 0%, transparent 60%),
radial-gradient(ellipse at 20% 80%, ${cat.accent}22 0%, transparent 50%), #fdf8f0`,
borderRadius:4, padding:"32px 28px 40px", fontFamily:"Georgia,serif",
}}>
<div style={{textAlign:"center",marginBottom:28}}>
<div style={{fontSize:44,marginBottom:6}}>💝</div>
<h2 style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:26, color:"#3d2b1f", margin:0, letterSpacing:1, fontWeight:700,
}}>Love Notes</h2>
<div style={{
height:2, width:80,
background:`linear-gradient(90deg,transparent,${cat.accent},transparent)`,
margin:"10px auto 0", borderRadius:2,
}}/>
<p style={{
fontFamily:"'Caveat',cursive", fontSize:16,
color:"#8a7a6a", margin:"12px 0 0", lineHeight:1.6,
}}>A space just for words — little love letters across the distance 💌</p>
</div>
<div style={{marginBottom:20}}>
<DualNotes catId="lovenotes" notes={catNotes} onNoteChange={onNoteChange} accent={cat.accent}/>
</div>
<div style={{
background:"rgba(255,255,255,.7)",
border:`1.5px dashed ${cat.accent}88`,
borderRadius:8, padding:"18px 20px",
}}>
<div style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:11, color:cat.accent,
letterSpacing:2, textTransform:"uppercase", marginBottom:10,
}}>📜 Our Letter to Each Other</div>
<textarea
value={catNotes["letter"]||""}
onChange={e=>onNoteChange("lovenotes","letter",e.target.value)}
placeholder="Dear you... / Dear me... write something from the heart ❤️"
style={{
width:"100%", minHeight:130,
border:"none", background:"transparent",
fontFamily:"'Caveat',cursive", fontSize:18,
color:"#3d2b1f", resize:"vertical",
outline:"none", lineHeight:1.9, boxSizing:"border-box",
}}
/>
</div>
</div>
);
}

function CategoryPage({ category, photos, notes, onAddPhoto, onDeletePhoto, onNoteChange }) {
const [caption, setCaption] = useState("");
const [preview, setPreview] = useState(null);
const [dragging, setDragging] = useState(false);
const [addedBy, setAddedBy] = useState("person1");
const [compressing, setCompressing] = useState(false);
const fileRef = useRef();

const processFile = useCallback(async file => {
if (!file || !file.type.startsWith("image/")) return;
setCompressing(true);
const r = new FileReader();
r.onload = async e => {
const compressed = await compressImage(e.target.result);
setPreview({ url: compressed });
setCompressing(false);
};
r.readAsDataURL(file);
}, []);

if (category.id === "lovenotes") {
return <LoveNotesPage notes={notes} onNoteChange={onNoteChange}/>;
}

const catNotes = notes[category.id] || {};

return (
<div style={{
minHeight:"100%",
background:`radial-gradient(ellipse at 70% 20%, ${category.color}55 0%, transparent 60%),
radial-gradient(ellipse at 20% 80%, ${category.accent}22 0%, transparent 50%), #fdf8f0`,
borderRadius:4, padding:"32px 28px 40px",
position:"relative", fontFamily:"Georgia,serif",
}}>
<div style={{textAlign:"center",marginBottom:28}}>
<div style={{fontSize:40,marginBottom:4}}>{category.emoji}</div>
<h2 style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:26, color:"#3d2b1f", margin:0, letterSpacing:1, fontWeight:700,
}}>{category.label}</h2>
<div style={{
height:2, width:80,
background:`linear-gradient(90deg,transparent,${category.accent},transparent)`,
margin:"10px auto 0", borderRadius:2,
}}/>
</div>

<div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",minHeight:80,marginBottom:20}}>
{photos.length === 0 && (
<div style={{
color:"#b0a090", fontFamily:"'Caveat',cursive",
fontSize:18, padding:"30px 0",
textAlign:"center", width:"100%", opacity:.7,
}}>No photos yet — add your first memory ✨</div>
)}
{photos.map((photo,i) => (
<PhotoCard key={photo.id} photo={photo} onDelete={onDeletePhoto} cardIndex={i}/>
))}
</div>

<div
style={{
border:`2px dashed ${dragging ? category.accent : "#c8bdb0"}`,
borderRadius:8, padding:20, marginBottom:20,
background: dragging ? `${category.color}55` : "rgba(255,255,255,.6)",
transition:"all .2s", textAlign:"center",
}}
onDragOver={e=>{e.preventDefault();setDragging(true);}}
onDragLeave={()=>setDragging(false)}
onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}}
>
{compressing ? (
<div style={{fontFamily:"'Caveat',cursive",fontSize:16,color:"#8a7a6a",display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
<Spinner/> Compressing photo...
</div>
) : preview ? (
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
<img src={preview.url} alt="preview"
style={{height:100,maxWidth:200,objectFit:"cover",
borderRadius:4,boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}/>
<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
<span style={{fontFamily:"'Caveat',cursive",fontSize:14,color:"#8a7a6a"}}>Adding as:</span>
{PEOPLE.map(p => (
<button key={p.id} onClick={()=>setAddedBy(p.id)} style={{
background: addedBy===p.id ? p.color : "transparent",
border:`2px solid ${p.color}`,
borderRadius:20, padding:"3px 12px",
fontFamily:"'Caveat',cursive", fontSize:14,
color: addedBy===p.id ? "#fff" : p.textColor,
cursor:"pointer", fontWeight: addedBy===p.id ? 700:400,
transition:"all .15s",
}}>{p.label}</button>
))}
</div>
<input type="text"
placeholder="Add a little caption... ✍️"
value={caption}
onChange={e=>setCaption(e.target.value)}
style={{
fontFamily:"'Caveat',cursive", fontSize:16,
border:"none", borderBottom:`2px solid ${category.accent}`,
background:"transparent", textAlign:"center",
outline:"none", width:240, color:"#3d2b1f", padding:"4px 0",
}}
/>
<div style={{display:"flex",gap:10,marginTop:4}}>
<button onClick={()=>{
onAddPhoto({url:preview.url,caption,addedBy});
setPreview(null);setCaption("");setAddedBy("person1");
}} style={{
background:category.accent, color:"#fff",
border:"none", borderRadius:20, padding:"6px 20px",
fontFamily:"'Caveat',cursive", fontSize:16,
cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,.2)",
}}>Stick it in! 📌</button>
<button onClick={()=>{setPreview(null);setCaption("");}} style={{
background:"transparent", color:"#888",
border:"1px solid #ccc", borderRadius:20, padding:"6px 16px",
fontFamily:"'Caveat',cursive", fontSize:14, cursor:"pointer",
}}>Cancel</button>
</div>
</div>
) : (
<div>
<div style={{fontSize:28,marginBottom:6}}>📷</div>
<div style={{fontFamily:"'Caveat',cursive",fontSize:17,color:"#8a7a6a",marginBottom:10}}>
Drag & drop a photo here, or
</div>
<button onClick={()=>fileRef.current.click()} style={{
background:category.accent, color:"#fff",
border:"none", borderRadius:20, padding:"7px 22px",
fontFamily:"'Caveat',cursive", fontSize:16,
cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.15)",
}}>Browse photos</button>
<input ref={fileRef} type="file" accept="image/*"
style={{display:"none"}}
onChange={e=>{processFile(e.target.files[0]);e.target.value="";}}/>
</div>
)}
</div>

<div style={{
background:"rgba(255,255,255,.55)",
borderRadius:8, border:`1px solid ${category.color}`,
padding:"16px 18px", boxShadow:"1px 2px 8px rgba(0,0,0,.07)",
}}>
<div style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:11, color:category.accent,
letterSpacing:2, textTransform:"uppercase", marginBottom:12,
}}>💬 Our Notes</div>
<DualNotes catId={category.id} notes={catNotes} onNoteChange={onNoteChange} accent={category.accent}/>
</div>
</div>
);
}

function Cover({ onOpen }) {
return (
<div style={{
minHeight:"100vh",
background:"linear-gradient(135deg,#3d2b1f 0%,#6b4c35 40%,#3d2b1f 100%)",
display:"flex", alignItems:"center", justifyContent:"center",
fontFamily:"Georgia,serif", position:"relative", overflow:"hidden",
}}>
<div style={{
position:"absolute", inset:0,
backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,.02) 30px,rgba(255,255,255,.02) 31px)",
pointerEvents:"none",
}}/>
{[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
<div key={i} style={{
position:"absolute",[v]:32,[h]:32,width:44,height:44,
borderTop: v==="top" ?"2px solid #d4a017":"none",
borderBottom: v==="bottom" ?"2px solid #d4a017":"none",
borderLeft: h==="left" ?"2px solid #d4a017":"none",
borderRight: h==="right" ?"2px solid #d4a017":"none",
opacity:.6,
}}/>
))}
<div style={{textAlign:"center",padding:40,maxWidth:500}}>
<div style={{fontSize:62,marginBottom:16}}>📖</div>
<div style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:12, color:"#d4a017",
letterSpacing:6, textTransform:"uppercase", marginBottom:12,
}}>Our Story</div>
<h1 style={{
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:46, color:"#fdf8f0", margin:"0 0 8px",
letterSpacing:2, fontWeight:700, lineHeight:1.15,
}}>The Scrapbook</h1>
<p style={{
fontFamily:"'Caveat',cursive", fontSize:20,
color:"#e8d5b0", margin:"12px 0 24px", lineHeight:1.5,
}}>
Every photo, every note,<br/>every moment — saved with love 💌
</p>
<div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:28}}>
{PEOPLE.map(p=>(
<div key={p.id} style={{
background:"rgba(255,255,255,.1)",
border:`1.5px solid ${p.color}`,
borderRadius:20, padding:"5px 18px",
fontFamily:"'Caveat',cursive", fontSize:17, color:p.color,
}}>{p.label}</div>
))}
</div>
<button onClick={onOpen} style={{
background:"linear-gradient(135deg,#d4a017,#f5c842)",
color:"#3d2b1f", border:"none",
borderRadius:30, padding:"14px 44px",
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:18, fontWeight:700, cursor:"pointer",
letterSpacing:1, boxShadow:"0 4px 20px rgba(212,160,23,.4)",
}}>Open the Scrapbook ✨</button>
<div style={{
marginTop:20, fontFamily:"'Caveat',cursive",
fontSize:14, color:"#a08060",
}}>🔴 Live — changes sync instantly for both of you</div>
</div>
</div>
);
}

export default function Scrapbook() {
const [coverOpen, setCoverOpen] = useState(true);
const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
const [photos, setPhotos] = useState({});
const [notes, setNotes] = useState({});
const [saving, setSaving] = useState(false);
const noteTimers = useRef({});

useEffect(() => {
const unsub = onSnapshot(collection(db, "photos"), snapshot => {
const byCategory = {};
snapshot.forEach(d => {
const data = { id: d.id, ...d.data() };
if (!byCategory[data.category]) byCategory[data.category] = [];
byCategory[data.category].push(data);
});
Object.keys(byCategory).forEach(k =>
byCategory[k].sort((a,b) => (a.createdAt||0) - (b.createdAt||0))
);
setPhotos(byCategory);
});
return () => unsub();
}, []);

useEffect(() => {
const unsub = onSnapshot(collection(db, "notes"), snapshot => {
const n = {};
snapshot.forEach(d => { n[d.id] = d.data(); });
setNotes(n);
});
return () => unsub();
}, []);

const handleAddPhoto = async (catId, { url, caption, addedBy }) => {
setSaving(true);
try {
await addDoc(collection(db, "photos"), {
category: catId, url, caption, addedBy,
createdAt: Date.now(),
});
} catch(e) { console.error(e); }
setSaving(false);
};

const handleDeletePhoto = async (catId, photoId) => {
try { await deleteDoc(doc(db, "photos", photoId)); }
catch(e) { console.error(e); }
};

const handleNoteChange = useCallback((catId, personKey, val) => {
setNotes(prev => ({
...prev,
[catId]: { ...(prev[catId]||{}), [personKey]: val },
}));
const key = `${catId}_${personKey}`;
clearTimeout(noteTimers.current[key]);
noteTimers.current[key] = setTimeout(async () => {
setSaving(true);
try {
await setDoc(doc(db, "notes", catId),
{ [personKey]: val },
{ merge: true }
);
} catch(e) { console.error(e); }
setSaving(false);
}, 800);
}, []);

const activeCat = CATEGORIES.find(c => c.id === activeTab);

if (coverOpen) return <Cover onOpen={()=>setCoverOpen(false)}/>;

return (
<div style={{ minHeight:"100vh", background:"#2a1f14", display:"flex", flexDirection:"column" }}>
<div style={{
background:"linear-gradient(90deg,#3d2b1f,#5a3e2b,#3d2b1f)",
borderBottom:"2px solid #6b4c35",
padding:"10px 20px",
display:"flex", alignItems:"center", justifyContent:"space-between",
}}>
<button onClick={()=>setCoverOpen(true)} style={{
background:"transparent", border:"none",
color:"#d4a017", cursor:"pointer",
fontFamily:"'Caveat',cursive", fontSize:16,
}}>← Cover</button>
<div style={{
fontFamily:"'Playfair Display',Georgia,serif",
color:"#fdf8f0", fontSize:17, letterSpacing:2, fontWeight:700,
display:"flex", alignItems:"center", gap:8,
}}>
📖 Our Scrapbook
<div style={{
width:7,height:7,borderRadius:"50%",
background:"#4caf50", boxShadow:"0 0 6px #4caf50",
}}/>
</div>
<div style={{display:"flex",gap:10}}>
{PEOPLE.map(p=>(
<span key={p.id} style={{fontFamily:"'Caveat',cursive",fontSize:13,color:p.color}}>{p.label}</span>
))}
</div>
</div>

<div style={{
background:"#4a3526", borderBottom:"1px solid #6b4c35",
display:"flex", overflowX:"auto", padding:"0 8px", gap:2,
scrollbarWidth:"none",
}}>
{CATEGORIES.map(cat => {
const count = (photos[cat.id]||[]).length;
const isActive = activeTab === cat.id;
return (
<button key={cat.id} onClick={()=>setActiveTab(cat.id)} style={{
background: isActive ? cat.color : "transparent",
border:"none", borderRadius:"6px 6px 0 0",
padding:"9px 13px 7px", cursor:"pointer",
fontFamily:"'Caveat',cursive", fontSize:14,
color: isActive ? "#3d2b1f" : "#c8a87a",
whiteSpace:"nowrap", transition:"all .2s",
display:"flex", alignItems:"center", gap:4,
borderBottom: isActive ? `3px solid ${cat.accent}` : "3px solid transparent",
marginBottom:-1, fontWeight: isActive ? 700:400,
}}>
<span>{cat.emoji}</span>
{count > 0 && (
<span style={{
background:cat.accent, color:"#fff",
borderRadius:10, padding:"1px 5px",
fontSize:10, fontWeight:700,
}}>{count}</span>
)}
</button>
);
})}
</div>

<div style={{
background:"#3a2a1c", padding:"5px 20px",
fontFamily:"'Playfair Display',Georgia,serif",
fontSize:12, color:"#c8a87a", letterSpacing:2,
borderBottom:"1px solid #5a3e2b",
display:"flex", alignItems:"center", justifyContent:"space-between",
}}>
<span>{activeCat.emoji} {activeCat.label}</span>
{saving && <span style={{fontFamily:"'Caveat',cursive",fontSize:13,color:"#d4a017",display:"flex",alignItems:"center",gap:6}}><Spinner color="#d4a017"/> saving...</span>}
</div>

<div style={{flex:1, padding:"20px 16px 40px", maxWidth:840, width:"100%", margin:"0 auto", boxSizing:"border-box"}}>
<CategoryPage
key={activeTab}
category={activeCat}
photos={photos[activeTab]||[]}
notes={notes}
onAddPhoto={photo=>handleAddPhoto(activeTab, photo)}
onDeletePhoto={id=>handleDeletePhoto(activeTab, id)}
onNoteChange={handleNoteChange}
/>
</div>

<div style={{textAlign:"center", padding:"10px 0 20px", fontFamily:"'Caveat',cursive", fontSize:13, color:"#6b5c4a"}}>
made with love 💌 for the distance between us
</div>

<style>{`
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap');
::-webkit-scrollbar { display: none; }
* { box-sizing: border-box; }
@keyframes spin { to { transform: rotate(360deg); } }
`}</style>
</div>
);
}