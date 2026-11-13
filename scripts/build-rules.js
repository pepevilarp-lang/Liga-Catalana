#!/usr/bin/env node
// Genera firestore.rules. Las reglas de los datos de un club se escriben una sola vez (DATA) y se aplican en dos sitios:
//   - en la raíz de la base de datos: los datos actuales del Real Club de Polo (c = '')
//   - en clubs/<club>/: los datos de cada club después de la migración multiclub (c = club)
// Uso: node scripts/build-rules.js   (escribe firestore.rules; después se publica a mano en Firebase)
const fs = require('fs'), path = require('path');

const DATA = (C) => `
      // Configuración del club (temporadas, equipos, gestores, informe automático, capitanes)
      match /meta/{doc} {
        allow read: if canRead(${C});
        allow create: if isAdmin() || (isManager(${C}) && !request.resource.data.keys().hasAny(['managers', 'managerEmails', 'openClaims']));
        allow update: if isAdmin() || (isManager(${C})
          && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['managers', 'managerEmails', 'openClaims']));
        allow delete: if isAdmin();
      }
      // Ficha ligada a una cuenta de Google: una por jugador y una por cuenta. Solo con invitación válida
      // (o si un administrador abre el acceso con meta/app.openClaims = true).
      match /claims/{pid} {
        allow read: if isStaff(${C}) || isCaptainAny(${C}) || (signedIn() && resource.data.email == email());
        allow create: if signedIn() && notLinked(${C}) && mActive(${C})
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.email == email()
          && (openClaims(${C}) || inviteOk(${C}, pid));
        allow update: if signedIn() && mActive(${C})
          && resource.data.email == email()
          && request.resource.data.email == email()
          && request.resource.data.uid == request.auth.uid;
        allow delete: if isStaff(${C});
      }
      // Invitaciones individuales: de jugador (las crean capitanes de ese equipo y la gestión) o de gestor (solo la gestión).
      // Un solo uso, caducan, se pueden revocar y, si llevan correo, solo las puede usar esa cuenta.
      match /invites/{code} {
        allow get: if signedIn();
        allow list: if isStaff(${C}) || (resource.data.get('season', '') != '' && isCaptainOf(${C}, resource.data.season));
        allow create: if signedIn()
          && request.resource.data.by == request.auth.uid
          && request.resource.data.get('usedBy', null) == null
          && request.resource.data.get('revoked', false) == false
          && request.resource.data.exp is int
          && request.resource.data.exp <= request.time.toMillis() + 2678400000
          && ((request.resource.data.get('role', 'jugador') == 'gestor' && isStaff(${C}) && request.resource.data.club == cid(${C}))
            || (request.resource.data.get('role', 'jugador') in ['jugador', 'capitan'] && request.resource.data.pid is string
                && canPrivate(${C}, request.resource.data.season)
                && (request.resource.data.get('role', 'jugador') == 'jugador' || isStaff(${C}))));
        // Usarla: la marca como usada quien se vincula, en el mismo lote que crea su ficha o su miembro de club
        allow update: if signedIn() && invValid(resource.data)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['usedBy', 'usedAt'])
          && request.resource.data.usedBy == request.auth.uid
          && ((resource.data.get('role', 'jugador') == 'gestor'
                && 'gestor' in getAfter(D('clubs/' + resource.data.club + '/members/' + request.auth.uid)).data.roles)
            || (resource.data.get('role', 'jugador') != 'gestor'
                && getAfter(D(R(${C}) + 'claims/' + resource.data.pid)).data.uid == request.auth.uid));
        // Reenviar o revocar (sin poder cambiar a quién ni para qué es)
        allow update: if resource.data.get('usedBy', null) == null
          && (isStaff(${C}) || (resource.data.get('role', 'jugador') != 'gestor' && canPrivate(${C}, resource.data.season)))
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['revoked', 'revokedAt', 'revokedBy', 'email', 'sentTo', 'sentAt', 'sends', 'exp'])
          && request.resource.data.exp <= request.time.toMillis() + 2678400000;
        allow delete: if isStaff(${C}) || (resource.data.get('role', 'jugador') != 'gestor' && canPrivate(${C}, resource.data.season));
      }
      // Acceso sin invitación (copia de meta/app.openClaims para la pantalla de entrada)
      match /public/access {
        allow read: if signedIn();
        allow write: if isAdmin();
      }
      // Lista de nombres por equipo (menú de equipos y nombres de la plantilla): solo miembros del club
      match /public/{doc} {
        allow read: if canRead(${C});
        allow write: if (isStaff(${C}) || isCaptainAny(${C})) && doc != 'access';
      }
      // Fotos recortadas (una por jugador; _team… = fotos de equipo): las sube el propio jugador, su capitán o la gestión
      match /photos/{id} {
        allow read: if canRead(${C});
        allow create, update: if (isMe(${C}, id) || isStaff(${C}) || isCaptainAny(${C}))
          && request.resource.data.d is string && request.resource.data.d.size() < 950000;
        allow delete: if isMe(${C}, id) || isStaff(${C}) || isCaptainAny(${C});
      }
      // Ficha de tenista: la lee el club; la edita su dueño o la gestión
      match /profiles/{pid} {
        allow read: if canRead(${C});
        allow write: if isMe(${C}, pid) || isStaff(${C});
      }
      // Teléfonos (recordatorios y WhatsApp): el propio jugador, los capitanes y la gestión
      match /phones/{pid} {
        allow read, write: if isMe(${C}, pid) || isStaff(${C}) || isCaptainAny(${C});
      }
      // Tokens de notificaciones: cada jugador añade los suyos; solo los lee el servidor
      match /pushTokens/{pid} {
        allow read: if isAdmin();
        allow create, update: if isMe(${C}, pid) || isStaff(${C});
        allow delete: if isAdmin();
      }
      // Registro de envíos del resumen semanal
      match /reports/{id} {
        allow read: if isStaff(${C});
        allow create: if isStaff(${C});
        allow update, delete: if isAdmin();
      }
      // Uso antiguo, solo administradores
      match /private/{doc} { allow read, write: if isAdmin(); }

      // Temporada de cada equipo: la ven sus jugadores (memberIds), sus capitanes y la gestión del club
      match /seasons/{s} {
        allow read: if teamRead(${C}, s);
        allow create: if isStaff(${C});
        // Capitanes, plantilla con acceso (memberIds), reglas y equipo: solo la gestión (la plantilla, también el capitán)
        allow update: if canEdit(${C}, s) && (isStaff(${C}) || (
          request.resource.data.get('rules', {}) == resource.data.get('rules', {}) &&
          request.resource.data.get('captains', []) == resource.data.get('captains', []) &&
          (isCaptainOf(${C}, s) || request.resource.data.get('memberIds', null) == resource.data.get('memberIds', null)) &&
          request.resource.data.get('teamId', null) == resource.data.get('teamId', null)));
        allow delete: if isAdmin();

        // Disponibilidad: la ve el equipo, cada uno escribe la suya; quien gestiona puede anotar a mano
        match /avail/{pid} { allow read: if teamRead(${C}, s); allow write: if (isMe(${C}, pid) && inTeam(${C}, s)) || canEdit(${C}, s); }
        // Comentarios de disponibilidad: su autor, capitanes y gestión
        match /availNotes/{pid} { allow read, write: if (isMe(${C}, pid) && inTeam(${C}, s)) || canPrivate(${C}, s); }
        // Pronósticos
        match /picks/{pid} { allow read: if teamRead(${C}, s); allow write: if (isMe(${C}, pid) && inTeam(${C}, s)) || isStaff(${C}); }
        // Encuestas postpartido: privadas
        match /ballots/{pid} { allow read, write: if (isMe(${C}, pid) && inTeam(${C}, s)) || canPrivate(${C}, s); }
        // Documentos (troceados) y fotos diarias de la temporada
        match /docs/{id} {
          allow read: if teamRead(${C}, s);
          allow write: if canEdit(${C}, s);
          match /chunks/{n} { allow read: if teamRead(${C}, s); allow write: if canEdit(${C}, s); }
        }
        match /snapshots/{d} { allow read: if teamRead(${C}, s); allow write: if canEdit(${C}, s); }

        // MVP de cada jornada. Recuento para el equipo; quién votó a quién, privado.
        // Un voto por jugador del equipo, nunca a uno mismo y sin poder cambiarlo. Solo capitanes y gestión anulan.
        match /mvp/{k} {
          allow read: if teamRead(${C}, s);
          allow write: if canPrivate(${C}, s) || validVoteTally(${C}, s, k);
          match /votes/{voter} {
            allow read: if isMe(${C}, voter) || canPrivate(${C}, s);
            allow create: if isMe(${C}, voter) && inTeam(${C}, s)
              && request.resource.data.keys().hasOnly(['v', 'at'])
              && request.resource.data.v is string
              && request.resource.data.v != voter
              && existsAfter(D(R(${C}) + 'seasons/' + s + '/mvp/' + k));
            allow update: if false;
            allow delete: if canPrivate(${C}, s);
          }
        }
      }`;

