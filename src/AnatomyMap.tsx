import type {KeyboardEvent} from 'react';

type FigureProps={back:boolean;colour:(region:string)=>string;selected:string;onSelect:(region:string)=>void};
const guide='#f3f6fa';const line='#b7c6d2';
export default function AnatomyMap({back,colour,selected,onSelect}:FigureProps){
 const muscle=(id:string)=>( {fill:colour(id),stroke:selected===id?'#166b72':'#fff',strokeWidth:selected===id?3:1.7,strokeLinejoin:'round' as const});
 const clickable=(id:string)=>({role:'button' as const,tabIndex:0,'aria-label':`View ${id} training history`,onClick:()=>onSelect(id),onKeyDown:(e:KeyboardEvent<SVGGElement>)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}}});
 return <svg className="anatomy-figure" viewBox="0 0 250 500" role="img" aria-label={back?'Interactive posterior muscle diagram':'Interactive anterior muscle diagram'}>
 <defs>
  <linearGradient id={`body-${back?'back':'front'}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#dce5ef"/></linearGradient>
  <filter id="bodyGlow"><feGaussianBlur stdDeviation="4"/></filter>
 </defs>
 <ellipse cx="125" cy="482" rx="62" ry="7" fill="#cfdbe2" opacity=".45" filter="url(#bodyGlow)"/>
 <g fill={`url(#body-${back?'back':'front'})`} stroke={line} strokeWidth="1.7">
  <path d="M112 83 L111 102 Q97 106 78 110 Q58 111 51 129 Q48 149 61 172 L70 217 Q74 253 83 270 L83 313 L91 392 L93 448 Q91 463 92 467 Q94 473 103 470 L111 461 L119 377 L124 324 L128 324 L133 377 L141 461 L149 470 Q159 475 161 467 L158 448 L162 392 L170 313 L170 270 Q180 250 183 217 L191 172 Q204 148 200 129 Q193 112 173 110 L138 100 L138 83Z"/>
  <path d="M56 132 Q40 129 35 153 Q28 184 29 220 L27 258 Q25 274 30 279 Q38 286 41 270 L45 246 L46 210 L58 162Z"/>
  <path d="M194 132 Q210 129 215 153 Q222 184 221 220 L223 258 Q225 274 220 279 Q212 286 209 270 L205 246 L204 210 L192 162Z"/>
  <path d="M28 267 Q21 280 24 289 L29 290 L33 280 L36 291 Q43 285 42 276"/>
  <path d="M222 267 Q229 280 226 289 L221 290 L217 280 L214 291 Q207 285 208 276"/>
  <path d="M109 38 Q111 22 125 21 Q143 22 144 40 L144 62 Q140 83 129 87 L121 87 Q109 80 106 60 Z"/>
  <path d="M108 48 Q101 46 103 56 L107 63 M144 48 Q151 46 148 56 L144 63" fill="none"/>
 </g>
 <g stroke="#a8b9c8" strokeWidth="1.1" fill="none" opacity=".8">
  <path d="M113 85 L125 95 L137 85 M102 38 Q125 22 146 38"/>
  <path d="M94 468 L97 479 L104 478 M156 468 L153 479 L146 478"/>
 </g>
 {back?<>
  <g {...clickable('back')}>
   <path {...muscle('back')} d="M112 96 Q125 107 138 96 L167 113 L174 144 L155 163 L148 183 L125 210 L103 183 L96 163 L77 144 L84 113Z"/>
   <path fill="none" stroke="#ffffffbb" strokeWidth="1.3" d="M125 105 L125 206 M85 120 Q106 130 122 144 M165 120 Q144 130 128 144 M99 160 Q111 167 121 180 M151 160 Q139 167 129 180"/>
  </g>
  <g {...clickable('shoulders')}><path {...muscle('shoulders')} d="M78 109 Q61 106 53 127 Q55 151 76 159 L94 132 L100 112Z"/><path {...muscle('shoulders')} d="M172 109 Q189 106 197 127 Q195 151 174 159 L156 132 L150 112Z"/></g>
  <g {...clickable('triceps')}><path {...muscle('triceps')} d="M52 149 Q41 168 38 199 L49 217 L62 175 L76 162Z"/><path {...muscle('triceps')} d="M198 149 Q209 168 212 199 L201 217 L188 175 L174 162Z"/></g>
  <g {...clickable('forearms')}><path {...muscle('forearms')} d="M36 205 Q28 229 30 265 L42 265 L49 221Z"/><path {...muscle('forearms')} d="M214 205 Q222 229 220 265 L208 265 L201 221Z"/></g>
  <g {...clickable('glutes')}><path {...muscle('glutes')} d="M87 252 Q112 246 123 263 L123 307 L99 321 Q82 305 81 279Z"/><path {...muscle('glutes')} d="M163 252 Q138 246 127 263 L127 307 L151 321 Q168 305 169 279Z"/></g>
  <g {...clickable('hamstrings')}><path {...muscle('hamstrings')} d="M88 317 L123 322 L117 384 L102 405 L90 386Z"/><path {...muscle('hamstrings')} d="M162 317 L127 322 L133 384 L148 405 L160 386Z"/></g>
  <g {...clickable('calves')}><path {...muscle('calves')} d="M92 405 Q108 397 115 414 L105 459 L96 464Z"/><path {...muscle('calves')} d="M158 405 Q142 397 135 414 L145 459 L154 464Z"/></g>
 </>:<>
  <g {...clickable('shoulders')}><path {...muscle('shoulders')} d="M81 108 Q62 105 53 129 L65 157 L86 157 L100 119Z"/><path {...muscle('shoulders')} d="M169 108 Q188 105 197 129 L185 157 L164 157 L150 119Z"/></g>
  <g {...clickable('chest')}><path {...muscle('chest')} d="M102 114 L122 118 L123 163 Q106 177 85 164 L77 138Z"/><path {...muscle('chest')} d="M148 114 L128 118 L127 163 Q144 177 165 164 L173 138Z"/><path fill="none" stroke="#ffffffb0" strokeWidth="1.4" d="M88 140 L119 150 M162 140 L131 150"/></g>
  <g {...clickable('biceps')}><path {...muscle('biceps')} d="M60 163 Q46 175 44 204 L55 214 L68 177Z"/><path {...muscle('biceps')} d="M190 163 Q204 175 206 204 L195 214 L182 177Z"/></g>
  <g {...clickable('forearms')}><path {...muscle('forearms')} d="M44 210 Q31 237 30 264 L42 268 L55 219Z"/><path {...muscle('forearms')} d="M206 210 Q219 237 220 264 L208 268 L195 219Z"/></g>
  <g {...clickable('core')}><path {...muscle('core')} d="M106 169 L123 176 L123 266 L101 259 L94 215Z"/><path {...muscle('core')} d="M144 169 L127 176 L127 266 L149 259 L156 215Z"/><path fill="none" stroke="#ffffffad" strokeWidth="1.4" d="M105 194 L121 194 M129 194 L145 194 M104 220 L121 220 M129 220 L146 220 M105 243 L121 243 M129 243 L145 243"/></g>
  <g {...clickable('quads')}><path {...muscle('quads')} d="M84 269 Q102 263 122 280 L118 391 L105 403 L88 380Z"/><path {...muscle('quads')} d="M166 269 Q148 263 128 280 L132 391 L145 403 L162 380Z"/><path fill="none" stroke="#ffffffb5" strokeWidth="1.25" d="M96 282 L109 378 M154 282 L141 378"/></g>
  <g {...clickable('calves')}><path {...muscle('calves')} d="M91 405 Q105 400 113 416 L105 460 L98 464Z"/><path {...muscle('calves')} d="M159 405 Q145 400 137 416 L145 460 L152 464Z"/></g>
 </>}
 <g fontSize="11" fontWeight="750" fill="#687d94" textAnchor="middle"><text x="125" y="498">{back?'BACK VIEW':'FRONT VIEW'}</text></g>
 </svg>;
}
