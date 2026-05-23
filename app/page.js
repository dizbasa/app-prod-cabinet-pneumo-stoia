'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ── constants ──────────────────────────────────────────────────────
const MONTH_FULL=['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const DAYS_RO=['L','M','M','J','V','S','D']
const DAYS_FULL=['Lun','Mar','Mie','Joi','Vin','Sâm','Dum']
const ALL_HOURS=Array.from({length:19},(_,i)=>{const h=Math.floor(i/2)+8;const m=i%2===0?'00':'30';return`${h.toString().padStart(2,'0')}:${m}`})
const STATUS_COLOR={pending:'#C9A84C',approved:'#2D5A3F',rejected:'#8B3A3A',cancelled:'#999'}
const STATUS_LABEL={pending:'În așteptare',approved:'Aprobat',rejected:'Respins',cancelled:'Anulat'}
const TODAY=new Date()
const TODAYSTR=TODAY.toISOString().split('T')[0]

const ICONS={
  lungs:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M8 5C8 3.9 7.1 3 6 3C4.9 3 4 3.9 4 5V14C4 17.3 6.7 20 10 20H11V7C11 5.9 10.1 5 9 5H8Z"/><path d="M16 5C16 3.9 16.9 3 18 3C19.1 3 20 3.9 20 5V14C20 17.3 17.3 20 14 20H13V7C13 5.9 13.9 5 15 5H16Z"/><path d="M11 9H13"/></svg>,
  heart:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M20.8 4.6C18.2 2 14 2.5 12 5.5C10 2.5 5.8 2 3.2 4.6C0.6 7.2 1 11.5 3.5 14L12 22.5L20.5 14C23 11.5 23.4 7.2 20.8 4.6Z"/></svg>,
  brain:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M9 3.5C7.5 2.5 5 3 4 5C3 7 4 9 5 10C4 11 3 13 4.5 14.5C4 15.5 4 17 5.5 18C6 19.5 8 20.5 10 20V4.5"/><path d="M15 3.5C16.5 2.5 19 3 20 5C21 7 20 9 19 10C20 11 21 13 19.5 14.5C20 15.5 20 17 18.5 18C18 19.5 16 20.5 14 20V4.5"/><path d="M10 7H14M10 12H14M10 16H14"/></svg>,
  throat:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M8 3H16C16 3 17 5 17 7C17 9 16 10 16 12C16 14 17 16 17 18C17 20 16 21 12 21C8 21 7 20 7 18C7 16 8 14 8 12C8 10 7 9 7 7C7 5 8 3 8 3Z"/><path d="M9 8H15M9 12H15"/></svg>,
  xray:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8L11 12L8 16M16 8L13 12L16 16M11 12H13"/></svg>,
  microscope:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M10 4L8 8M14 4L16 8"/><rect x="9" y="3" width="6" height="2" rx="1"/><path d="M8 8H16L15 14H9L8 8ZM12 14V18M8 21H16M10 18H14"/></svg>,
  blood:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M12 3L6 13C6 16.9 8.7 20 12 20C15.3 20 18 16.9 18 13L12 3Z"/></svg>,
  kidney:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M12 3C9 3 7 5 7 8C7 10 8 11.5 8 13C8 15 7 17 7 19C7 21 9 22 11 21C13 20 14 18 14 16C14 14 13 13 13 11C13 9 14.5 8 16 8C17.5 8 18 6.5 17 5C16 3.5 14 3 12 3Z"/></svg>,
  bone:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M6 3C4.3 3 3 4.3 3 6C3 7.3 3.7 8.3 4.8 8.8L15.2 19.2C15.7 20.3 16.7 21 18 21C19.7 21 21 19.7 21 18C21 16.7 20.3 15.7 19.2 15.2L8.8 4.8C8.3 3.7 7.3 3 6 3Z"/><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/></svg>,
  eye:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M1 12C3 7 7 4 12 4C17 4 21 7 23 12C21 17 17 20 12 20C7 20 3 17 1 12Z"/><circle cx="12" cy="12" r="3.5"/></svg>,
  stethoscope:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M6 3C4.3 3 3 4.3 3 6V10C3 13.3 5.7 16 9 16C11.8 16 14.2 14.2 15 11.6"/><path d="M15 11.6C15.6 9.8 17.2 8.5 19 8.5C21.2 8.5 23 10.3 23 12.5C23 14.7 21.2 16.5 19 16.5"/><circle cx="19" cy="12.5" r="1.5" fill={c}/><path d="M9 3H6M12 3H9C9 3 9 6 6 6C3 6 3 3 6 3"/></svg>,
  pill:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><rect x="3" y="10" width="18" height="4" rx="2" transform="rotate(-45 3 10)"/><path d="M8.5 8.5L15.5 15.5"/></svg>,
  dna:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M6 3C6 3 8 7 12 7C16 7 18 3 18 3M6 21C6 21 8 17 12 17C16 17 18 21 18 21M7.5 9.5C7.5 9.5 9 10 12 10C15 10 16.5 9.5 16.5 9.5M7.5 14.5C7.5 14.5 9 14 12 14C15 14 16.5 14.5 16.5 14.5M8 3L7 21M16 3L17 21"/></svg>,
  liver:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M4 8C4 6 6 4 9 4C12 4 13 6 15 6C17 6 20 5 20 8C20 12 18 15 15 17C13 18 11 18 9 17C6 16 4 13 4 10V8Z"/><path d="M9 17V20M13 17.5L14 20"/></svg>,
  spine:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M12 3V21"/><rect x="9" y="5" width="6" height="3" rx="1"/><rect x="9" y="10" width="6" height="3" rx="1"/><rect x="9" y="15" width="6" height="3" rx="1"/><path d="M9 6.5H7M15 6.5H17M9 11.5H7M15 11.5H17M9 16.5H7M15 16.5H17"/></svg>,
  stomach:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M7 6C5.5 6 4 7.5 4 9.5C4 13 5 16 7 18C9 20 11 20.5 12 20.5C13 20.5 15 20 17 18C19 16 20 13 20 9.5C20 7.5 18.5 6 17 6C15.5 6 14 7 12 7C10 7 8.5 6 7 6Z"/><path d="M7 6C7 4.5 8 3.5 9 4"/></svg>,
  thyroid:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M8 6C8 6 7 8 7 11C7 14 8 16 10 17C11 17.5 12 18 12 18C12 18 13 17.5 14 17C16 16 17 14 17 11C17 8 16 6 16 6"/><path d="M8 6C9 5 11 4 12 4C13 4 15 5 16 6"/><path d="M10 17L9 21M14 17L15 21"/></svg>,
  vaccine:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><path d="M18 2L22 6M17 7L7 17M9 7L17 15M5 13L3 21L11 19L5 13ZM14 5L19 10"/></svg>,
  skin:(c='#1A3A2A')=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={c} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="6"/><path d="M8 8C8 8 9 10 12 10C15 10 16 8 16 8M7 14H17"/></svg>,
}
const ICON_KEYS=Object.keys(ICONS)

function getDays(y,m){const d=[];const f=new Date(y,m,1).getDay();const t=new Date(y,m+1,0).getDate();for(let i=0;i<(f===0?6:f-1);i++)d.push(null);for(let n=1;n<=t;n++)d.push(n);return d}

// ── helpers ────────────────────────────────────────────────────────
const Sp=({dark})=><span style={{display:'inline-block',width:12,height:12,border:`2px solid ${dark?'rgba(0,0,0,.15)':'rgba(255,255,255,.3)'}`,borderTopColor:dark?'#1A3A2A':'white',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
const Rule=()=><div style={{width:48,height:2,background:'#C9A84C',margin:'16px 0 24px'}}/>
const Lbl=({children})=><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',display:'block',marginBottom:6}}>{children}</label>
const F=({label,children,col})=><div style={{marginBottom:14,gridColumn:col}}><Lbl>{label}</Lbl>{children}</div>
const Inp=p=><input className="input-field" {...p}/>
const Sel=p=><select className="input-field" {...p}/>
const Txt=({rows=3,...p})=><textarea className="input-field" rows={rows} style={{resize:'vertical',...p.style}} {...p}/>

function SBadge({status}){return<span style={{display:'inline-block',padding:'2px 10px',background:STATUS_COLOR[status]+'22',color:STATUS_COLOR[status],border:`1px solid ${STATUS_COLOR[status]}44`,fontFamily:"'DM Sans',sans-serif",fontSize:11,borderRadius:2}}>{STATUS_LABEL[status]}</span>}
function SvcIcon({k,size=24,color='#1A3A2A'}){const fn=ICONS[k];if(!fn)return<span style={{fontSize:size}}>{k}</span>;return<span style={{color,display:'inline-flex',alignItems:'center'}}>{fn(color)}</span>}

function ColorPicker({value,onChange}){
  const p=['#2D5A3F','#4A5C3F','#3F4A5C','#5C3F3F','#5C4A3F','#3F5C5A','#6B4A8C','#8C4A4A','#4A6B8C','#2D4A6B','#6B6B3F','#8C6B3F']
  return<div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
    {p.map(c=><div key={c} onClick={()=>onChange(c)} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${value===c?'#1A3A2A':'transparent'}`,flexShrink:0}}/>)}
    <input type="color" value={value||'#2D5A3F'} onChange={e=>onChange(e.target.value)} style={{width:34,height:26,border:'1.5px solid #D5CFCA',cursor:'pointer',padding:2}}/>
  </div>
}

function AvailPicker({days,start,end,onD,onS,onE}){
  const sel=days?days.split('·').map(d=>d.trim()).filter(Boolean):[]
  const tog=d=>{const n=sel.includes(d)?sel.filter(x=>x!==d):[...sel,d];onD(n.join(' · '))}
  const hrs=Array.from({length:19},(_,i)=>{const h=Math.floor(i/2)+8;const m=i%2===0?'00':'30';return`${h.toString().padStart(2,'0')}:${m}`})
  return<div style={{display:'flex',flexDirection:'column',gap:10}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {DAYS_FULL.map(d=><div key={d} onClick={()=>tog(d)} style={{padding:'5px 12px',border:`1.5px solid ${sel.includes(d)?'#1A3A2A':'#D5CFCA'}`,background:sel.includes(d)?'#1A3A2A':'transparent',color:sel.includes(d)?'#F5F0E8':'#1A3A2A',fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:'pointer',borderRadius:2}}>{d}</div>)}
    </div>
    <div style={{display:'flex',gap:12}}>
      <div><Lbl>Start</Lbl><Sel style={{width:'auto'}} value={start||'09:00'} onChange={e=>onS(e.target.value)}>{hrs.map(h=><option key={h}>{h}</option>)}</Sel></div>
      <div><Lbl>Sfârșit</Lbl><Sel style={{width:'auto'}} value={end||'17:00'} onChange={e=>onE(e.target.value)}>{hrs.map(h=><option key={h}>{h}</option>)}</Sel></div>
    </div>
  </div>
}

function IconPicker({value,onChange}){
  return<div style={{display:'flex',flexWrap:'wrap',gap:8,padding:12,background:'#FDFAF5',border:'1.5px solid #D5CFCA'}}>
    {ICON_KEYS.map(k=><div key={k} onClick={()=>onChange(k)} title={k} style={{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px solid ${value===k?'#1A3A2A':'transparent'}`,background:value===k?'#F0E4C0':'transparent',borderRadius:4,color:'#1A3A2A'}}><SvcIcon k={k} size={22}/></div>)}
  </div>
}

// hCaptcha - auto-executes on mount, user just clicks the checkbox once
let _hcapWidgetId = null

function Captcha({onVerify,siteKey}){
  const ref=useRef(null)
  useEffect(()=>{
    if(typeof window==='undefined'||!siteKey)return
    let localId=null
    const render=()=>{
      if(!ref.current)return
      if(_hcapWidgetId!==null){try{window.hcaptcha.reset(_hcapWidgetId)}catch(e){};_hcapWidgetId=null}
      if(ref.current.childNodes.length>0)ref.current.innerHTML=''
      try{
        localId=window.hcaptcha.render(ref.current,{
          sitekey:siteKey,
          theme:'light',
          size:'normal',
          callback:onVerify,
          'expired-callback':()=>onVerify(''),
          'open-callback':()=>{},
        })
        _hcapWidgetId=localId
      }catch(e){console.warn('hCaptcha:',e.message)}
    }
    if(window.hcaptcha){render()}
    else{
      window.hcaptchaOnLoad=render
      if(!document.querySelector('script[src*="hcaptcha"]')){
        const s=document.createElement('script')
        s.src='https://js.hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaOnLoad'
        s.async=true;document.head.appendChild(s)
      }
    }
    return()=>{
      try{if(localId!==null&&window.hcaptcha){window.hcaptcha.reset(localId);if(_hcapWidgetId===localId)_hcapWidgetId=null}}catch(e){}
      if(ref.current)ref.current.innerHTML=''
    }
  },[siteKey])
  return<div style={{transform:'scale(0.85)',transformOrigin:'left center',margin:'-4px 0'}} ref={ref}/>
}

// Safe modal wrapper — only closes on X/Cancel, not click-outside or drag
function SafeModal({onClose,children,width=560}){
  const [mdown,setMdown]=useState(false)
  return<div
    style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'clamp(8px,4vw,24px)',paddingTop:'clamp(12px,5vw,40px)',overflowY:'auto'}}
    onMouseDown={e=>{if(e.target===e.currentTarget)setMdown(true)}}
    onMouseUp={e=>{if(e.target===e.currentTarget&&mdown){}; setMdown(false)}}
  >
    <div style={{background:'#fff',width:`min(${width}px,calc(100vw - 24px))`,maxHeight:'90dvh',overflowY:'auto',borderRadius:2,position:'relative',margin:'auto'}} onMouseDown={e=>e.stopPropagation()}>
      <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#6B7A6E',lineHeight:1,zIndex:1}}>×</button>
      <div style={{padding:32}}>{children}</div>
    </div>
  </div>
}

// Documents panel
function DocPanel({entityType,entityId,uploadedBy,canAdd=true,canDelete=true}){
  const [docs,setDocs]=useState([])
  const [uploading,setUploading]=useState(false)
  const fileRef=useRef(null)
  const load=useCallback(async()=>{
    if(!entityId)return
    const r=await fetch(`/api/documents?entity_type=${entityType}&entity_id=${entityId}`)
    const d=await r.json();setDocs(Array.isArray(d)?d:[])
  },[entityType,entityId])
  useEffect(()=>{load()},[load])

  const upload=async e=>{
    const file=e.target.files[0];if(!file)return
    setUploading(true)
    const fd=new FormData();fd.append('file',file);fd.append('entity_type',entityType);fd.append('entity_id',entityId);fd.append('uploaded_by',uploadedBy||'')
    const r=await fetch('/api/documents/upload',{method:'POST',body:fd})
    if(r.ok)await load()
    setUploading(false);e.target.value=''
  }
  const del=async doc=>{
    if(!confirm(`Ștergi "${doc.name}"?`))return
    await fetch('/api/documents',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:doc.id,file_path:doc.file_path})})
    await load()
  }
  const download=async doc=>{
    const r=await fetch(`/api/documents/url?path=${encodeURIComponent(doc.file_path)}`)
    const{url}=await r.json();window.open(url,'_blank')
  }
  const fmt=b=>b>1048576?`${(b/1048576).toFixed(1)} MB`:`${Math.round(b/1024)} KB`

  return<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1A3A2A'}}>Documente ({docs.length})</div>
      {canAdd&&<><input type="file" ref={fileRef} style={{display:'none'}} onChange={upload}/><button className="btn-outline" style={{color:'#1A3A2A',padding:'4px 12px',fontSize:11,display:'flex',alignItems:'center',gap:6}} onClick={()=>fileRef.current?.click()} disabled={uploading}>{uploading?<><Sp dark/> Se încarcă…</>:'+ Adaugă'}</button></>}
    </div>
    {docs.length===0?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',padding:'10px',background:'#F5F0E8',textAlign:'center'}}>Niciun document.</div>
    :docs.map(d=><div key={d.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'#F5F0E8',marginBottom:4,borderRadius:2}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
        <div style={{color:'#1A3A2A',fontWeight:500}}>{d.name}</div>
        <div style={{fontSize:10,color:'#6B7A6E'}}>{d.file_size?fmt(d.file_size):''} · {d.created_at?.slice(0,10)}</div>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={()=>download(d)} style={{background:'none',border:'1px solid #D5CFCA',padding:'3px 8px',cursor:'pointer',fontSize:10,color:'#1A3A2A'}}>↓</button>
        {canDelete&&<button onClick={()=>del(d)} style={{background:'none',border:'1px solid #E5A0A0',padding:'3px 8px',cursor:'pointer',fontSize:10,color:'#8B3A3A'}}>✕</button>}
      </div>
    </div>)}
  </div>
}