const RULES = `rules_version = '2';
// ARCHIVO GENERADO por scripts/build-rules.js: no lo edites a mano (edita el script y ejecútalo).
// Se publica a mano: Firebase > Firestore Database > Reglas > pegar este archivo > Publicar.
//
// Modelo de acceso (docs/MULTICLUB.md):
//   - Administrador de la plataforma: colección admins (id = UID o correo en minúsculas). Todo.
//   - Gestor de un club: clubs/<club>/members/<uid> con roles ['gestor'] (o, en el club original, meta/app.managerEmails).
//     Gestiona solo su club.
//   - Capitán: su ficha está en seasons/<temporada>.captains (lo asigna un gestor). Gestiona solo sus equipos.
//   - Jugador: su ficha está en seasons/<temporada>.memberIds. Ve solo sus equipos.
//   - Pertenencia al club: clubs/<club>/members/<uid> (status 'inactivo' = desactivado: no ve nada del club).
//   - Entrar como jugador o capitán exige una invitación individual (invites/<código>): un uso, caducidad, revocable.
//   - Elegir un rol en la pantalla de entrada no da permisos: todo se decide aquí.
// Datos de cada club: en la raíz (Real Club de Polo, antes de migrar) y en clubs/<club>/ (después). Mismas reglas.
// Las funciones de Vercel (api/*) usan la cuenta de servicio y comprueban los permisos ellas mismas (api/_auth.js).
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null && request.auth.token.email_verified == true; }
    function email() { return request.auth.token.email.lower(); }
    function D(p) { return path('/databases/' + database + '/documents/' + p); }
    function isAdmin() {
      return signedIn() && (exists(D('admins/' + request.auth.uid)) || exists(D('admins/' + email())));
    }

    // c = dónde están los datos del club: '' = la raíz (Real Club de Polo antes de migrar), '<id>' = clubs/<id>/
    function cid(c) { return c == '' ? 'rcpb' : c; }
    function R(c) { return c == '' ? '' : 'clubs/' + c + '/'; }
    // Para reglas que reciben el id del club: dónde están hoy sus datos (el Polo sigue en la raíz hasta que se marca migrated)
    function dc(club) {
      return club == 'rcpb' && !(exists(D('clubs/rcpb')) && get(D('clubs/rcpb')).data.get('migrated', false) == true) ? '' : club;
    }

    // Pertenencia al club
    function mref(c) { return D('clubs/' + cid(c) + '/members/' + request.auth.uid); }
    function hasM(c) { return exists(mref(c)); }
    function mdata(c) { return get(mref(c)).data; }
    function mActive(c) { return !hasM(c) || mdata(c).get('status', 'activo') != 'inactivo'; }
    function metaRef(c) { return D(R(c) + 'meta/app'); }
    function metaOf(c) { return get(metaRef(c)).data; }
    function isManager(c) {
      return signedIn() && mActive(c) && (
        (hasM(c) && 'gestor' in mdata(c).get('roles', []))
        || (exists(metaRef(c)) && email() in metaOf(c).get('managerEmails', [])));
    }
    function isStaff(c) { return isAdmin() || isManager(c); }
    function uref() { return D('users/' + request.auth.uid); }
    // Jugador del club: ficha vinculada (users/<uid> en la raíz; clubs/<club>/members/<uid>.pid después de migrar) y no desactivado
    // En la raíz, la ficha cuenta solo si su vínculo (claims/<pid>) sigue siendo de esta cuenta: desvincular quita el acceso
    function rootLinked() {
      return exists(uref()) && exists(D('claims/' + get(uref()).data.pid))
        && get(D('claims/' + get(uref()).data.pid)).data.get('uid', '') == request.auth.uid;
    }
    function isMember(c) {
      return signedIn() && mActive(c) && (c == '' ? rootLinked() : (hasM(c) && mdata(c).get('pid', '') != ''));
    }
    function myPid(c) { return c == '' ? get(uref()).data.pid : mdata(c).pid; }
    function notLinked(c) { return c == '' ? !rootLinked() : !(hasM(c) && mdata(c).get('pid', '') != ''); }
    function isMe(c, pid) { return isMember(c) && myPid(c) == pid; }
    function canRead(c) { return isMember(c) || isStaff(c); }

    // Equipos (una temporada por equipo)
    function season(c, s) { return get(D(R(c) + 'seasons/' + s)).data; }
    function isCaptainOf(c, s) { return isMember(c) && myPid(c) in season(c, s).get('captains', []); }
    // Capitán de algún equipo del club: meta/app.captainPids (lo mantiene la app al asignar capitanes)
    function isCaptainAny(c) { return isMember(c) && exists(metaRef(c)) && myPid(c) in metaOf(c).get('captainPids', []); }
    // Jugador del equipo. Temporadas antiguas sin el campo memberIds: cualquier jugador del club (se rellena al guardar)
    function inTeam(c, s) {
      let ids = season(c, s).get('memberIds', null);
      return isMember(c) && (ids == null || myPid(c) in ids);
    }
    function teamRead(c, s) { return isStaff(c) || inTeam(c, s) || isCaptainOf(c, s); }
    function teamManage(c, s) { return season(c, s).get('rules', {}).get('teamManage', true) != false; }
    // Editar la temporada del equipo (calendario, convocatoria, resultados, documentos...)
    function canEdit(c, s) { return isStaff(c) || isCaptainOf(c, s) || (teamManage(c, s) && inTeam(c, s)); }
    // Datos privados del equipo (respuestas individuales, comentarios, quién votó a quién)
    function canPrivate(c, s) { return isStaff(c) || isCaptainOf(c, s); }

    // Invitaciones
    function openClaims(c) { return exists(metaRef(c)) && metaOf(c).get('openClaims', false) == true; }
    function invValid(d) {
      return d.get('usedBy', null) == null && d.get('revoked', false) != true && d.exp > request.time.toMillis()
        && (d.get('email', '') == '' || d.email == email());
    }
    // El código existe, es de ese jugador, sigue siendo válido y se marca como usado en el mismo lote
    function inviteOk(c, pid) {
      let code = request.resource.data.get('invite', '-');
      let inv = D(R(c) + 'invites/' + string(code));
      return code is string && code.size() >= 6 && exists(inv)
        && get(inv).data.pid == pid && invValid(get(inv).data)
        && getAfter(inv).data.usedBy == request.auth.uid;
    }
    // Invitación de gestor válida para ese club, usada en el mismo lote por quien se da de alta
    function gestorInviteOk(club, uid) {
      let code = request.resource.data.get('invite', '-');
      let inv = D(R(dc(club)) + 'invites/' + string(code));
      return signedIn() && uid == request.auth.uid && code is string && code.size() >= 6 && exists(inv)
        && get(inv).data.get('role', '') == 'gestor' && get(inv).data.club == club
        && invValid(get(inv).data)
        && getAfter(inv).data.usedBy == request.auth.uid
        && request.resource.data.roles == ['gestor'];
    }
    // Alta de un jugador como miembro del club, en el mismo lote que vincula su ficha con una invitación
    function playerJoinOk(club, uid) {
      let d = request.resource.data;
      return signedIn() && uid == request.auth.uid && d.email == email()
        && d.roles == ['jugador'] && d.get('status', 'activo') == 'activo' && d.pid is string
        && getAfter(D(R(dc(club)) + 'claims/' + d.pid)).data.uid == uid;
    }

    // El recuento solo sube en uno, y solo para el jugador del voto que se crea en el mismo lote
    function validVoteTally(c, s, k) {
      let vote = D(R(c) + 'seasons/' + s + '/mvp/' + k + '/votes/' + myPid(c));
      let v = getAfter(vote).data.v;
      let before = resource == null ? {} : resource.data;
      let t0 = before.get('t', {});
      let t1 = request.resource.data.get('t', {});
      return inTeam(c, s) && !exists(vote) && existsAfter(vote)
        && request.resource.data.diff(before).affectedKeys().hasOnly(['t', 'n'])
        && request.resource.data.get('n', 0) == before.get('n', 0) + 1
        && t1.diff(t0).affectedKeys().hasOnly([v])
        && t1.get(v, 0) == t0.get(v, 0) + 1;
    }

    // ---------- Plataforma ----------
    // Administradores: se crean a mano en la consola
    match /admins/{id} {
      allow read: if signedIn() && (id == request.auth.uid || id == email());
      allow write: if false;
    }
    // Cuenta → ficha del club original (antes de migrar)
    match /users/{uid} {
      allow read: if signedIn() && (uid == request.auth.uid || isAdmin());
      allow create, update: if signedIn() && uid == request.auth.uid && mActive('')
        && request.resource.data.email == email()
        && getAfter(D('claims/' + request.resource.data.pid)).data.uid == uid;
      allow delete: if isAdmin() || uid == request.auth.uid;
    }
    // Catálogo de clubes de la FCT (datos públicos; lo usa el buscador de gestores antes de iniciar sesión)
    match /catalog/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    // Solicitudes de acceso: las crea el interesado; las resuelve la plataforma, un gestor de ese club
    // o, si es de jugador con equipo, el capitán de ese equipo.
    function reqCaptain() {
      return resource.data.get('role', '') == 'jugador' && resource.data.get('season', '') != ''
        && isCaptainOf(dc(resource.data.clubId), resource.data.season);
    }
    match /clubRequests/{uid} {
      allow read: if signedIn() && (uid == request.auth.uid || isAdmin() || isManager(dc(resource.data.clubId)) || reqCaptain());
      allow create, update: if signedIn() && uid == request.auth.uid
        && request.resource.data.uid == uid
        && request.resource.data.email == email()
        && request.resource.data.role in ['gestor', 'jugador']
        && request.resource.data.status == 'pendiente'
        && (resource == null || resource.data.status != 'aprobada');
      allow update: if isAdmin() || (isManager(dc(resource.data.clubId)) && request.resource.data.clubId == resource.data.clubId)
        || (reqCaptain() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'invite', 'pid', 'decidedBy', 'decidedByEmail', 'decidedAt']));
      allow delete: if isAdmin() || (uid == request.auth.uid && resource.data.status != 'aprobada');
    }

    // ---------- Datos del club original en la raíz (Real Club de Polo) ----------
${DATA("''")}

    // ---------- Cada club: identidad, miembros, historial y (después de migrar) sus datos ----------
    match /clubs/{club} {
      // Identidad (nombre corto, escudo, colores, portada, temporada activa) y progreso de la configuración inicial
      allow read: if signedIn();
      allow create: if isAdmin() || (isManager(dc(club)) && !request.resource.data.keys().hasAny(['migrated', 'status', 'plan', 'fctId']));
      allow update: if isAdmin() || (isManager(dc(club))
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['migrated', 'status', 'plan', 'fctId']));
      allow delete: if false;

      // Pertenencia de cada cuenta al club: roles (gestor, jugador), ficha y estado (activo / inactivo)
      match /members/{uid} {
        allow read: if signedIn() && (uid == request.auth.uid || isAdmin() || isManager(dc(club)));
        allow create: if isAdmin() || isManager(dc(club)) || gestorInviteOk(club, uid) || playerJoinOk(club, uid);
        allow update, delete: if isAdmin() || isManager(dc(club));
      }
      // Historial de acciones sensibles: solo se añade; nadie lo edita ni lo borra
      match /audit/{id} {
        allow read: if isStaff(dc(club));
        allow create: if signedIn() && request.resource.data.by == request.auth.uid && request.resource.data.at is int
          && request.resource.data.action is string
          && (isStaff(dc(club)) || isCaptainAny(dc(club)) || (request.resource.data.action == 'invitacion-aceptada' && isMember(dc(club))));
        allow update, delete: if false;
      }
${DATA('club').replace(/\n/g, '\n  ')}
    }
  }
}
`;

const out = path.join(__dirname, '..', 'firestore.rules');
fs.writeFileSync(out, RULES);
console.log('firestore.rules generado (' + RULES.split('\n').length + ' líneas)');
