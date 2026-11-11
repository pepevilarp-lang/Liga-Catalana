/* Informe semanal «Weekend Sports Report»: composición del PDF (pdfmake).
   Lo usan la app (navegador, window.ReportDoc) y el envío automático del servidor (api/_report.js).
   Entrada: F = datos del fin de semana, A = textos (IA o de respaldo), crest = escudo en PNG (data URL). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReportDoc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
const RC={navy:'#12284C',crimson:'#9E1B32',gold:'#B08D3C',ink:'#1C2430',grey:'#6B7280',line:'#D9DEE6',soft:'#F3F5F8',win:'#1F6B45'};
const CAP_FIELDS=[['valoracion','Valoración general','¿Cómo ha ido la eliminatoria en conjunto?'],['desarrollo','Desarrollo de la jornada','Cómo fueron los partidos, momentos clave'],['destacados','Jugadores destacados','Quién y por qué'],['positivos','Aspectos positivos',''],['mejorar','Aspectos a mejorar',''],['incidencias','Incidencias','Lesiones, retrasos, pistas, arbitraje…'],['compromiso','Disponibilidad y compromiso del equipo',''],['observaciones','Observaciones adicionales','']];
function buildReportDoc(F, A, crest, meta_){
  const T=F.totales, gen=new Date().toLocaleString('es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const H=(num,title)=>[{text:'SECCIÓN '+num,style:'kicker',margin:[0,0,0,2]},{text:title,style:'h1'},{canvas:[{type:'line',x1:0,y1:0,x2:60,y2:0,lineWidth:2,lineColor:RC.gold}],margin:[0,4,0,14]}];
  const tbl=(head,rows,widths)=>({table:{headerRows:1,dontBreakRows:true,widths:widths||head.map(()=>'*'),body:[head.map(h=>({text:h,style:'th'})),...rows.map(r=>r.map(c=>typeof c==='object'?c:{text:String(c??'–'),style:'td'}))]},layout:{hLineWidth:(i,n)=>i===0||i===1||i===n.table.body.length?0.8:0.4,vLineWidth:()=>0,hLineColor:i=>i<=1?RC.navy:RC.line,paddingTop:()=>5,paddingBottom:()=>5,paddingLeft:()=>4,paddingRight:()=>4,fillColor:(i)=>i===0?RC.soft:null},margin:[0,0,0,12]});
  const kv=rows=>({table:{widths:[120,'*'],body:rows.map(([k,v])=>[{text:k,style:'k'},{text:v??'–',style:'v'}])},layout:{hLineWidth:()=>0.4,vLineWidth:()=>0,hLineColor:()=>RC.line,paddingTop:()=>4,paddingBottom:()=>4},margin:[0,0,0,12]});
  const kpi=(n,l,c)=>({stack:[{text:String(n),fontSize:24,bold:true,color:c||RC.navy},{text:l.toUpperCase(),fontSize:7,color:RC.grey,characterSpacing:.6}],margin:[0,6,0,6]});
  const resTxt=x=>x.resultado? `${x.estado==='victoria'?'Victoria':'Derrota'} ${x.resultado}` : 'Pendiente';
  const valTxt=x=>!x.resultado? 'Sin resultado' : x.validado? 'Validado (oficial)' : 'Pendiente de validación';
  // gráfico discreto: barras horizontales de individuales y dobles ganados/perdidos por equipo
  const chart=()=>{ if(!F.equipos.length) return {text:''}; const W=470, rowH=26, L=150, scale=(W-L-40)/Math.max(5,...F.equipos.map(x=>{ const [a,b]=x.fin_de_semana.individuales.split('-').map(Number); const [c,d]=x.fin_de_semana.dobles.split('-').map(Number); return a+b+c+d; }));
    const cv=[], txt=[]; F.equipos.forEach((x,i)=>{ const y=i*rowH; const [sw,sl]=x.fin_de_semana.individuales.split('-').map(Number), [dw,dl]=x.fin_de_semana.dobles.split('-').map(Number); let X=L;
      [[sw,RC.navy],[sl,RC.crimson],[dw,'#5B7BB0'],[dl,'#D98C9A']].forEach(([n,c])=>{ if(n){ cv.push({type:'rect',x:X,y:y+6,w:n*scale-2,h:12,color:c}); X+=n*scale; } }); });
    return {stack:[{canvas:cv,absolutePosition:undefined},
      {columns:[{width:L,stack:F.equipos.map(x=>({text:x.equipo,fontSize:8.5,color:RC.ink,margin:[0,0,0,0],lineHeight:1,height:rowH,marginBottom:rowH-10}))},{text:''}],relativePosition:{x:0,y:-F.equipos.length*rowH+2}},
      {text:[{text:'Individuales ganados',color:RC.navy,bold:true},'   ',{text:'Individuales perdidos',color:RC.crimson,bold:true},'   ',{text:'Dobles ganados',color:'#5B7BB0',bold:true},'   ',{text:'Dobles perdidos',color:'#D98C9A',bold:true}],fontSize:7.5,margin:[0,6,0,14]}]}; };
  const c=[];
  // PORTADA (fondo azul marino en el background)
  c.push({stack:[{image:crest,width:118,alignment:'center',margin:[0,86,0,34]},
    {text:'WEEKEND SPORTS REPORT',alignment:'center',color:'#FFFFFF',fontSize:26,bold:true,characterSpacing:4},
    {canvas:[{type:'line',x1:200,y1:0,x2:299,y2:0,lineWidth:1.5,lineColor:RC.gold}],margin:[0,16,0,16]},
    {text:F.club,alignment:'center',color:'#FFFFFF',fontSize:15},
    {text:F.fin_de_semana,alignment:'center',color:RC.gold,fontSize:13,bold:true,margin:[0,22,0,4]},
    {text:`Temporada ${F.temporada}`,alignment:'center',color:'#C9D2E0',fontSize:10.5},
    {text:'Lliga Catalana de Tennis per Equips',alignment:'center',color:'#C9D2E0',fontSize:10.5,margin:[0,2,0,0]},
    {text:'DOCUMENTO INTERNO',alignment:'center',color:'#C9D2E0',fontSize:8,characterSpacing:2,margin:[0,140,0,4]},
    {text:`Generado el ${gen}`,alignment:'center',color:'#8FA0BA',fontSize:8}],pageBreak:'after'});
  // 01 RESUMEN EJECUTIVO
  c.push(...H('01','Resumen ejecutivo'));
  c.push({columns:[kpi(T.equipos,'Equipos'),kpi(T.victorias,'Victorias',RC.win),kpi(T.derrotas,'Derrotas',RC.crimson),kpi(T.pendientes,'Pendientes'),kpi(T.sin_validar,'Por validar',RC.gold)],margin:[0,0,0,6]});
  c.push({columns:[kv([['Individuales',T.individuales+' (ganados-perdidos)']]),kv([['Dobles',T.dobles+' (ganados-perdidos)']])],columnGap:20});
  c.push({text:A.resumen_ejecutivo||'',style:'p'});
  if(A.conclusiones?.length) c.push({text:'Conclusiones',style:'h3'},{ul:A.conclusiones.map(x=>({text:x,style:'li'})),margin:[0,0,0,12]});
  if(F.equipos.length) c.push({text:'Partidos por equipo',style:'h3'},chart());
  c.push({text:A._ia? 'Textos de resumen y conclusiones redactados con IA a partir exclusivamente de los datos registrados.' : 'Textos generados directamente a partir de los datos registrados.',style:'note'});
  // 02 FICHAS DE EQUIPO
  F.equipos.forEach((x,i)=>{ c.push({text:'',pageBreak:'before'}); if(i===0) c.push(...H('02','Resultados por equipo'));
    c.push({table:{widths:['*'],body:[[{stack:[{text:x.equipo,color:'#fff',fontSize:15,bold:true},{text:x.categoria,color:'#C9D2E0',fontSize:9}],fillColor:RC.navy,margin:[10,8,10,8]}]]},layout:'noBorders',margin:[0,0,0,10]});
    c.push(kv([['Capitán',x.capitan||'Sin asignar'],['Rival',`${x.rival} (${x.casa?'en casa':'fuera'})`],['Fecha y jornada',`Jornada ${x.jornada}, ${x.fecha}, ${x.hora} h`],['Resultado global',resTxt(x)],['Estado del resultado',valTxt(x)]]));
    const jug=[...new Set([...x.individuales,...x.dobles].flatMap(m=>m.jugadores))];
    c.push({text:'Jugadores participantes',style:'h3'},{text:jug.length? jug.join(', ') : (x.convocados.length? 'Convocados: '+x.convocados.join(', ') : 'Sin jugadores registrados.'),style:'p'});
    c.push({text:'Individuales',style:'h3'}, x.individuales.length? tbl(['Orden','Jugador','Marcador','Resultado'],x.individuales.map(m=>[m.n,m.jugadores.join(', ')||'–',m.marcador||'–',m.resultado+(m.nota?` (${m.nota})`:'')]),[40,'*',90,90]) : {text:'Sin partidos individuales registrados.',style:'p'});
    c.push({text:'Dobles',style:'h3'}, x.dobles.length? tbl(['Pareja','Marcador','Resultado'],x.dobles.map(m=>[m.jugadores.join(' y ')||'–',m.marcador||'–',m.resultado+(m.nota?` (${m.nota})`:'')]),['*',90,90]) : {text:'No se jugó dobles o no está registrado.',style:'p'});
    if(x.clasificacion){ c.push({unbreakable:true,stack:[{text:'Clasificación actual',style:'h3'},{text:`${x.clasificacion.posicion}º de ${x.clasificacion.equipos}, ${x.clasificacion.puntos} puntos tras ${x.clasificacion.jugadas} ${x.clasificacion.jugadas===1?'jornada':'jornadas'}.`,style:'p'},
      tbl(['Pos.','Club','PJ','Pts'],x.clasificacion.tabla.map(r=>[{text:r.pos,style:'td',bold:r.nuestro},{text:r.club,style:'td',bold:r.nuestro},{text:r.pj,style:'td'},{text:r.pts,style:'td',bold:r.nuestro}]),[34,'*',34,40])]}); }
    if(x.evolucion.length) c.push({text:'Evolución en la clasificación',style:'h3'},{text:x.evolucion.map(e=>`J${e.j}: ${e.pos}º`).join('     '),style:'p'});
  });
  // 03 INFORME DE LOS CAPITANES
  c.push({text:'',pageBreak:'before'},...H('03','Informe del capitán'));
  if(!F.equipos.length) c.push({text:'Sin eliminatorias este fin de semana.',style:'p'});
  F.equipos.forEach(x=>{ const r=x.informe_capitan; const blk=[{text:x.equipo,style:'h2'}];
    if(!r) blk.push({text:'El capitán no ha completado el informe postpartido.',style:'p',italics:true,color:RC.crimson});
    else { if(A.sintesis_capitan?.[x.equipo]) blk.push({text:[{text:'Síntesis. ',bold:true},A.sintesis_capitan[x.equipo]],style:'p'},{text:'Redactada con IA a partir de las respuestas del capitán; no añade valoraciones propias.',style:'note',margin:[0,-6,0,8]});
      blk.push(kv([['Nota de la jornada',r.nota? r.nota+' / 10':'–'],...CAP_FIELDS.map(([k,l])=>[l, r[k]||'Sin respuesta'])]),{text:`Informe de ${x.informe_por||'el capitán'}.`,style:'note'}); }
    c.push({stack:blk,unbreakable:!r||Object.keys(r).length<5,margin:[0,0,0,10]}); });
  // 04 ANÁLISIS Y MEJORAS
  c.push({text:'',pageBreak:'before'},...H('04','Análisis y mejoras'));
  c.push({text:'Rendimiento deportivo (datos objetivos)',style:'h3'});
  c.push(F.equipos.length? tbl(['Equipo','Ind. fin de semana','Dob. fin de semana','Jugadores','Ind. temporada','Dob. temporada','Eliminatorias','Racha'],F.equipos.map(x=>[x.equipo,x.fin_de_semana.individuales,x.fin_de_semana.dobles,x.fin_de_semana.jugadores_utilizados,x.temporada.individuales,x.temporada.dobles,x.temporada.eliminatorias,x.temporada.racha||'Pocos datos']),['*',46,46,40,46,46,48,62]) : {text:'Sin datos.',style:'p'});
  c.push({text:'Individuales y dobles se cuentan por separado (ganados-perdidos). La racha solo se indica con tres o más eliminatorias jugadas.',style:'note'});
  const evos=F.equipos.filter(x=>x.evolucion.length);
  c.push({text:'Evolución de los equipos',style:'h3'},{text: evos.length? '' : 'Aún no hay jornadas suficientes para mostrar una evolución.',style:'p'});
  if(evos.length) c.push(tbl(['Equipo','Posición por jornada'],evos.map(x=>[x.equipo,x.evolucion.map(e=>`J${e.j}: ${e.pos}º`).join('   ')]),[150,'*']));
  c.push({text:'Disponibilidad',style:'h3'});
  c.push(F.equipos.length? tbl(['Equipo','Disponibles','No','Por confirmar','Sin respuesta','Convocados','Observaciones'],F.equipos.map(x=>{ const v=x.disponibilidad; return [x.equipo,v.disponibles,v.no_disponibles,v.pendientes,v.sin_respuesta,v.convocados,v.problemas.length? v.problemas.join('; ') : 'Sin problemas']; }),['*',50,30,48,48,48,120]) : {text:'Sin datos.',style:'p'});
  const pend=[]; F.equipos.forEach(x=>{ const p=x.pendientes; if(p.sin_validar) pend.push([x.equipo,'Resultado pendiente de validación']); if(p.partidos_incompletos) pend.push([x.equipo,'Faltan partidos por registrar']); if(p.mvp_sin_publicar) pend.push([x.equipo,'MVP sin publicar']); if(p.sin_informe_capitan) pend.push([x.equipo,'Informe del capitán pendiente']); if(x.informe_capitan?.incidencias && !/^(ningun[ao]?|no|nada|sin incidencias|-+)\.?$/i.test(x.informe_capitan.incidencias.trim())) pend.push([x.equipo,'Incidencia comunicada: '+x.informe_capitan.incidencias]); x.disponibilidad.problemas.forEach(pr=>pend.push([x.equipo,'Disponibilidad: '+pr])); });
  F.documentacion_pendiente.forEach(dd=>pend.push([dd.equipo,`Documento «${dd.documento}»: ${dd.estado}`]));
  c.push({text:'Aspectos que requieren seguimiento',style:'h3'}, pend.length? tbl(['Equipo','Asunto'],pend,[150,'*']) : {text:'No hay resultados, documentos ni tareas pendientes.',style:'p'});
  c.push({text:'Recomendaciones',style:'h3'});
  if(A.areas_mejora?.length) c.push({ul:A.areas_mejora.map(m=>({stack:[{text:(m.equipo? m.equipo+': ' : '')+m.texto,style:'li',bold:true},{text:'Basado en: '+m.fundamento,style:'li',color:RC.grey}],margin:[0,0,0,6]})),margin:[0,0,0,8]});
  if(A.seguimiento?.length) c.push({ol:A.seguimiento.map(x=>({text:x,style:'li'})),margin:[0,0,0,8]});
  if(!A.areas_mejora?.length && !A.seguimiento?.length) c.push({text:'No hay base suficiente en los datos ni en los informes de los capitanes para proponer recomendaciones concretas.',style:'p'});
  c.push({text: A._ia? 'Recomendaciones redactadas con IA a partir exclusivamente de los datos y de lo escrito por los capitanes; cada una indica en qué se basa.' : 'Recomendaciones generadas directamente a partir de los pendientes registrados.',style:'note'});
  // 06 PRÓXIMO FIN DE SEMANA
  c.push({text:'',pageBreak:'before'},...H('05','Próximas jornadas'),{text:'Fin de semana del '+F.proximo_fin_de_semana.fechas,style:'p',bold:true});
  const nx=F.proximo_fin_de_semana.eliminatorias;
  c.push(nx.length? tbl(['Equipo','Jornada','Fecha y hora','Rival','Tareas pendientes del capitán'],nx.map(x=>[x.equipo,x.jornada,`${x.fecha}, ${x.hora} h`,`${x.rival} (${x.casa?'casa':'fuera'})`,x.tareas.length? x.tareas.join('; ') : 'Al día']),[90,38,90,100,'*']) : {text:'Ningún equipo del club tiene eliminatoria programada el próximo fin de semana.',style:'p'});
  return { pageSize:'A4', pageMargins:[50,72,50,62], info:{title:'Weekend Sports Report | '+F.club+' | '+F.fin_de_semana, author:F.club, subject:'Informe deportivo semanal'},
    background:(page)=> page===1? {canvas:[{type:'rect',x:0,y:0,w:595.28,h:841.89,color:RC.navy},{type:'rect',x:0,y:828,w:595.28,h:13.5,color:RC.crimson}]} : null,
    header:(page)=> page===1? null : {margin:[50,26,50,0],columns:[{image:crest,width:16},{text:'WEEKEND SPORTS REPORT',fontSize:7.5,bold:true,color:RC.navy,characterSpacing:1.5,margin:[8,4,0,0]},{text:`${F.club}  |  ${F.fin_de_semana}`,fontSize:7.5,color:RC.grey,alignment:'right',margin:[0,4,0,0]}]},
    footer:(page,pages)=> page===1? null : {margin:[50,20,50,0],columns:[{text:`Documento interno  |  Generado el ${gen}`,fontSize:7,color:RC.grey},{text:`Página ${page} de ${pages}`,fontSize:7,color:RC.grey,alignment:'right'}]},
    content:c, defaultStyle:{font:'Roboto',fontSize:9.5,color:RC.ink,lineHeight:1.25},
    styles:{kicker:{fontSize:8,bold:true,color:RC.gold,characterSpacing:1.6},h1:{fontSize:22,bold:true,color:RC.navy},h2:{fontSize:13,bold:true,color:RC.navy,margin:[0,6,0,6]},h3:{fontSize:10.5,bold:true,color:RC.navy,margin:[0,8,0,6]},
      p:{fontSize:9.5,margin:[0,0,0,10],lineHeight:1.35},li:{fontSize:9.5,lineHeight:1.3},note:{fontSize:7.5,color:RC.grey,italics:true,margin:[0,0,0,10]},
      th:{fontSize:7.5,bold:true,color:RC.navy,characterSpacing:.3},td:{fontSize:8.8},k:{fontSize:8.5,color:RC.grey},v:{fontSize:9,bold:true,color:RC.ink}} };
}
return { build: buildReportDoc, RC, CAP_FIELDS };
});