// Templates manager (symptom/diagnostic/treatment lists)
function TemplatesTab({type,label,canEdit,canDelete}){
  const [items,setItems]=useState([])
  const [adding,setAdding]=useState(false)
  const [form,setForm]=useState({name:'',notes:''})
  const [editId,setEditId]=useState(null)

  const load=useCallback(async()=>{
    const r=await fetch(`/api/admin/templates?type=${type}`)
    const d=await r.json();setItems(Array.isArray(d)?d:[])
  },[type])
  useEffect(()=>{load()},[load])

  const save=async()=>{
    const method=editId?'PUT':'POST'
    const body=editId?{id:editId,type,...form}:{type,...form}
    await fetch('/api/admin/templates',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    await load();setAdding(false);setEditId(null);setForm({name:'',notes:''})
  }
  const del=async id=>{if(!confirm('Ștergi?'))return;await fetch('/api/admin/templates',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});await load()}

  return<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1A3A2A'}}>{label}</div>
      {canEdit&&<button className="btn-primary" style={{padding:'6px 14px',fontSize:11}} onClick={()=>{setAdding(true);setEditId(null);setForm({name:'',notes:''})}}>+ Adaugă</button>}
    </div>
    {(adding||editId)&&<div style={{background:'#F5F0E8',border:'1px solid #E5DFD3',padding:16,marginBottom:12}}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <div style={{flex:2,minWidth:140}}><Lbl>Nume</Lbl><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
        <div style={{flex:3,minWidth:160}}><Lbl>Note/descriere</Lbl><Inp value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <button className="btn-primary" style={{padding:'8px 14px',fontSize:11}} onClick={save}>Salvează</button>
          <button className="btn-outline" style={{color:'#1A3A2A',padding:'8px 14px',fontSize:11}} onClick={()=>{setAdding(false);setEditId(null)}}>Anulează</button>
        </div>
      </div>
    </div>}
    <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
      {items.length===0?<div style={{padding:'16px',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',textAlign:'center'}}>Nicio intrare.</div>
      :items.map(it=><div key={it.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid #F0EBE0',fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
        <div><div style={{color:'#1A3A2A',fontWeight:500}}>{it.name}</div>{it.notes&&<div style={{fontSize:11,color:'#6B7A6E'}}>{it.notes}</div>}</div>
        {canEdit&&<div style={{display:'flex',gap:6}}>
          <button className="btn-outline" style={{color:'#1A3A2A',padding:'3px 8px',fontSize:10}} onClick={()=>{setEditId(it.id);setForm({name:it.name,notes:it.notes||''});setAdding(false)}}>Edit</button>
          {(canDelete!==undefined?canDelete:canEdit)&&<button className="btn-outline" style={{color:'#8B3A3A',borderColor:'#8B3A3a44',padding:'3px 8px',fontSize:10}} onClick={()=>del(it.id)}>✕</button>}
        </div>}
      </div>)}
    </div>
  </div>
}

// Visit form modal
// ── SubItemModal: add symptom / diagnostic / treatment via modal ──
function SubItemModal({type,onClose,onSave,templates,canAddToNomenclator=true}){
  const typeLabel={symptom:'Simptom',diagnostic:'Diagnostic',treatment:'Tratament'}
  const tplKey={symptom:'symptoms',diagnostic:'diagnostics',treatment:'treatments'}
  const [mode,setMode]=useState('') // '' = choose, 'template', 'manual'
  const [form,setForm]=useState({name:'',notes:''})
  const [saving,setSaving]=useState(false)

  const fromTemplate=async t=>{
    setSaving(true)
    await onSave({name:t.name,notes:t.notes||'',...(type==='symptom'?{severity:''}:type==='diagnostic'?{code:''}:{dosage:'',duration:''})})
    setSaving(false)
  }
  const saveManualAndToTemplates=async()=>{
    if(!form.name)return
    setSaving(true)
    // Save to nomenclator (templates) if it doesn't already exist
    const tplType=type==='symptom'?'symptom':type==='diagnostic'?'diagnostic':'treatment'
    const exists=templates[tplKey[type]]?.some(t=>t.name.toLowerCase()===form.name.toLowerCase())
    if(!exists){
      try{
        await fetch('/api/admin/templates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:tplType,name:form.name,notes:form.notes||''})})
      }catch(e){console.error('Template save error',e)}
    }
    await onSave(form)
    setSaving(false)
  }
  const saveManual=async()=>{
    if(!form.name)return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const tpls=templates[tplKey[type]]||[]

  return<SafeModal onClose={onClose} width={520}>
    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1A3A2A',marginBottom:20}}>Adaugă {typeLabel[type]}</div>

    {tpls.length>0&&<>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:10}}>Alege din listă</div>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:20}}>
        {tpls.map(t=><div key={t.id} onClick={()=>fromTemplate(t)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#F5F0E8',border:'1px solid #E5DFD3',cursor:'pointer',borderRadius:2}}>
          <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1A3A2A'}}>{t.name}</div>{t.notes&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>{t.notes}</div>}</div>
          <span style={{color:'#4A8C5C',fontSize:18}}>+</span>
        </div>)}
      </div>
      <div style={{borderBottom:'1px solid #E5DFD3',marginBottom:20}}/>
    </>}

    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:10}}>Adaugă manual</div>
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div><Lbl>Nume *</Lbl><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
      {type==='symptom'&&<div><Lbl>Severitate</Lbl><Inp placeholder="ușor / moderat / sever" value={form.severity||''} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}/></div>}
      {type==='diagnostic'&&<div><Lbl>Cod ICD</Lbl><Inp value={form.code||''} onChange={e=>setForm(p=>({...p,code:e.target.value}))}/></div>}
      {type==='treatment'&&<><div><Lbl>Doză</Lbl><Inp value={form.dosage||''} onChange={e=>setForm(p=>({...p,dosage:e.target.value}))}/></div><div><Lbl>Durată</Lbl><Inp value={form.duration||''} onChange={e=>setForm(p=>({...p,duration:e.target.value}))}/></div></>}
      <div><Lbl>Note</Lbl><Inp value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn-primary" style={{display:'flex',alignItems:'center',gap:8}} onClick={saveManualAndToTemplates} disabled={!form.name||saving}>{saving?<><Sp/> Salvează…</>:'Adaugă'}</button>
        <button className="btn-outline" style={{color:'#1A3A2A'}} onClick={onClose}>Anulează</button>
      </div>
    </div>
  </SafeModal>
}

// ── VisitCard: expanded view shows all info without tabs ──────────
function VisitCard({visit,canWrite,medics,services,onDelete,onRefresh,templates}){
  const [subModal,setSubModal]=useState(null) // {type:'symptom'|'diagnostic'|'treatment'|'service'}
  const [docs,setDocs]=useState([])
  const [docsLoaded,setDocsLoaded]=useState(false)
  const fileRef=useRef(null)
  const [uploading,setUploading]=useState(false)

  const loadDocs=useCallback(async()=>{
    const r=await fetch(`/api/documents?entity_type=visit&entity_id=${visit.id}`)
    const d=await r.json();setDocs(Array.isArray(d)?d:[]);setDocsLoaded(true)
  },[visit.id])

  useEffect(()=>{loadDocs()},[loadDocs])

  const addSubItem=async(type,data)=>{
    const urls={symptom:'/api/visits/symptoms',diagnostic:'/api/visits/diagnostics',treatment:'/api/visits/treatments'}
    await fetch(urls[type],{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:visit.id,...data})})
    setSubModal(null);onRefresh()
  }
  const addService=async svcId=>{
    const s=services.find(x=>x.id===svcId)
    await fetch('/api/visits/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:visit.id,service_id:svcId,service_name:s?.name||''})})
    onRefresh()
  }
  const delSub=async(type,id)=>{
    const urls={symptoms:'/api/visits/symptoms',diagnostics:'/api/visits/diagnostics',treatments:'/api/visits/treatments',services:'/api/visits/services'}
    await fetch(urls[type],{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});onRefresh()
  }
  const uploadDoc=async e=>{
    const file=e.target.files[0];if(!file)return
    setUploading(true)
    const fd=new FormData();fd.append('file',file);fd.append('entity_type','visit');fd.append('entity_id',visit.id);fd.append('uploaded_by','staff')
    await fetch('/api/documents/upload',{method:'POST',body:fd})
    await loadDocs();setUploading(false);e.target.value=''
  }
  const delDoc=async doc=>{
    if(!confirm(`Ștergi "${doc.name}"?`))return
    await fetch('/api/documents',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:doc.id,file_path:doc.file_path})})
    await loadDocs()
  }
  const downloadDoc=async doc=>{
    const r=await fetch(`/api/documents/url?path=${encodeURIComponent(doc.file_path)}`)
    const{url}=await r.json();window.open(url,'_blank')
  }
  const fmt=b=>b>1048576?`${(b/1048576).toFixed(1)} MB`:`${Math.round(b/1024)} KB`

  const Section=({title,color,children,onAdd,addLabel})=><div style={{marginBottom:20}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:`3px solid ${color}`,paddingLeft:8}}>{title}</div>
      {canWrite&&onAdd&&<button onClick={onAdd} style={{background:'none',border:`1px solid ${color}`,padding:'3px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color,borderRadius:2}}>{addLabel||'+ Adaugă'}</button>}
    </div>
    {children}
  </div>

  const Chip=({label,sub,onDel})=><div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#fff',border:'1px solid #E5DFD3',marginBottom:6,borderRadius:2}}>
    <div style={{flex:1}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#1A3A2A',fontWeight:500}}>{label}</div>
      {sub&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E',marginTop:2}}>{sub}</div>}
    </div>
    {canWrite&&onDel&&<button onClick={onDel} style={{background:'none',border:'none',cursor:'pointer',color:'#8B3A3A',fontSize:16,flexShrink:0,padding:'0 2px'}}>×</button>}
  </div>

  const v=visit

  return<>
    {subModal&&<SubItemModal type={subModal} onClose={()=>setSubModal(null)} onSave={data=>addSubItem(subModal,data)} templates={templates}/>}
    <input type="file" ref={fileRef} style={{display:'none'}} onChange={uploadDoc}/>

    <div style={{padding:'20px 24px'}}>
      {/* Header info */}
      <div style={{display:'flex',gap:20,alignItems:'flex-start',marginBottom:20,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:4}}>Medic</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:'#1A3A2A',fontWeight:500}}>{v.medic_name||'—'}</div>
        </div>
        {v.notes&&<div style={{flex:2,minWidth:200}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:4}}>Note generale</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',fontStyle:'italic'}}>{v.notes}</div>
        </div>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:0}}>
        {/* Left column */}
        <div style={{paddingRight:20,borderRight:'1px solid #F0EBE0'}}>
          {/* Symptoms */}
          <Section title="Simptome" color="#C9A84C" onAdd={()=>setSubModal('symptom')} addLabel="+ Simptom">
            {v.symptoms?.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>Niciun simptom.</div>}
            {v.symptoms?.map(s=><Chip key={s.id} label={s.name} sub={[s.severity,s.notes].filter(Boolean).join(' · ')} onDel={()=>delSub('symptoms',s.id)}/>)}
          </Section>
          {/* Diagnostics */}
          <Section title="Diagnostice" color="#2D5A3F" onAdd={()=>setSubModal('diagnostic')} addLabel="+ Diagnostic">
            {v.diagnostics?.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>Niciun diagnostic.</div>}
            {v.diagnostics?.map(d=><Chip key={d.id} label={d.name} sub={[d.code&&`Cod: ${d.code}`,d.notes].filter(Boolean).join(' · ')} onDel={()=>delSub('diagnostics',d.id)}/>)}
          </Section>
        </div>

        {/* Right column */}
        <div style={{paddingLeft:20}}>
          {/* Treatments */}
          <Section title="Tratamente" color="#3F4A5C" onAdd={()=>setSubModal('treatment')} addLabel="+ Tratament">
            {v.treatments?.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>Niciun tratament.</div>}
            {v.treatments?.map(t=><Chip key={t.id} label={t.name} sub={[t.dosage,t.duration,t.notes].filter(Boolean).join(' · ')} onDel={()=>delSub('treatments',t.id)}/>)}
          </Section>

          {/* Services */}
          <Section title="Servicii" color="#4A5C3F">
            {v.services?.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>Niciun serviciu.</div>}
            {v.services?.map(s=><Chip key={s.id} label={s.service_name||'—'} onDel={()=>delSub('services',s.id)}/>)}
            {canWrite&&<div style={{marginTop:8}}>
              <Sel style={{fontSize:12}} value="" onChange={e=>{if(e.target.value)addService(e.target.value)}}>
                <option value="">+ Adaugă serviciu…</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </Sel>
            </div>}
          </Section>
        </div>
      </div>

      {/* Documents — full width */}
      <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid #F0EBE0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:'3px solid #5C4A3F',paddingLeft:8}}>Documente ({docs.length})</div>
          {canWrite&&<button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{background:'none',border:'1px solid #5C4A3F',padding:'3px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#5C4A3F',borderRadius:2,display:'flex',alignItems:'center',gap:5}}>
            {uploading?<><Sp dark/> Se încarcă…</>:'+ Document'}
          </button>}
        </div>
        {docs.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>Niciun document atașat.</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
          {docs.map(d=><div key={d.id} style={{background:'#fff',border:'1px solid #E5DFD3',padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:2}}>
            <div style={{minWidth:0,marginRight:8}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:'#1A3A2A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#6B7A6E'}}>{d.file_size?fmt(d.file_size):''}</div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              <button onClick={()=>downloadDoc(d)} style={{background:'none',border:'1px solid #D5CFCA',padding:'3px 7px',cursor:'pointer',fontSize:10,color:'#1A3A2A'}}>↓</button>
              {canWrite&&<button onClick={()=>delDoc(d)} style={{background:'none',border:'1px solid #E5A0A0',padding:'3px 7px',cursor:'pointer',fontSize:10,color:'#8B3A3A'}}>✕</button>}
            </div>
          </div>)}
        </div>
      </div>

      {canWrite&&<div style={{marginTop:16,display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={()=>onDelete(v.id)} style={{background:'none',border:'1px solid #E5A0A0',padding:'5px 14px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#8B3A3A',borderRadius:2}}>Șterge vizita</button>
      </div>}
    </div>
  </>
}

// ── VisitModal: create new visit with all sub-items at once ───────
function VisitModal({patient,medics,services,currentMedicId,prefillDate,onClose,onSaved,canEditTemplates=false}){
  const [form,setForm]=useState({visit_date:prefillDate||TODAYSTR,notes:'',medic_id:currentMedicId||''})
  const [symptoms,setSymptoms]=useState([])
  const [diagnostics,setDiagnostics]=useState([])
  const [treatments,setTreatments]=useState([])
  const [visitServices,setVisitServices]=useState([])
  const [templates,setTemplates]=useState({symptoms:[],diagnostics:[],treatments:[]})
  const [saving,setSaving]=useState(false)
  const [subModal,setSubModal]=useState(null)

  useEffect(()=>{
    const load=async()=>{
      const[s,d,t]=await Promise.all([
        fetch('/api/admin/templates?type=symptom').then(r=>r.json()),
        fetch('/api/admin/templates?type=diagnostic').then(r=>r.json()),
        fetch('/api/admin/templates?type=treatment').then(r=>r.json()),
      ])
      setTemplates({symptoms:Array.isArray(s)?s:[],diagnostics:Array.isArray(d)?d:[],treatments:Array.isArray(t)?t:[]})
    }
    load()
  },[])

  const addSub=(type,data)=>{
    const k=Date.now()
    if(type==='symptom')setSymptoms(p=>[...p,{...data,_key:k}])
    if(type==='diagnostic')setDiagnostics(p=>[...p,{...data,_key:k}])
    if(type==='treatment')setTreatments(p=>[...p,{...data,_key:k}])
    setSubModal(null)
  }
  const rem=(type,key)=>{
    if(type==='symptoms')setSymptoms(p=>p.filter(x=>x._key!==key))
    if(type==='diagnostics')setDiagnostics(p=>p.filter(x=>x._key!==key))
    if(type==='treatments')setTreatments(p=>p.filter(x=>x._key!==key))
    if(type==='services')setVisitServices(p=>p.filter(x=>x._key!==key))
  }

  const save=async()=>{
    setSaving(true)
    const med=medics.find(m=>m.id===form.medic_id)
    const vr=await fetch('/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:patient.id,...form,medic_name:med?.name||''})})
    if(!vr.ok){setSaving(false);return}
    const visit=await vr.json();const vid=visit.id
    await Promise.all([
      ...symptoms.filter(s=>s.name).map(s=>fetch('/api/visits/symptoms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,name:s.name,severity:s.severity||'',notes:s.notes||''})})),
      ...diagnostics.filter(d=>d.name).map(d=>fetch('/api/visits/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,name:d.name,code:d.code||'',notes:d.notes||''})})),
      ...treatments.filter(t=>t.name).map(t=>fetch('/api/visits/treatments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,name:t.name,dosage:t.dosage||'',duration:t.duration||'',notes:t.notes||''})})),
      ...visitServices.filter(s=>s.service_id).map(s=>fetch('/api/visits/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,service_id:s.service_id,service_name:s.service_name})})),
    ])
    setSaving(false);onSaved()
  }

  const Chip2=({item,type,fields})=><div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'#fff',border:'1px solid #E5DFD3',marginBottom:5,borderRadius:2}}>
    <div style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#1A3A2A'}}>
      <span style={{fontWeight:500}}>{item.name||item.service_name}</span>
      {fields&&<span style={{color:'#6B7A6E',marginLeft:8,fontSize:11}}>{fields.filter(Boolean).join(' · ')}</span>}
    </div>
    <button onClick={()=>rem(type,item._key)} style={{background:'none',border:'none',cursor:'pointer',color:'#8B3A3A',fontSize:16}}>×</button>
  </div>

  return<SafeModal onClose={onClose} width={740}>
    {subModal&&<SubItemModal type={subModal} onClose={()=>setSubModal(null)} onSave={data=>addSub(subModal,data)} templates={templates}/>}
    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1A3A2A',marginBottom:20}}>Vizită Nouă — {patient.name}</div>

    {/* Top row */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
      <F label="Data"><Inp type="date" value={form.visit_date} onChange={e=>setForm(p=>({...p,visit_date:e.target.value}))}/></F>
      <F label="Medic"><Sel value={form.medic_id} onChange={e=>setForm(p=>({...p,medic_id:e.target.value}))}><option value="">— Alege —</option>{medics.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Sel></F>
      <F label="Note generale"><Inp value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></F>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
      {/* Symptoms */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:'3px solid #C9A84C',paddingLeft:8}}>Simptome ({symptoms.length})</div>
          <button onClick={()=>setSubModal('symptom')} style={{background:'none',border:'1px solid #C9A84C',padding:'3px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#C9A84C',borderRadius:2}}>+ Adaugă</button>
        </div>
        {symptoms.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',padding:'8px 0'}}>Niciun simptom adăugat.</div>}
        {symptoms.map(s=><Chip2 key={s._key} item={s} type="symptoms" fields={[s.severity,s.notes].filter(Boolean)}/>)}
      </div>
      {/* Diagnostics */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:'3px solid #2D5A3F',paddingLeft:8}}>Diagnostice ({diagnostics.length})</div>
          <button onClick={()=>setSubModal('diagnostic')} style={{background:'none',border:'1px solid #2D5A3F',padding:'3px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#2D5A3F',borderRadius:2}}>+ Adaugă</button>
        </div>
        {diagnostics.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',padding:'8px 0'}}>Niciun diagnostic adăugat.</div>}
        {diagnostics.map(d=><Chip2 key={d._key} item={d} type="diagnostics" fields={[d.code&&`Cod: ${d.code}`,d.notes].filter(Boolean)}/>)}
      </div>
      {/* Treatments */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:'3px solid #3F4A5C',paddingLeft:8}}>Tratamente ({treatments.length})</div>
          <button onClick={()=>setSubModal('treatment')} style={{background:'none',border:'1px solid #3F4A5C',padding:'3px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#3F4A5C',borderRadius:2}}>+ Adaugă</button>
        </div>
        {treatments.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',padding:'8px 0'}}>Niciun tratament adăugat.</div>}
        {treatments.map(t=><Chip2 key={t._key} item={t} type="treatments" fields={[t.dosage,t.duration,t.notes].filter(Boolean)}/>)}
      </div>
      {/* Services */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',borderLeft:'3px solid #4A5C3F',paddingLeft:8}}>Servicii ({visitServices.length})</div>
        </div>
        <Sel value="" onChange={e=>{if(!e.target.value)return;const s=services.find(x=>x.id===e.target.value);setVisitServices(p=>[...p,{service_id:e.target.value,service_name:s?.name||'',_key:Date.now()}])}}>
          <option value="">+ Adaugă serviciu…</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </Sel>
        {visitServices.map(s=><Chip2 key={s._key} item={s} type="services"/>)}
      </div>
    </div>

    <div style={{display:'flex',gap:10,marginTop:24}}>
      <button className="btn-primary" style={{display:'flex',alignItems:'center',gap:8}} onClick={save} disabled={saving}>{saving?<><Sp/> Salvează…</>:'Salvează Vizita'}</button>
      <button className="btn-outline" style={{color:'#1A3A2A'}} onClick={onClose}>Anulează</button>
    </div>
  </SafeModal>
}

// ── History ───────────────────────────────────────────────────────
function History({patient,medics,services,onBack,canWrite=false,currentMedicId=null,canEditTemplates=false}){
  const [visits,setVisits]=useState([])
  const [loading,setLoading]=useState(true)
  const [open,setOpen]=useState(null)
  const [showVisitModal,setShowVisitModal]=useState(false)
  const [templates,setTemplates]=useState({symptoms:[],diagnostics:[],treatments:[]})

  const load=useCallback(async()=>{
    setLoading(true)
    const r=await fetch(`/api/patient/history?patient_id=${patient.id}`)
    const d=await r.json();setVisits(Array.isArray(d)?d:[]);setLoading(false)
  },[patient.id])

  useEffect(()=>{load()},[load])
  useEffect(()=>{
    const loadTpl=async()=>{
      const[s,d,t]=await Promise.all([
        fetch('/api/admin/templates?type=symptom').then(r=>r.json()),
        fetch('/api/admin/templates?type=diagnostic').then(r=>r.json()),
        fetch('/api/admin/templates?type=treatment').then(r=>r.json()),
      ])
      setTemplates({symptoms:Array.isArray(s)?s:[],diagnostics:Array.isArray(d)?d:[],treatments:Array.isArray(t)?t:[]})
    }
    loadTpl()
  },[])

  const delVisit=async id=>{if(!confirm('Ștergi vizita și toate datele aferente?'))return;await fetch('/api/visits',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});await load()}

  return<div style={{maxWidth:940,margin:'0 auto',padding:'32px clamp(16px,5vw,40px)'}}>
    {showVisitModal&&<VisitModal patient={patient} medics={medics} services={services} currentMedicId={currentMedicId} onClose={()=>setShowVisitModal(false)} onSaved={()=>{setShowVisitModal(false);load()}} canEditTemplates={canEditTemplates}/>}

    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24,flexWrap:'wrap'}}>
      <button className="btn-outline" style={{color:'#1A3A2A',padding:'6px 16px',fontSize:12}} onClick={onBack}>← Înapoi</button>
      <div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A'}}>{patient.name}</div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E'}}>{patient.phone}{patient.email&&` · ${patient.email}`}</div>
      </div>
      {canWrite&&<button className="btn-primary" style={{marginLeft:'auto'}} onClick={()=>setShowVisitModal(true)}>+ Vizită Nouă</button>}
    </div>

    {/* Patient documents */}
    <div style={{background:'#fff',border:'1px solid #E5DFD3',padding:'16px 20px',marginBottom:20}}>
      <DocPanel entityType="patient" entityId={patient.id} uploadedBy="staff" canAdd={canWrite} canDelete={canWrite}/>
    </div>

    {loading?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:'#6B7A6E',padding:'20px 0'}}>Se încarcă…</div>
    :visits.length===0?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:'#6B7A6E',padding:'24px',background:'#fff',border:'1px solid #E5DFD3',textAlign:'center'}}>Nicio vizită înregistrată.</div>
    :visits.map(v=><div key={v.id} style={{background:'#fff',border:'1px solid #E5DFD3',marginBottom:10,borderRadius:2,overflow:'hidden'}}>
      {/* Visit header — always visible */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',cursor:'pointer',background:open===v.id?'#1A3A2A':'#fff',transition:'background .15s'}} onClick={()=>setOpen(o=>o===v.id?null:v.id)}>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:open===v.id?'#F5F0E8':'#1A3A2A'}}>{v.visit_date}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:open===v.id?'#B8D4BE':'#6B7A6E'}}>{v.medic_name||'—'}</div>
          {/* Summary badges */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {(()=>{
              const badgeData=[
                [v.symptoms?.length,'Simptome','#C9A84C'],
                [v.diagnostics?.length,'Diagnostice','#2D5A3F'],
                [v.treatments?.length,'Tratamente','#3F4A5C'],
                [v.services?.length,'Servicii','#4A5C3F'],
              ]
              // doc count loaded separately in VisitCard - show placeholder here
              const allBadges=[...badgeData.filter(([n])=>n>0)]
              if(v.doc_count>0) allBadges.push([v.doc_count,'Documente','#5C4A3F'])
              return allBadges.map(([n,l,c])=>(
                <span key={l} style={{background:open===v.id?'rgba(255,255,255,.15)':c+'18',color:open===v.id?'#F5F0E8':c,border:`1px solid ${open===v.id?'rgba(255,255,255,.2)':c+'44'}`,padding:'2px 8px',fontSize:10,fontFamily:"'DM Sans',sans-serif",borderRadius:10,whiteSpace:'nowrap'}}>{n} {l}</span>
              ))
            })()}
          </div>
        </div>
        <span style={{color:open===v.id?'#B8D4BE':'#6B7A6E',fontSize:14}}>{open===v.id?'▲':'▼'}</span>
      </div>
      {/* Expanded content */}
      {open===v.id&&<VisitCard visit={v} canWrite={canWrite} medics={medics} services={services} onDelete={delVisit} onRefresh={load} templates={templates}/>}
    </div>)}
  </div>
}

// ── MedicFlagsPanel ───────────────────────────────────────────────
const MEDIC_FLAG_STRUCTURE = [
  { cat: 'vizite', label: 'Vizite', flags: [
    { flag: 'visits_add',          label: 'Poate adăuga Vizite' },
    { flag: 'visits_delete',       label: 'Poate șterge Vizite' },
    { flag: 'symptoms_add',        label: 'Poate adăuga Simptome la Vizite' },
    { flag: 'symptoms_delete',     label: 'Poate șterge Simptome la Vizite' },
    { flag: 'diagnostics_add',     label: 'Poate adăuga Diagnostice la Vizite' },
    { flag: 'diagnostics_delete',  label: 'Poate șterge Diagnostice la Vizite' },
    { flag: 'treatments_add',      label: 'Poate adăuga Tratamente la Vizite' },
    { flag: 'treatments_delete',   label: 'Poate șterge Tratamente la Vizite' },
  ]},
  { cat: 'nomenclator', label: 'Nomenclator', flags: [
    { flag: 'nom_view',               label: 'Poate vedea Nomenclatorul' },
    { flag: 'nom_symptoms_add',       label: 'Poate adăuga Simptome în Nomenclator' },
    { flag: 'nom_symptoms_edit',      label: 'Poate edita Simptome în Nomenclator' },
    { flag: 'nom_symptoms_delete',    label: 'Poate șterge Simptome din Nomenclator' },
    { flag: 'nom_diagnostics_add',    label: 'Poate adăuga Diagnostice în Nomenclator' },
    { flag: 'nom_diagnostics_edit',   label: 'Poate edita Diagnostice în Nomenclator' },
    { flag: 'nom_diagnostics_delete', label: 'Poate șterge Diagnostice din Nomenclator' },
    { flag: 'nom_treatments_add',     label: 'Poate adăuga Tratamente în Nomenclator' },
    { flag: 'nom_treatments_edit',    label: 'Poate edita Tratamente în Nomenclator' },
    { flag: 'nom_treatments_delete',  label: 'Poate șterge Tratamente din Nomenclator' },
  ]},
  { cat: 'pacienti', label: 'Pacienți', flags: [
    { flag: 'patients_view',   label: 'Poate vedea Pacienții' },
    { flag: 'patients_add',    label: 'Poate adăuga Pacienți' },
    { flag: 'patients_edit',   label: 'Poate edita Pacienți' },
    { flag: 'patients_delete', label: 'Poate șterge Pacienți' },
  ]},
  { cat: 'programari', label: 'Programări', flags: [
    { flag: 'bookings_approve',            label: 'Poate aproba/respinge Programări' },
    { flag: 'bookings_edit',               label: 'Poate edita Programări' },
    { flag: 'bookings_delete',             label: 'Poate șterge Programări' },
    { flag: 'bookings_create_for_patient', label: 'Poate face Programări pentru un Pacient' },
    { flag: 'bookings_view_colleagues',    label: 'Poate vedea calendarul colegilor' },
  ]},
  { cat: 'documente', label: 'Documente', flags: [
    { flag: 'documents_view',   label: 'Poate vedea Documentele' },
    { flag: 'documents_add',    label: 'Poate adăuga Documente' },
    { flag: 'documents_delete', label: 'Poate șterge Documente' },
  ]},
]

function MedicFlagsPanel({ medicId, pendingFlags, onPendingChange }) {
  const [dbFlags, setDbFlags] = useState({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    if (!medicId) return
    setLoading(true)
    const r = await fetch('/api/admin/medic-flags?medic_id=' + medicId)
    const d = await r.json()
    if (Array.isArray(d)) { const m = {}; d.forEach(f => { m[f.flag] = f.enabled }); setDbFlags(m) }
    setLoading(false)
  }, [medicId])

  useEffect(() => { if (open) load() }, [open, load])

  const getVal = flag => {
    if (medicId) return dbFlags[flag] !== undefined ? dbFlags[flag] : true
    return pendingFlags ? (pendingFlags[flag] !== undefined ? pendingFlags[flag] : true) : true
  }

  const toggle = async (flag, enabled) => {
    if (medicId) {
      await fetch('/api/admin/medic-flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medic_id: medicId, flag, enabled }) })
      setDbFlags(p => ({ ...p, [flag]: enabled }))
    } else {
      onPendingChange?.({ ...(pendingFlags || {}), [flag]: enabled })
    }
  }

  const toggleGroup = (group, enabled) => group.flags.forEach(f => toggle(f.flag, enabled))
  const groupAllOn = group => group.flags.every(f => getVal(f.flag))
  const groupAllOff = group => group.flags.every(f => !getVal(f.flag))

  const Tog = ({ val, onCl }) => (
    <div onClick={onCl} style={{ width: 36, height: 20, borderRadius: 10, background: val ? '#2D5A3F' : '#CCC', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: val ? 19 : 3, transition: 'left .2s' }} />
    </div>
  )

  return (
    <div style={{ marginTop: 16, border: '1px solid #E5DFD3', borderRadius: 2, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1A3A2A', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="#C9A84C" strokeWidth="1.5"><circle cx="9" cy="9" r="7"/><path d="M9 6v3l2 2"/><path d="M6 3.5L4 1.5M12 3.5L14 1.5"/></svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#F5F0E8' }}>Permisiuni Medic</span>
          {!medicId && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: '#C9A84C', marginLeft: 4 }}>(se vor aplica după salvare)</span>}
        </div>
        <span style={{ color: '#B8D4BE', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div>
          {loading && <div style={{ padding: '12px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#6B7A6E' }}>Se incarca...</div>}
          {!loading && MEDIC_FLAG_STRUCTURE.map(group => {
            const allOn = groupAllOn(group)
            const allOff = groupAllOff(group)
            return (
              <div key={group.cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#F5F0E8', borderBottom: '1px solid #E5DFD3' }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1A3A2A', fontWeight: 600 }}>{group.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: allOn ? '#2D5A3F' : allOff ? '#8B3A3A' : '#C9A84C' }}>{allOn ? 'Toate ON' : allOff ? 'Toate OFF' : 'Partial'}</span>
                    <Tog val={allOn} onCl={() => toggleGroup(group, !allOn)} />
                  </div>
                </div>
                {group.flags.map(f => (
                  <div key={f.flag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 8px 28px', borderBottom: '1px solid #F5F0E8' }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#1A3A2A' }}>{f.label}</div>
                    <Tog val={getVal(f.flag)} onCl={() => toggle(f.flag, !getVal(f.flag))} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


const PATIENT_FLAG_STRUCTURE = [
  { cat: 'programari', label: 'Programări', flags: [
    { flag: 'bookings_create', label: 'Poate crea Programări' },
  ]},
  { cat: 'vizite', label: 'Vizite', flags: [
    { flag: 'visits_view', label: 'Poate vedea Vizitele' },
  ]},
  { cat: 'documente', label: 'Documente', flags: [
    { flag: 'documents_add', label: 'Poate adăuga Documente' },
  ]},
]

function PatientFlagsPanel({ patientId, pendingFlags, onPendingChange }) {
  const [dbFlags, setDbFlags] = useState({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    if (!patientId) return
    setLoading(true)
    const r = await fetch('/api/admin/patient-flags?patient_id=' + patientId)
    const d = await r.json()
    if (Array.isArray(d)) { const m = {}; d.forEach(f => { m[f.flag] = f.enabled }); setDbFlags(m) }
    setLoading(false)
  }, [patientId])

  useEffect(() => { if (open) load() }, [open, load])

  const getVal = flag => {
    if (patientId) return dbFlags[flag] !== undefined ? dbFlags[flag] : true
    return pendingFlags ? (pendingFlags[flag] !== undefined ? pendingFlags[flag] : true) : true
  }

  const toggle = async (flag, enabled) => {
    if (patientId) {
      await fetch('/api/admin/patient-flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: patientId, flag, enabled }) })
      setDbFlags(p => ({ ...p, [flag]: enabled }))
    } else {
      onPendingChange?.({ ...(pendingFlags || {}), [flag]: enabled })
    }
  }

  const toggleGroup = (group, enabled) => group.flags.forEach(f => toggle(f.flag, enabled))
  const groupAllOn = group => group.flags.every(f => getVal(f.flag))
  const groupAllOff = group => group.flags.every(f => !getVal(f.flag))

  const Tog = ({ val, onCl }) => (
    <div onClick={onCl} style={{ width: 36, height: 20, borderRadius: 10, background: val ? '#2D5A3F' : '#CCC', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: val ? 19 : 3, transition: 'left .2s' }} />
    </div>
  )

  return (
    <div style={{ marginTop: 16, border: '1px solid #E5DFD3', borderRadius: 2, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#3F4A5C', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="#B8D4BE" strokeWidth="1.5"><circle cx="9" cy="7" r="3.5"/><path d="M3 16c0-3.3 3.1-6 6-6s6 2.7 6 6"/></svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#F5F0E8' }}>Permisiuni Pacient</span>
          {!patientId && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: '#B8D4BE', marginLeft: 4 }}>(se vor aplica după salvare)</span>}
        </div>
        <span style={{ color: '#B8D4BE', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div>
          {loading && <div style={{ padding: '12px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#6B7A6E' }}>Se încarcă...</div>}
          {!loading && PATIENT_FLAG_STRUCTURE.map(group => {
            const allOn = groupAllOn(group)
            const allOff = groupAllOff(group)
            return (
              <div key={group.cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#F5F0E8', borderBottom: '1px solid #E5DFD3' }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1A3A2A', fontWeight: 600 }}>{group.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: allOn ? '#2D5A3F' : allOff ? '#8B3A3A' : '#C9A84C' }}>{allOn ? 'Toate ON' : allOff ? 'Toate OFF' : 'Partial'}</span>
                    <Tog val={allOn} onCl={() => toggleGroup(group, !allOn)} />
                  </div>
                </div>
                {group.flags.map(f => (
                  <div key={f.flag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 8px 28px', borderBottom: '1px solid #F5F0E8' }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#1A3A2A' }}>{f.label}</div>
                    <Tog val={getVal(f.flag)} onCl={() => toggle(f.flag, !getVal(f.flag))} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}




// CRUD Modal
function CrudModal({model,item,onClose,onSave,services=[]}){
  const [form,setForm]=useState({...item}||{})
  const [saving,setSaving]=useState(false)
  const [err,setErr]=useState('')
  const [medicSvcs,setMedicSvcs]=useState([])
  const [pendingFlags,setPendingFlags]=useState({})
  const fv=(k,v)=>setForm(p=>({...p,[k]:v}))

  useEffect(()=>{
    if(model==='medics'&&form.id){
      fetch('/api/admin/medic-services?medic_id='+form.id).then(r=>r.json()).then(d=>setMedicSvcs(Array.isArray(d)?d.map(x=>x.service_id):[]))
    }
  },[model,form.id])

  const toggleSvc=async svcId=>{
    if(!form.id)return
    if(medicSvcs.includes(svcId)){
      await fetch('/api/admin/medic-services',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({medic_id:form.id,service_id:svcId})})
      setMedicSvcs(p=>p.filter(x=>x!==svcId))
    }else{
      await fetch('/api/admin/medic-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({medic_id:form.id,service_id:svcId})})
      setMedicSvcs(p=>[...p,svcId])
    }
  }
  const doSave=async()=>{
    setSaving(true);setErr('')
    try{
      await onSave(form, { pendingFlags, pendingServices: medicSvcs })
    }catch(e){setErr(e.message)}
    setSaving(false)
  }

  return<SafeModal onClose={onClose} width={580}>
    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1A3A2A',marginBottom:20}}>{form.id?'Editează':'Adaugă'} {model==='medics'?'Medic':model==='services'?'Serviciu':'Pacient'}</div>
    {err&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:10,fontSize:13,color:'#E65100',marginBottom:12}}>{err}</div>}

    {model==='medics'&&<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
        <F label="Nume complet" col="1/-1"><Inp value={form.name||''} onChange={e=>fv('name',e.target.value)}/></F>
        <F label="Specialitate"><Inp value={form.specialty||''} onChange={e=>fv('specialty',e.target.value)}/></F>
        <F label="Experiență"><Inp value={form.experience||''} onChange={e=>fv('experience',e.target.value)} placeholder="15 ani"/></F>
        <F label="Email" col="1/-1"><Inp type="email" value={form.email||''} onChange={e=>fv('email',e.target.value)}/></F>
        <F label="Inițiale"><Inp value={form.initials||''} onChange={e=>fv('initials',e.target.value)} maxLength={3}/></F>
        <F label="Activ"><Sel value={form.active===false?'false':'true'} onChange={e=>fv('active',e.target.value==='true')}><option value="true">Da</option><option value="false">Nu</option></Sel></F>
      </div>
      <F label="Descriere"><Txt value={form.description||''} onChange={e=>fv('description',e.target.value)}/></F>
      <F label="Culoare profil"><ColorPicker value={form.color||'#2D5A3F'} onChange={v=>fv('color',v)}/></F>
      <F label="Disponibilitate"><AvailPicker days={form.availability||''} start={form.availability_start||'09:00'} end={form.availability_end||'17:00'} onD={v=>fv('availability',v)} onS={v=>fv('availability_start',v)} onE={v=>fv('availability_end',v)}/></F>
      <F label="Servicii atașate"><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{services.map(s=><div key={s.id} onClick={()=>toggleSvc(s.id)} style={{padding:'5px 12px',border:`1.5px solid ${medicSvcs.includes(s.id)?'#1A3A2A':'#D5CFCA'}`,background:medicSvcs.includes(s.id)?'#1A3A2A':'transparent',color:medicSvcs.includes(s.id)?'#F5F0E8':'#1A3A2A',fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:'pointer',borderRadius:2,display:'flex',alignItems:'center',gap:6}}><SvcIcon k={s.icon} size={14} color={medicSvcs.includes(s.id)?'#F5F0E8':'#1A3A2A'}/>{s.name}</div>)}</div></F>
      <div style={{background:'#F5F0E8',border:'1px solid #E5DFD3',padding:16,marginBottom:14}}>
        <Lbl>Parolă cont (login medic)</Lbl>
        <Inp type="password" placeholder={form.id?'Lasă gol pentru a nu schimba':'Obligatorie'} value={form.staffPassword||''} onChange={e=>fv('staffPassword',e.target.value)}/>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E',marginTop:4}}>Login cu email-ul de mai sus</div>
      </div>
      <MedicFlagsPanel medicId={form.id||null} pendingFlags={pendingFlags} onPendingChange={setPendingFlags}/>
    </>}

    {model==='services'&&<>
      <F label="Nume"><Inp value={form.name||''} onChange={e=>fv('name',e.target.value)}/></F>
      <F label="Descriere"><Txt value={form.description||''} onChange={e=>fv('description',e.target.value)}/></F>
      <F label="Icon"><IconPicker value={form.icon||''} onChange={v=>fv('icon',v)}/></F>
      <F label="Activ"><Sel value={form.active===false?'false':'true'} onChange={e=>fv('active',e.target.value==='true')}><option value="true">Da</option><option value="false">Nu</option></Sel></F>
    </>}

    {model==='patients'&&<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
        <F label="Nume complet" col="1/-1"><Inp value={form.name||''} onChange={e=>fv('name',e.target.value)}/></F>
        <F label="Email"><Inp type="email" value={form.email||''} onChange={e=>fv('email',e.target.value)}/></F>
        <F label="Telefon"><Inp type="tel" value={form.phone||''} onChange={e=>fv('phone',e.target.value)}/></F>
      </div>
      <F label="Note"><Txt value={form.notes||''} onChange={e=>fv('notes',e.target.value)}/></F>
      <div style={{background:'#F5F0E8',border:'1px solid #E5DFD3',padding:16,marginBottom:14}}>
        <Lbl>Parolă cont pacient</Lbl>
        <Inp type="password" placeholder={form.id?'Lasă gol pentru a nu schimba':'Parolă pentru login'} value={form.patientPassword||''} onChange={e=>fv('patientPassword',e.target.value)}/>
      </div>
      <PatientFlagsPanel patientId={form.id||null} pendingFlags={pendingFlags} onPendingChange={setPendingFlags}/>
    </>}

    <div style={{display:'flex',gap:10,marginTop:8}}>
      <button className="btn-primary" style={{display:'flex',alignItems:'center',gap:8}} onClick={doSave} disabled={saving}>{saving?<><Sp/> Salvează…</>:'Salvează'}</button>
      <button className="btn-outline" style={{color:'#1A3A2A'}} onClick={onClose}>Anulează</button>
    </div>
  </SafeModal>
}

// HP Editor
function HPEditor({settings,onSave}){
  const [form,setForm]=useState({...settings})
  const [saved,setSaved]=useState(false)
  useEffect(()=>setForm({...settings}),[settings])
  const save=async()=>{await onSave(form);setSaved(true);setTimeout(()=>setSaved(false),3000)}
  return<div>
    <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:'#1A3A2A',marginBottom:20}}>Editează Pagina Principală</h2>
    <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:620}}>
      {[['clinic_name','Numele Clinicii'],['clinic_subtitle','Subtitlu'],['hero_title','Titlu Hero'],['hero_subtitle','Subtitlu Hero'],['booking_section_text','Text secțiune programări'],['clinic_address','Adresă'],['clinic_phone','Telefon'],['clinic_email','Email'],['clinic_hours','Program']].map(([k,l])=>(
        <div key={k}><Lbl>{l}</Lbl>
          {['hero_subtitle','booking_section_text'].includes(k)?<Txt value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>:<Inp value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>}
        </div>
      ))}
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <button className="btn-primary" onClick={save}>Salvează</button>
        {saved&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#2D5A3F'}}>✓ Salvat!</span>}
      </div>
    </div>
  </div>
}

// Flags editor
function FlagsEditor({flags,onToggle,title='Feature Flags',subtitle=''}){
  const cats=[...new Set(flags.map(f=>f.category))]
  const catLabel={medics:'Medici',services:'Servicii',patients:'Pacienți',bookings:'Programări',homepage:'Pagina Principală',analytics:'Analize',visits:'Vizite',documents:'Documente',templates:'Șabloane (Simptome/Diagnostice/Tratamente)'}
  return<div>
    <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:'#1A3A2A',marginBottom:6}}>{title}</h2>
    {subtitle&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',marginBottom:24}}>{subtitle}</p>}
    {cats.map(cat=><div key={cat} style={{marginBottom:24}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:8}}>{catLabel[cat]||cat}</div>
      <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
        {flags.filter(f=>f.category===cat).map(f=><div key={f.flag} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #F0EBE0'}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#1A3A2A'}}>{f.label}</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:f.enabled?'#2D5A3F':'#8B3A3A'}}>{f.enabled?'ON':'OFF'}</span>
            <div onClick={()=>onToggle(f.flag,!f.enabled)} style={{width:40,height:22,borderRadius:11,background:f.enabled?'#2D5A3F':'#DDD',cursor:'pointer',position:'relative',transition:'background .2s'}}>
              <div style={{width:16,height:16,borderRadius:'50%',background:'white',position:'absolute',top:3,left:f.enabled?21:3,transition:'left .2s'}}/>
            </div>
          </div>
        </div>)}
      </div>
    </div>)}
  </div>
}

// ── BookingModal (unified: create new booking from anywhere) ──────
// Props:
//   patient: {id,name,phone,email} - prefill patient data (optional)
//   medics, bookings, user
//   preselectedMedicId: pre-select a medic
//   prefillDate, prefillTime: pre-select date/time
//   onClose, onSaved
function BookingModal({patient=null, medics, bookings=[], user, preselectedMedicId=null, prefillDate=null, prefillTime=null, onClose, onSaved}){
  const isStaff = user?.role==='medic'||user?.role==='admin'||user?.role==='master'
  const prefillDateObj = prefillDate ? new Date(prefillDate+'T12:00:00') : null

  // Calendar state
  const [calMonth, setCalMonth] = useState(prefillDateObj ? prefillDateObj.getMonth() : TODAY.getMonth())
  const calYear = TODAY.getFullYear()
  const [selDate, setSelDate] = useState(prefillDate ? parseInt(prefillDate.split('-')[2]) : null)
  const [selSlot, setSelSlot] = useState(prefillTime||'')
  const [selMedic, setSelMedic] = useState(preselectedMedicId||'')

  // Patient form
  const [patientName, setPatientName] = useState(patient?.name||'')
  const [patientPhone, setPatientPhone] = useState(patient?.phone||'')
  const [patientEmail, setPatientEmail] = useState(patient?.email||'')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const dk = selDate ? `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selDate).padStart(2,'0')}` : null

  // Available hours for selected medic/date
  const availHours = useMemo(()=>{
    if(!dk) return ALL_HOURS
    const med = selMedic ? medics.find(m=>m.id===selMedic) : medics.find(m=>m.active)
    if(!med) return ALL_HOURS
    const start = med.availability_start||'08:00'
    const end = med.availability_end||'17:00'
    const dayIdx = new Date(dk+'T12:00:00').getDay()
    const dayMap = [6,0,1,2,3,4,5]
    const dayName = DAYS_FULL[dayMap[dayIdx]]
    if(med.availability&&!med.availability.includes(dayName)) return []
    return ALL_HOURS.filter(h=>h>=start&&h<=end)
  },[dk, selMedic, medics])

  const isTaken = time => {
    const mid = selMedic||null
    if(!mid||!dk) return false
    return bookings.some(b=>b.medic_id===mid&&b.appointment_date===dk&&b.appointment_time===time&&(b.status==='approved'||b.status==='pending'))
  }

  // Status logic: own medic = pre-approved, anyone else = pending
  const isOwnMedic = user?.role==='medic' && user?.medic_id === selMedic
  const autoApprove = isOwnMedic  // admin/master always pending per spec
  const statusLabel = isStaff ? (autoApprove ? '✓ Va fi aprobată automat (propriul calendar)' : '⏳ Va necesita aprobare din partea medicului') : null

  const save = async () => {
    if(!patientName.trim()) { setErr('Introduceți numele pacientului'); return }
    if(!dk) { setErr('Selectați o dată'); return }
    if(!selSlot) { setErr('Selectați o oră'); return }
    setSaving(true); setErr('')
    try {
      const med = selMedic ? medics.find(m=>m.id===selMedic) : null
      const status = isStaff ? (autoApprove ? 'approved' : 'pending') : 'pending'
      const url = isStaff ? '/api/bookings/staff' : '/api/bookings'
      const body = {
        patient_name: patientName.trim(),
        patient_email: patientEmail||null,
        phone: patientPhone||'',
        medic_id: selMedic||null,
        medic_name: med?.name||null,
        appointment_date: dk,
        appointment_time: selSlot,
        reason: reason||null,
        status,
        ...(isStaff ? {} : { hcaptcha_token: 'staff-bypass' })
      }
      const r = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      if(!r.ok) { const e=await r.json(); throw new Error(e.error||'Eroare') }
      onSaved()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  // Day availability check for calendar
  const dayAvail = d => {
    if(!d) return false
    const date = new Date(calYear, calMonth, d)
    const dayIdx = date.getDay()
    const dayMap = [6,0,1,2,3,4,5]
    const dayName = DAYS_FULL[dayMap[dayIdx]]
    const pool = selMedic ? medics.filter(m=>m.id===selMedic) : medics.filter(m=>m.active)
    return pool.some(m=>!m.availability||m.availability.includes(dayName))
  }

  return<SafeModal onClose={onClose} width={720}>
    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1A3A2A',marginBottom:20}}>
      {patient ? `Programare pentru ${patient.name}` : 'Programare Nouă'}
    </div>
    {err&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:10,fontSize:12,color:'#E65100',marginBottom:12}}>{err}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
      {/* LEFT: Calendar */}
      <div>
        {/* Medic selector */}
        {medics.filter(m=>m.active).length>1&&<div style={{marginBottom:14}}>
          <Lbl>Medic</Lbl>
          <Sel value={selMedic} onChange={e=>{setSelMedic(e.target.value);setSelDate(null);setSelSlot('')}}>
            <option value="">— Orice medic disponibil —</option>
            {medics.filter(m=>m.active).map(m=><option key={m.id} value={m.id}>{m.name}{m.id===user?.medic_id?' (eu)':''}</option>)}
          </Sel>
        </div>}
        {/* Mini calendar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#1A3A2A',padding:'4px 8px'}} onClick={()=>setCalMonth(m=>Math.max(0,m-1))}>‹</button>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#1A3A2A'}}>{MONTH_FULL[calMonth]} {calYear}</div>
          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#1A3A2A',padding:'4px 8px'}} onClick={()=>setCalMonth(m=>Math.min(11,m+1))}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,maxWidth:252}}>
          {DAYS_RO.map((d,i)=><div key={i} style={{height:26,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#6B7A6E'}}>{d}</div>)}
          {getDays(calYear,calMonth).map((d,i)=>{
            const isP = d&&new Date(calYear,calMonth,d)<new Date(TODAY.toDateString())
            const isSel = d===selDate
            const avail = d&&!isP&&dayAvail(d)
            return<div key={i} className={`cal-day${!d?' empty':''}${isP?' past':''}${isSel?' selected':''}`}
              style={{opacity:d&&!isP&&!avail?0.35:1,cursor:d&&!isP&&avail?'pointer':'default'}}
              onClick={()=>{if(d&&!isP&&avail){setSelDate(d);setSelSlot('')}}}>{d||''}</div>
          })}
        </div>
        {/* Time slots */}
        {selDate&&<div style={{marginTop:14}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#1A3A2A',marginBottom:8}}>
            {MONTH_FULL[calMonth]} {selDate}
          </div>
          {availHours.length===0
            ?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#8B3A3A'}}>Medicul nu este disponibil în această zi.</div>
            :<div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {availHours.map(t=><div key={t}
                className={`slot${isTaken(t)?' taken':''}${selSlot===t?' selected':''}`}
                onClick={()=>{if(!isTaken(t))setSelSlot(t)}}
              >{t}</div>)}
            </div>
          }
        </div>}
      </div>

      {/* RIGHT: Patient info + details */}
      <div>
        {/* Patient info */}
        {patient ? (
          <div style={{background:'#F5F0E8',border:'1px solid #E5DFD3',padding:'12px 14px',marginBottom:14}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,textTransform:'uppercase',letterSpacing:'.1em',color:'#6B7A6E',marginBottom:4}}>Pacient</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:'#1A3A2A'}}>{patient.name}</div>
            {patient.phone&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',marginTop:2}}>{patient.phone}</div>}
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div><Lbl>Nume pacient *</Lbl><Inp value={patientName} onChange={e=>setPatientName(e.target.value)}/></div>
              <div><Lbl>Telefon</Lbl><Inp type="tel" value={patientPhone} onChange={e=>setPatientPhone(e.target.value)}/></div>
              <div><Lbl>Email</Lbl><Inp type="email" value={patientEmail} onChange={e=>setPatientEmail(e.target.value)}/></div>
            </div>
          </div>
        )}

        {/* Selected slot summary */}
        {dk&&selSlot&&<div style={{background:'#F0E4C0',border:'1px solid #DDD5B8',padding:'10px 14px',marginBottom:14}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#1A3A2A'}}>
            📅 {MONTH_FULL[calMonth]} {selDate} · ⏰ {selSlot}
            {selMedic&&medics.find(m=>m.id===selMedic)&&<span style={{marginLeft:8,color:'#6B7A6E'}}>· {medics.find(m=>m.id===selMedic)?.name}</span>}
          </div>
        </div>}

        {/* Reason */}
        <div style={{marginBottom:14}}>
          <Lbl>Motiv (opțional)</Lbl>
          <Txt rows={3} value={reason} onChange={e=>setReason(e.target.value)}/>
        </div>

        {/* Status indicator for staff */}
        {isStaff&&statusLabel&&<div style={{background:autoApprove?'#EAF5EC':'#FFF8E6',border:`1px solid ${autoApprove?'#A5D6A7':'#F0CC78'}`,padding:'8px 12px',marginBottom:14,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:autoApprove?'#2D5A3F':'#7A6020'}}>
          {statusLabel}
        </div>}

        <div style={{display:'flex',gap:10}}>
          <button className="btn-primary" style={{display:'flex',alignItems:'center',gap:8}} onClick={save} disabled={saving||!patientName||!dk||!selSlot}>
            {saving?<><Sp/> Salvează…</>:'Salvează Programarea'}
          </button>
          <button className="btn-outline" style={{color:'#1A3A2A'}} onClick={onClose}>Anulează</button>
        </div>
      </div>
    </div>
  </SafeModal>
}


// ── CalendarView ───────────────────────────────────────────────────
const CAL_HOURS = Array.from({length:11},(_,i)=>`${(i+8).toString().padStart(2,'0')}:00`)
const CAL_HALF  = Array.from({length:21},(_,i)=>{const h=Math.floor(i/2)+8;const m=i%2===0?'00':'30';return`${h.toString().padStart(2,'0')}:${m}`})

// Distinct colors for medics in calendar
const MEDIC_CAL_COLORS=['#2D5A3F','#3F4A5C','#5C3F3F','#5C4A3F','#4A5C3F','#6B4A8C','#3F5C5A','#5C5A3F']

function CalendarView({bookings,medics,user,medicFlag,canEdit,canDelete,canViewColleagues,onRefresh}){
  const today=new Date()
  const [weekOffset,setWeekOffset]=useState(0)
  // Multi-medic selection: array of medic IDs to show
  const [selectedMedics,setSelectedMedics]=useState(()=>{
    // Default: own medic if medic role, otherwise first active medic
    if(user?.medic_id)return[user.medic_id]
    const active=medics.filter(m=>m.active)
    return active.length>0?[active[0].id]:[]
  })
  const [editBooking,setEditBooking]=useState(null)
  const [newSlot,setNewSlot]=useState(null)
  const [tooltip,setTooltip]=useState(null)

  // Assign a color per medic (consistent)
  const medicColor=useMemo(()=>{
    const map={}
    medics.filter(m=>m.active).forEach((m,i)=>{
      map[m.id]=m.color||MEDIC_CAL_COLORS[i%MEDIC_CAL_COLORS.length]
    })
    return map
  },[medics])

  const weekStart=useMemo(()=>{
    const d=new Date(today)
    d.setDate(d.getDate()-((d.getDay()+6)%7)+weekOffset*7)
    d.setHours(0,0,0,0)
    return d
  },[weekOffset])

  const weekDays=useMemo(()=>Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return d
  }),[weekStart])

  const fmtDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const weekDateStrs=useMemo(()=>weekDays.map(fmtDate),[weekDays])

  const toggleMedic=id=>{
    setSelectedMedics(prev=>{
      if(prev.includes(id)){
        if(prev.length===1)return prev // keep at least one
        return prev.filter(x=>x!==id)
      }
      return [...prev,id]
    })
  }

  // Get bookings for a specific slot across all selected medics
  const getBookingsForSlot=(dateStr,time)=>bookings.filter(b=>
    b.appointment_date===dateStr&&b.appointment_time===time&&
    selectedMedics.includes(b.medic_id)&&
    b.status!=='cancelled'&&b.status!=='rejected'
  )

  // Get availability color for a medic at a slot
  const getMedicAvailColor=(medicId,dateStr,time)=>{
    const med=medics.find(m=>m.id===medicId)
    if(!med)return null
    const d=new Date(dateStr)
    const dayIdx=d.getDay()
    const dayMap=[6,0,1,2,3,4,5]
    const dayName=DAYS_FULL[dayMap[dayIdx]]
    const avail=med.availability||''
    if(avail&&!avail.includes(dayName))return null
    const start=med.availability_start||'08:00'
    const end=med.availability_end||'17:00'
    if(time<start||time>end)return null
    return medicColor[medicId]
  }

  const handleDelete=async b=>{
    if(!confirm(`Ștergi programarea lui ${b.patient_name}?`))return
    await fetch('/api/bookings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id})})
    onRefresh()
  }

  const weekLabel=(()=>{
    const s=weekDays[0];const e=weekDays[6]
    return `${s.getDate()} ${MONTH_FULL[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTH_FULL[e.getMonth()].slice(0,3)} ${e.getFullYear()}`
  })()

  const SLOT_H=44
  const showableMedics=canViewColleagues?medics.filter(m=>m.active):[medics.find(m=>m.id===user?.medic_id)].filter(Boolean)

  return<div style={{display:'flex',flexDirection:'column',height:'clamp(400px,calc(100vh - 160px),900px)',minHeight:400}}>
    {editBooking&&<BookingEditModal booking={editBooking} medics={medics} canApprove={canEdit&&(user?.role!=='medic'||editBooking.medic_id===user?.medic_id)} canDelete={canDelete&&(user?.role!=='medic'||editBooking.medic_id===user?.medic_id)} onClose={()=>setEditBooking(null)} onSaved={()=>{setEditBooking(null);onRefresh()}}/>}
    {newSlot&&<BookingModal medics={medics} bookings={bookings} user={user} preselectedMedicId={newSlot.medic_id} prefillDate={newSlot.date} prefillTime={newSlot.time} onClose={()=>setNewSlot(null)} onSaved={()=>{setNewSlot(null);onRefresh()}}/>}

    {/* Toolbar */}
    <div style={{marginBottom:12,display:'flex',flexDirection:'column',gap:8}}>
      {/* Week nav */}
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:'none',border:'1px solid #D5CFCA',padding:'6px 12px',cursor:'pointer',fontSize:16,color:'#1A3A2A'}}>‹</button>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(14px,2.5vw,18px)',color:'#1A3A2A',minWidth:'clamp(140px,30vw,260px)',textAlign:'center'}}>{weekLabel}</div>
        <button onClick={()=>setWeekOffset(w=>w+1)} style={{background:'none',border:'1px solid #D5CFCA',padding:'6px 12px',cursor:'pointer',fontSize:16,color:'#1A3A2A'}}>›</button>
        <button onClick={()=>setWeekOffset(0)} style={{background:'none',border:'1px solid #D5CFCA',padding:'4px 10px',cursor:'pointer',fontSize:11,color:'#6B7A6E',fontFamily:"'DM Sans',sans-serif"}}>Azi</button>
      </div>
      {/* Medic tags row */}
      {showableMedics.length>0&&<div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E',letterSpacing:'.08em',textTransform:'uppercase'}}>Calendare:</span>
        {showableMedics.map(m=>{
          const sel=selectedMedics.includes(m.id)
          const col=medicColor[m.id]||'#2D5A3F'
          return<div key={m.id} onClick={()=>canViewColleagues||m.id===user?.medic_id?toggleMedic(m.id):null}
            style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',border:`2px solid ${col}`,background:sel?col+'22':'transparent',cursor:canViewColleagues||m.id===user?.medic_id?'pointer':'default',borderRadius:4,transition:'all .15s'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:sel?col:'#ccc',flexShrink:0}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:sel?'#1A3A2A':'#6B7A6E'}}>{m.name}{m.id===user?.medic_id?' (eu)':''}</span>
          </div>
        })}
      </div>}
    </div>

    {/* Grid */}
    <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #E5DFD3',background:'#fff'}}>
      <div style={{display:'grid',gridTemplateColumns:`60px repeat(7,minmax(120px,1fr))`,minWidth:900}}>
        {/* Day headers */}
        <div style={{background:'#F5F0E8',borderBottom:'2px solid #E5DFD3',borderRight:'1px solid #E5DFD3',position:'sticky',top:0,zIndex:2}}/>
        {weekDays.map((d,i)=>{
          const isToday=fmtDate(d)===fmtDate(today)
          return<div key={i} style={{background:'#F5F0E8',borderBottom:'2px solid #E5DFD3',borderRight:'1px solid #E5DFD3',padding:'8px 6px',textAlign:'center',position:'sticky',top:0,zIndex:2}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E'}}>{DAYS_FULL[i]}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:isToday?'#2D5A3F':'#1A3A2A',marginTop:2}}>{d.getDate()}</div>
            {isToday&&<div style={{width:6,height:6,borderRadius:'50%',background:'#2D5A3F',margin:'2px auto 0'}}/>}
          </div>
        })}

        {/* Time rows */}
        {CAL_HALF.map(time=><React.Fragment key={time}>
          <div style={{height:SLOT_H,borderBottom:'1px solid #F0EBE0',borderRight:'1px solid #E5DFD3',display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:6,paddingTop:2,background:'#FDFAF5'}}>
            {time.endsWith(':00')&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#6B7A6E'}}>{time}</span>}
          </div>
          {weekDays.map((d,di)=>{
            const dateStr=fmtDate(d)
            const slotBookings=getBookingsForSlot(dateStr,time)
            const isPast=new Date(`${dateStr}T${time}`)<today
            const isHalf=time.endsWith(':30')

            // Availability overlay colors for each selected medic
            const availColors=selectedMedics.map(mid=>getMedicAvailColor(mid,dateStr,time)).filter(Boolean)
            const anyAvail=availColors.length>0&&!isPast

            return<div key={`${dateStr}-${time}`}
              style={{height:SLOT_H,borderBottom:isHalf?'1px dashed #F0EBE0':'1px solid #E5DFD3',borderRight:'1px solid #E5DFD3',position:'relative',background:isPast?'#F9F8F6':'#fff',cursor:anyAvail&&slotBookings.length===0?'pointer':'default'}}
              onClick={()=>{
                if(slotBookings.length>0){setEditBooking(slotBookings[0])}
                else if(anyAvail){
                  // Pre-select the first available medic for this slot
                  const firstAvailMedic=selectedMedics.find(mid=>getMedicAvailColor(mid,dateStr,time))
                  setNewSlot({date:dateStr,time,medic_id:firstAvailMedic||null})
                }
              }}
            >
              {/* Availability overlay bars */}
              {!isPast&&availColors.length>0&&slotBookings.length===0&&<div style={{position:'absolute',inset:0,display:'flex'}}>
                {availColors.map((c,ci)=><div key={ci} style={{flex:1,background:c+'18',borderRight:ci<availColors.length-1?`1px solid ${c}22`:'none'}}/>)}
              </div>}
              {/* Booking chips */}
              {slotBookings.map((b,bi)=>{
                const statusColor=b.status==='approved'?'#2D5A3F':b.status==='pending'?'#C9A84C':'#8B3A3A'
                const medicCol=medicColor[b.medic_id]||statusColor
                return<div key={b.id}
                  style={{position:'absolute',top:2,bottom:2,left:`${(bi/slotBookings.length)*100}%`,width:`${100/slotBookings.length}%`,background:statusColor,borderRadius:2,cursor:'pointer',overflow:'hidden',borderLeft:`4px solid ${medicCol}`}}
                  onClick={e=>{e.stopPropagation();setEditBooking(b)}}
                  onMouseEnter={e=>{e.stopPropagation();setTooltip({booking:b,x:e.clientX,y:e.clientY})}}
                  onMouseLeave={()=>setTooltip(null)}
                >
                  <div style={{padding:'1px 4px'}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.patient_name}</div>
                    {!isHalf&&selectedMedics.length>1&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:'rgba(255,255,255,.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.medic_name}</div>}
                  </div>
                </div>
              })}
              {/* + hover hint */}
              {anyAvail&&slotBookings.length===0&&!isPast&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity .1s',fontSize:18,color:'#4A8C5C',background:'rgba(255,255,255,.6)'}} className="cal-slot-hover">+</div>}
            </div>
          })}
        </React.Fragment>)}
      </div>
    </div>

    {/* Tooltip */}
    {tooltip&&<div style={{position:'fixed',left:Math.min(tooltip.x+14,window.innerWidth-230),top:tooltip.y-8,background:'#1A3A2A',color:'#F5F0E8',padding:'10px 14px',borderRadius:2,zIndex:2000,fontFamily:"'DM Sans',sans-serif",fontSize:12,boxShadow:'0 4px 16px rgba(0,0,0,.25)',pointerEvents:'none',maxWidth:220}}>
      <div style={{fontWeight:600,marginBottom:4}}>{tooltip.booking.patient_name}</div>
      <div style={{color:'#B8D4BE'}}>{tooltip.booking.appointment_date} · {tooltip.booking.appointment_time}</div>
      {tooltip.booking.medic_name&&<div style={{color:'#B8D4BE',marginTop:2}}>{tooltip.booking.medic_name}</div>}
      {tooltip.booking.reason&&<div style={{color:'#B8D4BE',marginTop:4,fontStyle:'italic'}}>{tooltip.booking.reason}</div>}
      <div style={{marginTop:6}}><SBadge status={tooltip.booking.status}/></div>
      <div style={{marginTop:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#B8D4BE'}}>Click pentru a edita</div>
    </div>}

    {/* Legend */}
    <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>Status:</span>
      {[['#2D5A3F','Aprobat'],['#C9A84C','În așteptare'],['#8B3A3A','Respins']].map(([c,l])=>(
        <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:10,height:10,borderRadius:2,background:c}}/>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>{l}</span>
        </div>
      ))}
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        <div style={{width:10,height:10,borderRadius:2,background:'#E8F4E8',border:'1px solid #ccc'}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>Disponibil</span>
      </div>
    </div>
  </div>
}


export default function App(){
  const [page,setPage]=useState('home')
  const [user,setUser]=useState(null)
  const [patient,setPatient]=useState(null)
  const [medics,setMedics]=useState([])
  const [services,setServices]=useState([])
  const [bookings,setBookings]=useState([])
  const [patients,setPatients]=useState([])
  const [settings,setSettings]=useState({})
  const [flags,setFlags]=useState([])
  const [selMedic,setSelMedic]=useState(null)
  const [histPatient,setHistPatient]=useState(null)
  const [visitModalPatient,setVisitModalPatient]=useState(null)
  const [bookForPatient,setBookForPatient]=useState(null)
  const [bookingsView,setBookingsView]=useState('list') // 'list' | 'calendar'
  const [editBookingItem,setEditBookingItem]=useState(null)

  // booking
  const [calMonth,setCalMonth]=useState(TODAY.getMonth())
  const [calYear]=useState(TODAY.getFullYear())
  const [selDate,setSelDate]=useState(null)
  const [selSlot,setSelSlot]=useState(null)
  const [selBMedic,setSelBMedic]=useState('')
  const [bookForm,setBookForm]=useState({name:'',email:'',phone:'',reason:''})
  const [bookDone,setBookDone]=useState(false)
  const [bookErr,setBookErr]=useState('')
  const [saving,setSaving]=useState(false)
  const [captcha,setCaptcha]=useState('')

  // per-medic flags
  const [medicOwnFlags,setMedicOwnFlags]=useState({})
  const medicFlag=f=>{if(!user?.medic_id)return true;return medicOwnFlags[f]!==undefined?medicOwnFlags[f]:true}

  // login
  const [lf,setLf]=useState({email:'',password:''})
  const [lErr,setLErr]=useState('')
  const [logging,setLogging]=useState(false)
  const [lMode,setLMode]=useState('staff')
  const [reg,setReg]=useState({name:'',email:'',phone:'',password:''})

  // admin/medic ui
  const [adminTab,setAdminTab]=useState('overview')
  const [modal,setModal]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [editModel,setEditModel]=useState(null)
  const [drillMedic,setDrillMedic]=useState(null)
  const [msg,setMsg]=useState('')
  const [patientTab,setPatientTab]=useState('bookings')

  const SK=process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  // Tab icons (SVG as string for sidebar)
  const TAB_ICON = {
    overview: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>,
    bookings: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><rect x="3" y="4" width="14" height="13" rx="1"/><path d="M7 2v4M13 2v4M3 9h14"/></svg>,
    medics: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M10 11v4M8 13h4"/></svg>,
    patients: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3 2.7-5 6-5"/><circle cx="15" cy="12" r="3"/><path d="M15 9v6M12 12h6"/></svg>,
    services: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><path d="M10 2C7 2 5 4 5 6.5C5 8 6 9 6 10C6 11.5 5 13 5 14.5C5 16 6.5 17 8 16.5C9 16.2 10 15.5 10 15.5C10 15.5 11 16.2 12 16.5C13.5 17 15 16 15 14.5C15 13 14 11.5 14 10C14 9 15 8 15 6.5C15 4 13 2 10 2Z"/></svg>,
    homepage: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><path d="M3 9l7-6 7 6v9H3V9z"/><rect x="7" y="13" width="6" height="5" rx="0.5"/></svg>,
    templates: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><path d="M4 6h12M4 10h8M4 14h10"/><circle cx="16" cy="14" r="2.5"/><path d="M16 12v2.5l1.5 1"/></svg>,
    'medic-flags': (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 7v3l2 2"/><path d="M7 4.5L4 2M13 4.5L16 2"/></svg>,
    flags: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><path d="M4 3v14M4 3h10l-2 4h2l-2 4H4"/></svg>,
    analytics: (c='currentColor')=><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke={c} strokeWidth="1.5"><path d="M3 14l4-5 4 3 5-7"/><path d="M3 17h14"/></svg>,
  }


  const load=useCallback(async()=>{
    const[m,s,b,st]=await Promise.all([fetch('/api/admin/medics').then(r=>r.json()),fetch('/api/admin/services').then(r=>r.json()),fetch('/api/bookings').then(r=>r.json()),fetch('/api/admin/settings').then(r=>r.json())])
    setMedics(Array.isArray(m)?m:[]);setServices(Array.isArray(s)?s:[]);setBookings(Array.isArray(b)?b:[]);setSettings(st||{})
  },[])

  const loadExtra=useCallback(async()=>{
    const[p,f]=await Promise.all([fetch('/api/admin/patients').then(r=>r.json()),fetch('/api/admin/flags').then(r=>r.json())])
    setPatients(Array.isArray(p)?p:[]);setFlags(Array.isArray(f)?f:[])
  },[])

  useEffect(()=>{load()},[load])
  useEffect(()=>{if(user)loadExtra()},[user,loadExtra])
  useEffect(()=>{
    if(user?.role==='medic'&&user?.medic_id){
      fetch(`/api/admin/medic-flags?medic_id=${user.medic_id}`).then(r=>r.json()).then(d=>{
        if(Array.isArray(d)){const m={};d.forEach(f=>{m[f.flag]=f.enabled});setMedicOwnFlags(m)}
      })
    }
  },[user])

  const flag=f=>{const x=flags.find(x=>x.flag===f);return x?x.enabled:true}

  // Get display initials for a user (staff or patient)
  const getInitials=u=>{
    if(!u)return'?'
    if(u.medics?.initials)return u.medics.initials
    const parts=(u.name||'').split(' ').filter(Boolean)
    if(parts.length>=2)return(parts[0][0]+parts[parts.length-1][0]).toUpperCase()
    return(u.name||'?').slice(0,2).toUpperCase()
  }
  const cn=settings.clinic_name||'Cabinet Pneumologie'
  const cs=settings.clinic_subtitle||'Dr. Claudia Stoia'
  const dk=selDate?`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selDate).padStart(2,'0')}`:null

  const availSlots=useCallback(()=>{
    if(!selDate)return ALL_HOURS
    const pool=selBMedic?medics.filter(m=>m.id===selBMedic):medics.filter(m=>m.active)
    if(!pool.length)return ALL_HOURS
    const m=pool[0]
    const start=m.availability_start||'08:00'
    const end=m.availability_end||'17:00'
    const dayIdx=new Date(calYear,calMonth,selDate).getDay()
    const dayMap=[6,0,1,2,3,4,5]
    const dayName=DAYS_FULL[dayMap[dayIdx]]
    const avail=m.availability||''
    if(avail&&!avail.includes(dayName))return[]
    return ALL_HOURS.filter(h=>h>=start&&h<=end)
  },[selDate,selBMedic,medics,calMonth,calYear])

  const slotTaken=useCallback(time=>{
    if(!selDate)return false
    const pool=selBMedic?medics.filter(m=>m.id===selBMedic):medics.filter(m=>m.active)
    return pool.every(m=>bookings.some(b=>b.medic_id===m.id&&b.appointment_date===dk&&b.appointment_time===time&&(b.status==='approved'||b.status==='pending')))
  },[selDate,selBMedic,medics,bookings,dk])

  const dayAvailable=useCallback(d=>{
    if(!d)return false
    const dayIdx=new Date(calYear,calMonth,d).getDay()
    const dayMap=[6,0,1,2,3,4,5]
    const dayName=DAYS_FULL[dayMap[dayIdx]]
    const pool=selBMedic?medics.filter(m=>m.id===selBMedic):medics.filter(m=>m.active)
    return pool.some(m=>!m.availability||m.availability.includes(dayName))
  },[calYear,calMonth,selBMedic,medics])

  const showMsg=m=>{setMsg(m);setTimeout(()=>setMsg(''),3000)}

  const loginStaff=async()=>{setLogging(true);setLErr('');try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lf)});if(!r.ok)throw new Error('Email sau parolă incorectă');const{staff}=await r.json();setUser(staff);setPage('dashboard')}catch(e){setLErr(e.message)};setLogging(false)}
  const loginPatient=async()=>{setLogging(true);setLErr('');try{const r=await fetch('/api/patient/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',...lf})});if(!r.ok){const e=await r.json();throw new Error(e.error)};const{patient:p}=await r.json();setPatient(p);setPage('pdash')}catch(e){setLErr(e.message)};setLogging(false)}
  const register=async()=>{setLogging(true);setLErr('');try{const r=await fetch('/api/patient/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',...reg})});if(!r.ok){const e=await r.json();throw new Error(e.error)};const{patient:p}=await r.json();setPatient(p);setPage('pdash')}catch(e){setLErr(e.message)};setLogging(false)}

  const book=async()=>{
    if(!selSlot||!dk||!captcha)return
    const name=patient?patient.name:bookForm.name
    const email=patient?patient.email:bookForm.email
    const phone=patient?patient.phone:bookForm.phone
    if(!name)return
    setSaving(true);setBookErr('')
    try{
      const r=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_name:name,patient_email:email,phone:phone||'',reason:bookForm.reason,service_id:null,service_name:null,appointment_date:dk,appointment_time:selSlot,preferred_medic_id:selBMedic||null,hcaptcha_token:captcha})})
      if(!r.ok){const e=await r.json();throw new Error(e.error)}
      setBookDone(true);setCaptcha('')
    }catch(e){setBookErr(e.message);setCaptcha('')}
    setSaving(false)
  }
  const resetBook=()=>{setBookDone(false);setSelDate(null);setSelSlot(null);setBookForm({name:'',email:'',phone:'',reason:''});setBookErr('');setCaptcha('');setSelBMedic('')}
  const approve=async id=>{await fetch(`/api/bookings/approve?id=${id}`);await load()}
  const reject=async id=>{await fetch('/api/bookings/reject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});await load()}

  const saveCrud=async (data, extras={})=>{
    const{staffPassword,patientPassword,...clean}=data
    const url='/api/admin/'+editModel
    const method=data.id?'PUT':'POST'
    // Strip computed/joined fields that shouldn't be sent to DB
    const { medic_services: _ms, ...cleanMedic } = clean
    const payload=editModel==='medics'?{...cleanMedic,staffPassword}:editModel==='patients'?{...clean,password_hash:patientPassword||clean.password_hash}:clean
    const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    if(!r.ok){const e=await r.json();throw new Error(e.error||'Eroare')}
    const saved=await r.json()
    // For new medics: save pending services and flags
    if(editModel==='medics'&&!data.id&&saved.id){
      const medicId=saved.id
      if(extras.pendingServices?.length){
        await Promise.all(extras.pendingServices.map(svcId=>
          fetch('/api/admin/medic-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({medic_id:medicId,service_id:svcId})})
        ))
      }
      if(extras.pendingFlags&&Object.keys(extras.pendingFlags).length){
        await Promise.all(Object.entries(extras.pendingFlags).map(([flag,enabled])=>
          fetch('/api/admin/medic-flags',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({medic_id:medicId,flag,enabled})})
        ))
      }
    }
    // For new patients: save pending flags
    if(editModel==='patients'&&!data.id&&saved.id){
      if(extras.pendingFlags&&Object.keys(extras.pendingFlags).length){
        await Promise.all(Object.entries(extras.pendingFlags).map(([flag,enabled])=>
          fetch('/api/admin/patient-flags',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:saved.id,flag,enabled})})
        ))
      }
    }
    await load();await loadExtra();setModal(false);setEditItem(null);showMsg('✓ Salvat!')
  }
  const del=async(model,id)=>{
    if(!confirm('Sigur?'))return
    const r=await fetch(`/api/admin/${model}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    if(!r.ok){const e=await r.json();alert(e.error||'Eroare');return}
    await load();await loadExtra();showMsg('✓ Șters!')
  }
  const saveSettings=async u=>{await fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(u)});await load()}
  const toggleFlag=async(f,e)=>{await fetch('/api/admin/flags',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({flag:f,enabled:e})});await loadExtra()}
  const openModal=(model,item)=>{setEditModel(model);setEditItem(item||{});setModal(true)}

  const Refresh=()=><button onClick={load} className="btn-outline" style={{color:'#1A3A2A',padding:'5px 12px',fontSize:11,display:'flex',alignItems:'center',gap:5}}>↻ Reîncarcă</button>

  const isStaff=user?.role==='admin'||user?.role==='master'
  const isMedic=user?.role==='medic'
  const currentUser=user||patient
  const currentRole=user?.role||(patient?'patient':null)

  // Admin tabs (ordered per spec)
  const adminTabs=()=>[
    ['overview','Prezentare'],
    ...(flag('admin_bookings_view')||user?.role==='master'?[['bookings','Programări']]:[] ),
    ...(flag('admin_medics_add')||flag('admin_medics_edit')||flag('admin_medics_delete')||user?.role==='master'?[['medics','Medici']]:[] ),
    ...(flag('admin_patients_add')||flag('admin_patients_edit')||flag('admin_patients_delete')||user?.role==='master'?[['patients','Pacienți']]:[] ),
    ...(flag('admin_services_add')||flag('admin_services_edit')||flag('admin_services_delete')||user?.role==='master'?[['services','Servicii']]:[] ),
    ...(flag('admin_homepage_edit')||user?.role==='master'?[['homepage','Pagina Principală']]:[] ),
    ...(flag('medic_visits_add')||flag('medic_visits_edit')||user?.role==='master'?[['templates','Nomenclator']]:[] ),
    ...(user?.role==='master'||flag('admin_medic_settings')?[['medic-flags','Setări Medici']]:[] ),
    ...(user?.role==='master'?[['flags','Feature Flags']]:[] ),
  ]

  const medicFlags=flags.filter(f=>f.flag.startsWith('medic_'))
  const adminFlagsList=flags.filter(f=>f.flag.startsWith('admin_'))

  const medicTabs=()=>[
    ['overview','Prezentare'],
    ['bookings','Programări'],
    ...(medicFlag('patients_view')||medicFlag('patients_add')||medicFlag('patients_edit')?[['patients','Pacienți']]:[] ),
    ...(medicFlag('nom_view')||medicFlag('nom_symptoms_add')||medicFlag('nom_diagnostics_add')||medicFlag('nom_treatments_add')?[['templates','Nomenclator']]:[] ),
  ]

  // Stats overview
  const OverviewStats=({bk,showPerMedic=false})=>{
    const wkS=new Date(TODAY);wkS.setDate(TODAY.getDate()-TODAY.getDay()+1)
    const wkE=new Date(wkS);wkE.setDate(wkS.getDate()+6)
    const moS=new Date(TODAY.getFullYear(),TODAY.getMonth(),1).toISOString().split('T')[0]
    return<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:24}}>
        {[[bk.length,'Total','#2D5A3F'],[bk.filter(b=>b.status==='pending').length,'În Așteptare','#C9A84C'],[bk.filter(b=>b.appointment_date>=wkS.toISOString().split('T')[0]&&b.appointment_date<=wkE.toISOString().split('T')[0]).length,'Săptămâna','#3F4A5C'],[bk.filter(b=>b.appointment_date>=moS).length,'Luna','#5C4A3F'],[bk.filter(b=>b.appointment_date===TODAYSTR).length,'Azi','#4A5C3F']].map(([n,l,c])=>(
          <div key={l} style={{background:'#fff',border:'1px solid #E5DFD3',padding:'16px',textAlign:'center'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,color:c}}>{n}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:'.08em',color:'#6B7A6E',marginTop:3,textTransform:'uppercase'}}>{l}</div>
          </div>
        ))}
      </div>
      {showPerMedic&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1A3A2A',marginBottom:10}}>Per Medic</div>
        <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
          {medics.filter(m=>m.active).map(m=>{
            const mb=bookings.filter(b=>b.medic_id===m.id)
            return<div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid #F0EBE0',cursor:'pointer',flexWrap:'wrap',gap:8}} onClick={()=>{setDrillMedic(m);setAdminTab('analytics')}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:m.color||'#2D5A3F',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:600}}>{m.initials||m.name?.slice(0,2)}</div>
                <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1A3A2A'}}>{m.name}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>{m.specialty}</div></div>
              </div>
              <div style={{display:'flex',gap:16,fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
                <span><strong style={{color:'#1A3A2A'}}>{mb.length}</strong> <span style={{color:'#6B7A6E'}}>total</span></span>
                <span><strong style={{color:'#C9A84C'}}>{mb.filter(b=>b.status==='pending').length}</strong> <span style={{color:'#6B7A6E'}}>în așteptare</span></span>
                <span style={{color:'#4A8C5C'}}>Detalii →</span>
              </div>
            </div>
          })}
        </div>
      </div>}
    </div>
  }

  // Bookings table
  const BookingsTable=({list,showApprove=false,showMedic=false,onCreateVisit=null,onEdit=null,onDelete=null})=><div style={{background:'#fff',border:'1px solid #E5DFD3',overflowX:'auto'}}>
    <div style={{display:'grid',gridTemplateColumns:`90px 65px 1fr${showMedic?' 120px':''} 100px${(showApprove||onCreateVisit||onEdit||onDelete)?' 120px':''}`,gap:8,padding:'10px 14px',background:'#F0E4C0',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:10,letterSpacing:'.08em',textTransform:'uppercase',color:'#6B7A6E',minWidth:400}}>
      <span>Data</span><span>Ora</span><span>Pacient</span>{showMedic&&<span>Medic</span>}<span>Status</span>{(showApprove||onCreateVisit||onEdit||onDelete)&&<span>Acțiuni</span>}
    </div>
    {list.map(b=><div key={b.id} style={{display:'grid',gridTemplateColumns:`90px 65px 1fr${showMedic?' 120px':''} 100px${(showApprove||onCreateVisit||onEdit||onDelete)?' 120px':''}`,gap:8,alignItems:'center',padding:'10px 14px',borderBottom:'1px solid #F0EBE0',fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:'pointer',minWidth:400}} onClick={()=>{const p=patients.find(x=>x.phone===b.phone||x.email===b.patient_email);if(p)setHistPatient(p)}}>
      <span style={{color:'#1A3A2A',fontWeight:500}}>{b.appointment_date}</span>
      <span style={{background:'#F0E4C0',padding:'2px 5px',fontSize:11}}>{b.appointment_time}</span>
      <div>
        <div style={{fontWeight:500,color:'#1A3A2A'}}>{b.patient_name}</div>
        <div style={{fontSize:10,color:'#6B7A6E'}}>{b.phone}</div>
      </div>
      {showMedic&&<span style={{color:'#6B7A6E',fontSize:11}}>{b.medic_name}</span>}
      <SBadge status={b.status}/>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        {showApprove&&b.status==='pending'&&<>
          <button onClick={e=>{e.stopPropagation();approve(b.id)}} style={{background:'#2D5A3F',color:'white',border:'none',padding:'3px 7px',cursor:'pointer',fontSize:10}}>✓</button>
          <button onClick={e=>{e.stopPropagation();reject(b.id)}} style={{background:'#8B3A3A',color:'white',border:'none',padding:'3px 7px',cursor:'pointer',fontSize:10}}>✗</button>
        </>}
        {onCreateVisit&&b.status==='approved'&&<button onClick={e=>{e.stopPropagation();onCreateVisit(b)}} style={{background:'none',border:'1px solid #2D5A3F',padding:'3px 8px',cursor:'pointer',fontSize:10,color:'#2D5A3F',borderRadius:2,whiteSpace:'nowrap'}}>+ Vizită</button>}
        {onEdit&&<button onClick={e=>{e.stopPropagation();onEdit(b)}} style={{background:'none',border:'1px solid #C9A84C',padding:'3px 8px',cursor:'pointer',fontSize:10,color:'#C9A84C',borderRadius:2}}>✎</button>}
        {onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(b)}} style={{background:'none',border:'1px solid #8B3A3A',padding:'3px 8px',cursor:'pointer',fontSize:10,color:'#8B3A3A',borderRadius:2}}>✕</button>}
      </div>
    </div>)}
    {list.length===0&&<div style={{padding:'20px',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',textAlign:'center'}}>Nicio programare.</div>}
  </div>

  // Patients list with visit button
  const PatientsList=({canAdd,canEdit,canDel,canAddVisit,showVisitBtn=false,canBookForPatient=false,onBookForPatient})=><div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A'}}>Pacienți ({patients.length})</div>
      <div style={{display:'flex',gap:8}}>
        <Refresh/>
        {canAdd&&<button className="btn-primary" onClick={()=>openModal('patients')}>+ Adaugă</button>}
      </div>
    </div>
    <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
      {patients.map(p=><div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid #F0EBE0',fontFamily:"'DM Sans',sans-serif",fontSize:13,flexWrap:'wrap',gap:8}}>
        <div style={{flex:1,cursor:'pointer',minWidth:0}} onClick={()=>setHistPatient(p)}>
          <div style={{fontWeight:500,color:'#1A3A2A',display:'flex',alignItems:'center',gap:6}}>{p.name}<span style={{fontSize:10,color:'#4A8C5C'}}>→ Istoric</span></div>
          <div style={{fontSize:11,color:'#6B7A6E'}}>{p.phone}{p.email&&` · ${p.email}`}</div>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          {showVisitBtn&&canAddVisit&&<button className="btn-outline" style={{color:'#2D5A3F',borderColor:'#2D5A3F44',padding:'3px 10px',fontSize:10}} onClick={()=>setVisitModalPatient(p)}>+ Vizită</button>}
          {canBookForPatient&&<button className="btn-outline" style={{color:'#3F4A5C',borderColor:'#3F4A5C44',padding:'3px 10px',fontSize:10}} onClick={()=>onBookForPatient?.(p)}>+ Programare</button>}
          {canEdit&&<button className="btn-outline" style={{color:'#1A3A2A',padding:'3px 9px',fontSize:10}} onClick={()=>openModal('patients',p)}>Edit</button>}
          {canDel&&<button className="btn-outline" style={{color:'#8B3A3A',borderColor:'#8B3A3a44',padding:'3px 9px',fontSize:10}} onClick={()=>del('patients',p.id)}>✕</button>}
        </div>
      </div>)}
    </div>
  </div>

  const SidebarNav=({tabs,current,onClick,tabIcons})=><div style={{width:'clamp(64px,18vw,220px)',background:'#1A3A2A',padding:'16px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
    <div style={{flex:1}}>
      {tabs.map(([t,l])=>{
        const label=l.replace(/^[^ -\s]+\s*/,'').trim()
        const Icon=tabIcons?.[t]
        const isActive=current===t
        return<div key={t} onClick={()=>onClick(t)} style={{padding:'10px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,background:isActive?'rgba(255,255,255,.1)':'transparent',borderLeft:isActive?'3px solid #C9A84C':'3px solid transparent',transition:'all .15s'}}>
          {Icon&&<span style={{color:isActive?'#C9A84C':'#6B7A6E',flexShrink:0,display:'flex'}}>{Icon(isActive?'#C9A84C':'#6B7A6E')}</span>}
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:isActive?'#F5F0E8':'#B8D4BE'}}>{label}</span>
        </div>
      })}
    </div>
    <div style={{padding:'16px 18px',borderTop:'1px solid rgba(255,255,255,.1)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:user?.medics?.color||'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:600,flexShrink:0}}>
          {getInitials(user||patient)}
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#F5F0E8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.medics?.name||user?.name}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#6B7A6E',textTransform:'uppercase'}}>{user?.role}</div>
        </div>
      </div>
    </div>
  </div>

  // ── RENDER ─────────────────────────────────────────────────────
  return<div style={{fontFamily:"'Georgia',serif",background:'#F5F0E8',minHeight:'100vh',color:'#1A1A1A',display:'flex',flexDirection:'column'}}>

    {/* NAV */}
    <header style={{background:'#1A3A2A',padding:'0 clamp(12px,4vw,40px)',display:'flex',alignItems:'center',justifyContent:'space-between',minHeight:60,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 16px rgba(0,0,0,.18)',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',minWidth:0}} onClick={()=>setPage('home')}>
        <div style={{width:30,height:30,border:'2px solid #C9A84C',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#C9A84C" strokeWidth="1.5"><path d="M8 5C8 3.9 7.1 3 6 3C4.9 3 4 3.9 4 5V14C4 17.3 6.7 20 10 20H11V7C11 5.9 10.1 5 9 5H8Z"/><path d="M16 5C16 3.9 16.9 3 18 3C19.1 3 20 3.9 20 5V14C20 17.3 17.3 20 14 20H13V7C13 5.9 13.9 5 15 5H16Z"/><path d="M11 9H13"/></svg></div>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",color:'#F5F0E8',fontSize:15,fontWeight:600,lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cn}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",color:'#B8D4BE',fontSize:10,fontStyle:'italic',whiteSpace:'nowrap'}}>{cs}</div>
        </div>
      </div>
      <nav style={{display:'flex',gap:'clamp(6px,1.5vw,16px)',alignItems:'center',flexShrink:0,marginLeft:8}}>
        {[['home','Servicii'],['team','Medici'],['calendar','Programări'],...(user?[['dashboard','Dashboard']]:[] ),...(patient?[['pdash','Contul Meu']]:[] )].map(([p,l])=>(
          <span key={p} className="nav-link" style={{color:page===p||(page==='doctor'&&p==='team')?'#F5F0E8':'#B8D4BE',borderBottomColor:page===p||(page==='doctor'&&p==='team')?'#C9A84C':'transparent',fontSize:'clamp(10px,1.4vw,13px)'}} onClick={()=>{setPage(p);setSelMedic(null);setHistPatient(null)}}>{l}</span>
        ))}
        {!currentUser
          ?<span className="nav-link" style={{color:'#B8D4BE',borderBottom:'1px solid rgba(201,168,76,.3)',fontSize:'clamp(10px,1.4vw,13px)'}} onClick={()=>setPage('login')}>Login</span>
          :<div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',color:'#1A3A2A',fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}} title={currentUser.name||''} onClick={()=>setPage(user?'dashboard':'pdash')}>
              {getInitials(currentUser)}
            </div>
            <button className="btn-outline" style={{color:'#B8D4BE',borderColor:'rgba(184,212,190,.3)',padding:'3px 10px',fontSize:10}} onClick={()=>{setUser(null);setPatient(null);setPage('home')}}>Ieșire</button>
          </div>
        }
      </nav>
    </header>

    {/* MAIN CONTENT */}
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>

    {/* HOME */}
    {page==='home'&&<div className="fade-in">
      <div style={{background:'linear-gradient(135deg,#0F2318 0%,#1A3A2A 40%,#2D5A3F 70%,#3D7A55 100%)',padding:'clamp(40px,8vw,90px) clamp(16px,5vw,40px)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-80,right:-80,width:400,height:400,borderRadius:'50%',border:'80px solid rgba(201,168,76,.06)'}}/>
        <div style={{position:'absolute',top:'50%',right:'5%',transform:'translateY(-50%)',fontSize:'clamp(80px,15vw,200px)',opacity:.04,userSelect:'none'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{width:'100%',height:'100%',opacity:1}}><path d="M8 5C8 3.9 7.1 3 6 3C4.9 3 4 3.9 4 5V14C4 17.3 6.7 20 10 20H11V7C11 5.9 10.1 5 9 5H8Z"/><path d="M16 5C16 3.9 16.9 3 18 3C19.1 3 20 3.9 20 5V14C20 17.3 17.3 20 14 20H13V7C13 5.9 13.9 5 15 5H16Z"/><path d="M11 9H13"/></svg></div>
        <div style={{maxWidth:660,position:'relative'}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:'#C9A84C',marginBottom:16}}>Timișoara, România</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(30px,5.5vw,66px)',fontWeight:300,color:'#F5F0E8',lineHeight:1.1,marginBottom:10}}>{settings.hero_title||'Pneumologie cu precizie și grijă'}</h1>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(13px,2vw,18px)',color:'#B8D4BE',fontStyle:'italic',marginBottom:14}}>{cs}</p>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:'#A0BCA8',fontSize:'clamp(12px,1.8vw,15px)',lineHeight:1.7,marginBottom:28,maxWidth:500}}>{settings.hero_subtitle||'Diagnostic expert, tratament și îngrijire continuă.'}</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <button className="btn-primary" onClick={()=>setPage('calendar')}>Fă o Programare</button>
            <button className="btn-outline" style={{color:'#B8D4BE'}} onClick={()=>setPage('team')}>Cunoaște Medicii</button>
          </div>
        </div>
      </div>
      <div style={{background:'linear-gradient(90deg,#F0E4C0,#EDD99A,#F0E4C0)',display:'flex',justifyContent:'center',flexWrap:'wrap'}}>
        {[[medics.filter(m=>m.active).length||'—','Medici'],['20+','Ani'],['12k+','Pacienți'],[services.filter(s=>s.active!==false).length||'—','Servicii']].map(([n,l])=>(
          <div key={l} style={{padding:'18px clamp(16px,4vw,48px)',textAlign:'center',borderRight:'1px solid rgba(201,168,76,.3)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(22px,4vw,32px)',fontWeight:600,color:'#1A3A2A'}}>{n}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'#6B7A6E',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'clamp(28px,6vw,72px) clamp(16px,5vw,40px)'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:'#6B7A6E'}}>Ce Oferim</div><Rule/>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,38px)',fontWeight:300,color:'#1A3A2A',marginBottom:32}}>Servicii Clinice</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(clamp(160px,30vw,260px),1fr))',gap:1,background:'#E5DFD3'}}>
          {services.filter(s=>s.active!==false).map(s=>(
            <div key={s.id} className="card" style={{padding:'24px 20px'}}>
              <div style={{marginBottom:10,color:'#1A3A2A'}}><SvcIcon k={s.icon} size={26}/></div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1A3A2A',marginBottom:6}}>{s.name}</h3>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',lineHeight:1.6}}>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:'linear-gradient(135deg,#0F2318,#1A3A2A)',padding:'clamp(28px,6vw,56px) clamp(16px,5vw,40px)',textAlign:'center'}}>
        <div style={{marginBottom:10,display:'flex',justifyContent:'center',opacity:.4}}><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#F5F0E8" strokeWidth="1"><path d="M8 5C8 3.9 7.1 3 6 3C4.9 3 4 3.9 4 5V14C4 17.3 6.7 20 10 20H11V7C11 5.9 10.1 5 9 5H8Z"/><path d="M16 5C16 3.9 16.9 3 18 3C19.1 3 20 3.9 20 5V14C20 17.3 17.3 20 14 20H13V7C13 5.9 13.9 5 15 5H16Z"/><path d="M11 9H13"/></svg></div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(22px,4vw,36px)',fontWeight:300,color:'#F5F0E8',marginBottom:10}}>Grijă pentru sănătatea respiratorie</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",color:'#B8D4BE',fontSize:'clamp(12px,2vw,15px)',marginBottom:22}}>{settings.booking_section_text||'Programează o consultație.'}</p>
        <button className="btn-primary" style={{background:'#C9A84C',color:'#1A3A2A'}} onClick={()=>setPage('calendar')}>Programează Acum</button>
      </div>
    </div>}

    {/* TEAM */}
    {page==='team'&&<div className="fade-in" style={{maxWidth:1100,margin:'0 auto',padding:'clamp(28px,6vw,64px) clamp(16px,5vw,40px)'}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:'#6B7A6E'}}>Personalul Medical</div><Rule/>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,42px)',fontWeight:300,color:'#1A3A2A',marginBottom:32}}>Echipa Noastră</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(clamp(240px,40vw,340px),1fr))',gap:'clamp(12px,2vw,18px)'}}>
        {medics.filter(m=>m.active).map(doc=>(
          <div key={doc.id} className="card" style={{padding:'24px 20px',cursor:'pointer'}} onClick={()=>{setSelMedic(doc);setPage('doctor')}}>
            <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:doc.color||'#2D5A3F',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,flexShrink:0}}>{doc.initials||doc.name?.slice(0,2)}</div>
              <div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:'#1A3A2A'}}>{doc.name}</h3>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#C9A84C',letterSpacing:'.1em',textTransform:'uppercase',marginTop:2}}>{doc.specialty}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E',marginTop:2}}>{doc.experience}</div>
              </div>
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',lineHeight:1.6,marginBottom:12}}>{(doc.description||'').slice(0,100)}{doc.description?.length>100?'…':''}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>📅 {doc.availability}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#4A8C5C'}}>Profil →</span>
            </div>
          </div>
        ))}
      </div>
    </div>}

    {/* DOCTOR */}
    {page==='doctor'&&selMedic&&<div className="fade-in">
      <div style={{background:'#F0EBE0',borderBottom:'1px solid #E5DFD3',padding:'12px clamp(16px,5vw,40px)'}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',cursor:'pointer'}} onClick={()=>setPage('team')}>← Înapoi</span>
      </div>
      <div style={{background:selMedic.color||'#2D5A3F',padding:'clamp(28px,6vw,64px) clamp(16px,5vw,40px)'}}>
        <div style={{maxWidth:860,margin:'0 auto',display:'flex',gap:'clamp(12px,3vw,20px)',alignItems:'flex-end',flexWrap:'wrap'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'3px solid rgba(255,255,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,flexShrink:0}}>{selMedic.initials||selMedic.name?.slice(0,2)}</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'rgba(255,255,255,.6)',marginBottom:6,letterSpacing:'.12em',textTransform:'uppercase'}}>{cn} · {selMedic.specialty}</div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,5vw,48px)',fontWeight:300,color:'#fff',lineHeight:1}}>{selMedic.name}</h1>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'rgba(255,255,255,.7)',marginTop:8}}>{selMedic.experience} · {selMedic.availability} ({selMedic.availability_start}–{selMedic.availability_end})</div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:860,margin:'0 auto',padding:'clamp(20px,5vw,56px) clamp(16px,5vw,40px)'}}>
        <Rule/>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:'#6B7A6E',lineHeight:1.75,marginBottom:28}}>{selMedic.description}</p>
        {selMedic.medic_services?.length>0&&<><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'#6B7A6E',marginBottom:8}}>Servicii</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>{selMedic.medic_services.map(ms=><span key={ms.service_id} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:'#F5F0E8',border:'1px solid #E5DFD3',fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#1A3A2A'}}><SvcIcon k={ms.services?.icon} size={13}/>{ms.services?.name}</span>)}</div></>}
        <button className="btn-primary" onClick={()=>{if(selMedic?.id)setSelBMedic(selMedic.id);setPage('calendar')}}>Fă o Programare</button>
      </div>
    </div>}

    {/* CALENDAR */}
    {page==='calendar'&&<div className="fade-in">
      <div style={{background:'linear-gradient(135deg,#1A3A2A,#2D5A3F)',padding:'clamp(28px,6vw,56px) clamp(16px,5vw,40px)'}}>
        <div style={{maxWidth:960,margin:'0 auto'}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:'#B8D4BE',marginBottom:10}}>{cn}</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,5vw,46px)',fontWeight:300,color:'#F5F0E8'}}>Fă o Programare</h1>
        </div>
      </div>
      <div style={{maxWidth:960,margin:'0 auto',padding:'clamp(18px,4vw,48px) clamp(16px,5vw,40px)',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'clamp(16px,3vw,28px)'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1A3A2A',marginBottom:8}}>Alege Data</h2><Rule/>
          {medics.filter(m=>m.active).length>1&&<div style={{marginBottom:14}}>
            <Lbl>Preferință medic</Lbl>
            <Sel value={selBMedic} onChange={e=>{setSelBMedic(e.target.value);setSelDate(null);setSelSlot(null)}}>
              <option value="">Orice medic disponibil</option>
              {medics.filter(m=>m.active).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </Sel>
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#1A3A2A',padding:'4px 8px'}} onClick={()=>setCalMonth(m=>Math.max(0,m-1))}>‹</button>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#1A3A2A'}}>{MONTH_FULL[calMonth]} {calYear}</div>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#1A3A2A',padding:'4px 8px'}} onClick={()=>setCalMonth(m=>Math.min(11,m+1))}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,maxWidth:260}}>
            {DAYS_RO.map((d,i)=><div key={i} style={{height:26,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'#6B7A6E'}}>{d}</div>)}
            {getDays(calYear,calMonth).map((d,i)=>{
              const isT=d&&d===TODAY.getDate()&&calMonth===TODAY.getMonth()&&calYear===TODAY.getFullYear()
              const isP=d&&new Date(calYear,calMonth,d)<new Date(TODAY.toDateString())
              const isSel=d===selDate
              const avail=d&&!isP&&dayAvailable(d)
              return<div key={i} className={`cal-day${!d?' empty':''}${isP?' past':''}${isSel?' selected':''}${isT&&!isSel?' today':''}`}
                style={{opacity:d&&!isP&&!avail?0.4:1,cursor:d&&!isP&&avail?'pointer':'default'}}
                onClick={()=>{if(d&&!isP&&avail){setSelDate(d);setSelSlot(null)}}}>{d||''}</div>
            })}
          </div>
          {selDate&&<div style={{marginTop:18}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#1A3A2A',marginBottom:10}}>{MONTH_FULL[calMonth]} {selDate} — Ore</h3>
            {availSlots().length===0?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#8B3A3A'}}>Medicul nu este disponibil în această zi.</div>
            :<div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {availSlots().map(t=><div key={t} className={`slot${slotTaken(t)?' taken':''}${selSlot===t?' selected':''}`} onClick={()=>{if(!slotTaken(t))setSelSlot(t)}}>{t}</div>)}
            </div>}
          </div>}
        </div>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1A3A2A',marginBottom:8}}>Datele Tale</h2><Rule/>
          {bookDone?<div style={{background:'#EAF5EC',border:'1px solid #A8D4AD',padding:'24px',textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:10}}>✓</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1A3A2A',marginBottom:6}}>Solicitare Trimisă!</h3>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#4A8C5C',marginBottom:14}}>Medicul va confirma prin email.</p>
            <button className="btn-primary" onClick={resetBook}>Altă Programare</button>
          </div>:<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {selDate&&selSlot&&<div style={{background:'#F0E4C0',border:'1px solid #DDD5B8',padding:'10px 14px'}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#1A3A2A'}}>📅 {MONTH_FULL[calMonth]} {selDate} · ⏰ {selSlot}</div></div>}

            {!patient&&<>
              {[['Nume complet *','name','text'],['Email','email','email'],['Telefon *','phone','tel']].map(([l,k,t])=>(
                <div key={k}><Lbl>{l}</Lbl><Inp type={t} value={bookForm[k]} onChange={e=>setBookForm(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
            </>}
            {patient&&<div style={{background:'#F5F0E8',border:'1px solid #E5DFD3',padding:'10px 14px',fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#1A3A2A'}}>👤 {patient.name} · {patient.phone}</div>}
            <div><Lbl>Motiv (opțional)</Lbl><Txt rows={2} value={bookForm.reason} onChange={e=>setBookForm(f=>({...f,reason:e.target.value}))}/></div>
            <Captcha onVerify={t=>setCaptcha(t)} siteKey={SK}/>
            {bookErr&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:'10px',fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#E65100'}}>{bookErr}</div>}
            <button className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={book}
              disabled={!selSlot||!dk||!captcha||((!patient)&&(!bookForm.name||!bookForm.phone))||saving}>
              {saving?<><Sp/> Se trimite…</>:!selSlot?'Alege o oră':!captcha?'Completează verificarea':'Trimite Programarea'}
            </button>
          </div>}
          <div style={{marginTop:24,padding:'18px',background:'#fff',border:'1px solid #E5DFD3'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1A3A2A',marginBottom:10}}>Contact</h3>
            {[['📍',settings.clinic_address],['📞',settings.clinic_phone],['✉',settings.clinic_email],['🕐',settings.clinic_hours]].filter(([,v])=>v).map(([i,t])=>(
              <div key={t} style={{display:'flex',gap:8,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}><span>{i}</span><span>{t}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>}

    {/* LOGIN */}
    {page==='login'&&<div className="fade-in" style={{maxWidth:460,margin:'clamp(20px,4vw,60px) auto',padding:'0 clamp(16px,5vw,40px)',width:'100%'}}>
      <div style={{display:'flex',borderBottom:'2px solid #E5DFD3',marginBottom:24}}>
        {[['staff','Personal Medical'],['patient','Pacient'],['register','Înregistrare']].map(([m,l])=>(
          <div key={m} onClick={()=>{setLMode(m);setLErr('')}} style={{padding:'8px 12px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',borderBottom:`2px solid ${lMode===m?'#1A3A2A':'transparent'}`,marginBottom:-2,color:lMode===m?'#1A3A2A':'#6B7A6E'}}>{l}</div>
        ))}
      </div>
      {lMode==='staff'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:6}}>Login Personal</h2>
        <div><Lbl>Email</Lbl><Inp type="email" value={lf.email} onChange={e=>setLf(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&loginStaff()}/></div>
        <div><Lbl>Parolă</Lbl><Inp type="password" value={lf.password} onChange={e=>setLf(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&loginStaff()}/></div>
        {lErr&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:10,fontSize:12,color:'#E65100'}}>{lErr}</div>}
        <button className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={loginStaff} disabled={!lf.email||!lf.password||logging}>{logging?<><Sp/> Se conectează…</>:'Intră'}</button>
      </div>}
      {lMode==='patient'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:6}}>Login Pacient</h2>
        <div><Lbl>Email</Lbl><Inp type="email" value={lf.email} onChange={e=>setLf(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&loginPatient()}/></div>
        <div><Lbl>Parolă</Lbl><Inp type="password" value={lf.password} onChange={e=>setLf(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&loginPatient()}/></div>
        {lErr&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:10,fontSize:12,color:'#E65100'}}>{lErr}</div>}
        <button className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={loginPatient} disabled={!lf.email||!lf.password||logging}>{logging?<><Sp/> Se conectează…</>:'Intră'}</button>
      </div>}
      {lMode==='register'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:6}}>Cont Nou Pacient</h2>
        {[['Nume','name','text'],['Email','email','email'],['Telefon','phone','tel'],['Parolă','password','password']].map(([l,k,t])=>(
          <div key={k}><Lbl>{l}</Lbl><Inp type={t} value={reg[k]} onChange={e=>setReg(f=>({...f,[k]:e.target.value}))}/></div>
        ))}
        {lErr&&<div style={{background:'#FFF3E0',border:'1px solid #FFCC80',padding:10,fontSize:12,color:'#E65100'}}>{lErr}</div>}
        <button className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={register} disabled={!reg.name||!reg.email||!reg.password||logging}>{logging?<><Sp/> Se înregistrează…</>:'Creează cont'}</button>
      </div>}
    </div>}

    {/* PATIENT DASHBOARD */}
    {page==='pdash'&&patient&&<div className="fade-in">
      {histPatient?<History patient={histPatient} medics={medics} services={services} onBack={()=>setHistPatient(null)} canWrite={false}/>
      :<div style={{maxWidth:900,margin:'0 auto',padding:'clamp(16px,4vw,56px) clamp(12px,4vw,40px)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:'#6B7A6E'}}>Contul Meu</div><Rule/><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:'#1A3A2A'}}>Bună, {patient.name}</h2></div>
          <Refresh/>
        </div>
        <div style={{display:'flex',borderBottom:'2px solid #E5DFD3',marginBottom:18,overflowX:'auto',WebkitOverflowScrolling:'touch',flexShrink:0,scrollbarWidth:'none'}}>
          {[['bookings','Programări'],['history','Istoric Medical'],['documents','Documente']].map(([t,l])=>(
            <div key={t} onClick={()=>setPatientTab(t)} style={{padding:'8px 18px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap',borderBottom:`2px solid ${patientTab===t?'#1A3A2A':'transparent'}`,marginBottom:-2,color:patientTab===t?'#1A3A2A':'#6B7A6E'}}>{l}</div>
          ))}
        </div>
        {patientTab==='bookings'&&<div>
          {bookings.filter(b=>b.phone===patient.phone||b.patient_email===patient.email).length===0
            ?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',padding:'20px',background:'#fff',border:'1px solid #E5DFD3',textAlign:'center'}}>Nu ai nicio programare.</div>
            :<BookingsTable list={bookings.filter(b=>b.phone===patient.phone||b.patient_email===patient.email).sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date))} showMedic/>}
        </div>}
        {patientTab==='history'&&<History patient={patient} medics={medics} services={services} onBack={()=>setPatientTab('bookings')} canWrite={false}/>}
        {patientTab==='documents'&&<DocPanel entityType="patient" entityId={patient.id} uploadedBy={patient.name} canAdd={true} canDelete={true}/>}
      </div>}
    </div>}

    {/* STAFF DASHBOARD */}
    {page==='dashboard'&&user&&<div className="fade-in">
      {/* Global visit modal from bookings table */}
      {visitModalPatient&&<VisitModal patient={visitModalPatient} medics={medics} services={services} currentMedicId={visitModalPatient._fromBooking?.medic_id||user.medic_id||null} prefillDate={visitModalPatient._fromBooking?.appointment_date||null} onClose={()=>setVisitModalPatient(null)} onSaved={()=>{setVisitModalPatient(null);load()}} canEditTemplates={isMedic?medicFlag('nomenclator_edit'):flag('medic_visits_edit')||user.role==='master'}/>}
      {bookForPatient&&<BookingModal patient={bookForPatient} medics={medics} bookings={bookings} user={user} preselectedMedicId={user.medic_id||null} onClose={()=>setBookForPatient(null)} onSaved={()=>{setBookForPatient(null);load()}}/>}

      {/* History overlay */}
      {histPatient&&<History patient={histPatient} medics={medics} services={services} onBack={()=>setHistPatient(null)} canWrite={true} currentMedicId={user.medic_id||null} canEditTemplates={isMedic?medicFlag('nomenclator_edit'):flag('medic_visits_edit')||user.role==='master'}/>}

      {!histPatient&&<div style={{display:'flex',minHeight:'calc(100vh - 60px)',flexDirection:'row',flexWrap:'wrap'}}>
        <SidebarNav tabs={isMedic?medicTabs():adminTabs()} current={adminTab} onClick={t=>{setAdminTab(t);setDrillMedic(null);setHistPatient(null)}} tabIcons={TAB_ICON}/>

        <div style={{flex:1,padding:'clamp(12px,3vw,40px)',overflowY:'auto',minWidth:0,maxWidth:'100%'}}>
          {msg&&<div style={{background:'#E8F5E9',border:'1px solid #A5D6A7',padding:'10px 14px',fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#2D5A3F',marginBottom:14}}>{msg}</div>}

          {/* OVERVIEW */}
          {adminTab==='overview'&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:10}}>
              <div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:'#1A3A2A'}}>Bună, {user.name}</h2><p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',marginTop:4}}>{user.role==='master'?'Cont Master':user.role==='admin'?'Administrator':'Medic'}</p></div>
              <Refresh/>
            </div>
            <OverviewStats bk={isMedic?bookings.filter(b=>b.medic_id===user.medic_id):bookings} showPerMedic={isStaff}/>
            {isMedic&&<div style={{marginTop:20,background:'#fff',border:'1px solid #E5DFD3',padding:'16px 20px'}}>
              <DocPanel entityType="medic" entityId={user.medic_id} uploadedBy={user.name} canAdd={flag('medic_documents_add')} canDelete={flag('medic_documents_delete')}/>
            </div>}
          </div>}

          {/* BOOKINGS */}
          {adminTab==='bookings'&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A'}}>{isMedic?'Programările Mele':'Toate Programările'} ({(isMedic?bookings.filter(b=>b.medic_id===user.medic_id):bookings).length})</h2>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {/* View toggle */}
                <div style={{display:'flex',border:'1px solid #E5DFD3',borderRadius:2,overflow:'hidden'}}>
                  {[['list','list'],['calendar','calendar']].map(([v,l])=>{
                    const isActive=bookingsView===v
                    return<div key={v} onClick={()=>setBookingsView(v)} style={{padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,background:isActive?'#1A3A2A':'transparent',color:isActive?'#F5F0E8':'#6B7A6E'}}>
                      {v==='list'
                        ?<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
                        :<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="12" rx="1"/><path d="M1 7h14M5 1v4M11 1v4"/></svg>
                      }
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11}}>{v==='list'?'Listă':'Calendar'}</span>
                    </div>
                  })}
                </div>
                <Refresh/>
              </div>
            </div>

            {bookingsView==='list'&&<>
              {(()=>{
                const myB=isMedic?bookings.filter(b=>b.medic_id===user.medic_id):bookings
                const pending=myB.filter(b=>b.status==='pending')
                const canApprove=user.role==='master'||(isMedic?medicFlag('bookings_approve'):flag('admin_bookings_approve'))
                const canEditB=(b)=>user.role==='master'||user.role==='admin'||(isMedic&&b.medic_id===user.medic_id&&medicFlag('bookings_edit'))
                const canDeleteB=(b)=>user.role==='master'||(user.role==='admin'&&flag('admin_bookings_approve'))||(isMedic&&b.medic_id===user.medic_id&&medicFlag('bookings_delete'))
                return<>
                  {pending.length>0&&canApprove&&<div style={{marginBottom:20}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#C9A84C',marginBottom:10}}>Necesită Aprobare ({pending.length})</div>
                    <BookingsTable list={pending} showApprove showMedic={isStaff}
                      onEdit={b=>canEditB(b)?setEditBookingItem(b):null}
                      onDelete={async b=>{if(!canDeleteB(b))return;if(!confirm(`Ștergi programarea?`))return;await fetch('/api/bookings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id})});load()}}
                    />
                  </div>}
                  <BookingsTable
                    list={myB.filter(b=>b.status!=='pending').sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date))}
                    showMedic={isStaff}
                    onCreateVisit={b=>{
                      const p=patients.find(x=>x.phone===b.phone||x.email===b.patient_email||x.id===b.patient_id)
                      if(p)setVisitModalPatient({...p,_fromBooking:b})
                      else setVisitModalPatient({id:null,name:b.patient_name,phone:b.phone,email:b.patient_email,_fromBooking:b})
                    }}
                    onEdit={b=>canEditB(b)?setEditBookingItem(b):null}
                    onDelete={canDeleteB?async b=>{if(!confirm(`Ștergi programarea?`))return;await fetch('/api/bookings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id})});load()}:null}
                  />
                </>
              })()}
            </>}

            {bookingsView==='calendar'&&<CalendarView
              bookings={bookings}
              medics={medics}
              user={user}
              medicFlag={medicFlag}
              canEdit={user.role==='master'||(isMedic?medicFlag('bookings_edit'):flag('admin_bookings_approve'))}
              canDelete={user.role==='master'||(isMedic?medicFlag('bookings_delete'):flag('admin_bookings_approve'))}
              canViewColleagues={user.role==='master'||user.role==='admin'||(isMedic&&medicFlag('bookings_view_colleagues'))}
              onRefresh={load}
            />}

            {/* Edit booking modal */}
            {editBookingItem&&<BookingEditModal booking={editBookingItem} medics={medics} canApprove={user.role==='master'||user.role==='admin'||(isMedic&&editBookingItem.medic_id===user.medic_id&&medicFlag('bookings_approve'))} canDelete={user.role==='master'||(user.role==='admin'&&flag('admin_bookings_approve'))||(isMedic&&editBookingItem.medic_id===user.medic_id&&medicFlag('bookings_delete'))} onClose={()=>setEditBookingItem(null)} onSaved={()=>{setEditBookingItem(null);load()}}/>}
          </div>}

          {/* MEDICS */}
          {adminTab==='medics'&&isStaff&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A'}}>Medici</h2>
              {(user.role==='master'||flag('admin_medics_add'))&&<button className="btn-primary" onClick={()=>openModal('medics')}>+ Adaugă</button>}
            </div>
            <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
              {medics.map(m=><div key={m.id} style={{padding:'12px 14px',borderBottom:'1px solid #F0EBE0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',gap:10,alignItems:'center',flex:1,minWidth:0}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:m.color||'#2D5A3F',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:600,flexShrink:0}}>{m.initials||m.name?.slice(0,2)}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1A3A2A'}}>{m.name}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>{m.specialty} · {m.email}</div>
                    {m.medic_services?.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:3}}>{m.medic_services.map(ms=><span key={ms.service_id} style={{display:'flex',alignItems:'center',gap:2,padding:'1px 5px',background:'#F5F0E8',border:'1px solid #E5DFD3',fontFamily:"'DM Sans',sans-serif",fontSize:9,color:'#1A3A2A'}}><SvcIcon k={ms.services?.icon} size={9}/>{ms.services?.name}</span>)}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  {(user.role==='master'||flag('admin_medics_edit'))&&<button className="btn-outline" style={{color:'#1A3A2A',padding:'3px 9px',fontSize:10}} onClick={()=>openModal('medics',m)}>Edit</button>}
                  {(user.role==='master'||flag('admin_medics_delete'))&&<button className="btn-outline" style={{color:'#8B3A3A',borderColor:'#8B3A3a44',padding:'3px 9px',fontSize:10}} onClick={()=>del('medics',m.id)}>✕</button>}
                </div>
              </div>)}
            </div>
          </div>}

          {/* PATIENTS */}
          {adminTab==='patients'&&(histPatient
            ?<History patient={histPatient} medics={medics} services={services} onBack={()=>setHistPatient(null)} canWrite={true} currentMedicId={user.medic_id||null} canEditTemplates={isMedic?medicFlag('nomenclator_edit'):flag('medic_visits_edit')||user.role==='master'}/>
            :<PatientsList
              canAdd={user.role==='master'||(isMedic?medicFlag('patients_add'):flag('admin_patients_add'))}
              canEdit={user.role==='master'||(isMedic?medicFlag('patients_edit'):flag('admin_patients_edit'))}
              canDel={user.role==='master'||(isMedic?medicFlag('patients_delete'):flag('admin_patients_delete'))}
              canAddVisit={user.role==='master'||(isMedic?medicFlag('visits_add'):true)}
              showVisitBtn
              canBookForPatient={user.role==='master'||user.role==='admin'||(isMedic&&medicFlag('bookings_create_for_patient'))}
              onBookForPatient={p=>setBookForPatient(p)}
            />
          )}

          {/* SERVICES */}
          {adminTab==='services'&&isStaff&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A'}}>Servicii</h2>
              {(user.role==='master'||flag('admin_services_add'))&&<button className="btn-primary" onClick={()=>openModal('services')}>+ Adaugă</button>}
            </div>
            <div style={{background:'#fff',border:'1px solid #E5DFD3'}}>
              {services.map(s=><div key={s.id} style={{padding:'10px 14px',borderBottom:'1px solid #F0EBE0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',gap:10,alignItems:'center',flex:1}}>
                  <div style={{color:'#1A3A2A'}}><SvcIcon k={s.icon} size={20}/></div>
                  <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1A3A2A'}}>{s.name}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:'#6B7A6E'}}>{s.description?.slice(0,55)}</div></div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {(user.role==='master'||flag('admin_services_edit'))&&<button className="btn-outline" style={{color:'#1A3A2A',padding:'3px 9px',fontSize:10}} onClick={()=>openModal('services',s)}>Edit</button>}
                  {(user.role==='master'||flag('admin_services_delete'))&&<button className="btn-outline" style={{color:'#8B3A3A',borderColor:'#8B3A3a44',padding:'3px 9px',fontSize:10}} onClick={()=>del('services',s.id)}>✕</button>}
                </div>
              </div>)}
            </div>
          </div>}

          {/* HOMEPAGE */}
          {adminTab==='homepage'&&<HPEditor settings={settings} onSave={saveSettings}/>}

          {/* TEMPLATES (Simptome/Diagnostice/Tratamente) */}
          {adminTab==='templates'&&<div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:6}}>Nomenclator</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#6B7A6E',marginBottom:24}}>Listele de simptome, diagnostice și tratamente disponibile la adăugarea unei vizite.</p>
            <div style={{display:'flex',flexDirection:'column',gap:28}}>
              <TemplatesTab type="symptom" label="Simptome"
                canEdit={user.role==='master'||(isMedic?(medicFlag('nom_symptoms_add')||medicFlag('nom_symptoms_edit')):flag('admin_medics_edit'))}
                canDelete={user.role==='master'||(isMedic?medicFlag('nom_symptoms_delete'):true)}
              />
              <TemplatesTab type="diagnostic" label="Diagnostice"
                canEdit={user.role==='master'||(isMedic?(medicFlag('nom_diagnostics_add')||medicFlag('nom_diagnostics_edit')):flag('admin_medics_edit'))}
                canDelete={user.role==='master'||(isMedic?medicFlag('nom_diagnostics_delete'):true)}
              />
              <TemplatesTab type="treatment" label="Tratamente"
                canEdit={user.role==='master'||(isMedic?(medicFlag('nom_treatments_add')||medicFlag('nom_treatments_edit')):flag('admin_medics_edit'))}
                canDelete={user.role==='master'||(isMedic?medicFlag('nom_treatments_delete'):true)}
              />
            </div>
          </div>}

          {/* ANALYTICS drill-down */}
          {adminTab==='analytics'&&isStaff&&<div>
            {!drillMedic?<div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:14}}>Analize</h2><OverviewStats bk={bookings} showPerMedic/></div>
            :<div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#6B7A6E',cursor:'pointer',display:'block',marginBottom:16}} onClick={()=>setDrillMedic(null)}>← Înapoi</span>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1A3A2A',marginBottom:14}}>{drillMedic.name}</h2>
              <OverviewStats bk={bookings.filter(b=>b.medic_id===drillMedic.id)}/>
              <BookingsTable list={bookings.filter(b=>b.medic_id===drillMedic.id).sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date))} showApprove={flag('admin_bookings_approve')||user.role==='master'}/>
            </div>}
          </div>}

          {/* MEDIC FLAGS (Master only) */}
          {adminTab==='medic-flags'&&(user.role==='master'||flag('admin_medic_settings'))&&<FlagsEditor flags={medicFlags} onToggle={toggleFlag} title="Setări Medici" subtitle="Controlează permisiunile implicite pentru toți medicii."/>}

          {/* ADMIN FLAGS (Master only) */}
          {adminTab==='flags'&&user.role==='master'&&<FlagsEditor flags={adminFlagsList} onToggle={toggleFlag} title="Feature Flags (Admin)" subtitle="Controlează ce pot face Adminii."/>}

        </div>
      </div>}
    </div>}

    </div>{/* end main content */}

    {modal&&<CrudModal model={editModel} item={editItem} onClose={()=>{setModal(false);setEditItem(null)}} onSave={saveCrud} services={services}/>}

    <footer style={{background:'#1A3A2A',padding:'clamp(14px,3vw,28px) clamp(16px,5vw,40px)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,flexShrink:0}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",color:'#B8D4BE',fontSize:13}}>{cn} · Timișoara</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",color:'#6B7A6E',fontSize:11}}>© 2026 {cn}</div>
    </footer>
  </div>
}
