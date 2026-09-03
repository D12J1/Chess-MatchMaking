let appData = {
  grupos: [],
  grupoSeleccionadoId: null,
  activeTab: 'dashboard',
  busquedaPartidas: ''
};

window.onload = () => {
  const local = localStorage.getItem('chess_app_v4');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      appData = { ...appData, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }
  if (!Array.isArray(appData.grupos)) appData.grupos = [];
  cambiarTab(appData.activeTab || 'dashboard');
};

function guardar() {
  localStorage.setItem('chess_app_v4', JSON.stringify(appData));
}

function cambiarTab(tab) {
  appData.activeTab = tab;
  guardar();

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const btn = document.querySelector(`.tab-btn[onclick="cambiarTab('${tab}')"]`);
  const content = document.getElementById(`tab-${tab}`);

  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  render();
}

function crearGrupo() {
  const inputName = document.getElementById('group-name-input');
  const inputBanner = document.getElementById('group-banner-input');
  if (!inputName) return;

  const nombre = inputName.value.trim();
  if (!nombre) return alert('Escribe un nombre para el torneo');

  const nuevoGrupo = {
    id: Date.now(),
    nombre: nombre,
    banner: inputBanner ? inputBanner.value.trim() : '',
    jugadores: [],
    partidas: [],
    generado: false
  };

  appData.grupos.push(nuevoGrupo);
  appData.grupoSeleccionadoId = nuevoGrupo.id;
  inputName.value = '';
  if (inputBanner) inputBanner.value = '';
  guardar();
  cambiarTab('partidas');
}

function abrirAjustesGrupo(id) {
  const grupo = appData.grupos.find(g => g.id === id);
  if (!grupo) return;

  const opcion = prompt(`Ajustes de "${grupo.nombre}":\n1. Cambiar nombre\n2. Cambiar banner (URL)\n\nIngresa 1 o 2:`);
  
  if (opcion === '1') {
    const nuevoNombre = prompt('Nuevo nombre del torneo:', grupo.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
      grupo.nombre = nuevoNombre.trim();
      guardar();
      render();
    }
  } else if (opcion === '2') {
    const nuevoBanner = prompt('URL del banner (déjalo vacío para eliminarlo):', grupo.banner || '');
    if (nuevoBanner !== null) {
      grupo.banner = nuevoBanner.trim();
      guardar();
      render();
    }
  }
}

function eliminarGrupo(id) {
  if (confirm('¿Eliminar este torneo?')) {
    appData.grupos = appData.grupos.filter(g => g.id !== id);
    if (appData.grupoSeleccionadoId === id) {
      appData.grupoSeleccionadoId = appData.grupos.length > 0 ? appData.grupos[0].id : null;
    }
    guardar();
    render();
  }
}

function seleccionarGrupo(id, redireccionarA = null) {
  appData.grupoSeleccionadoId = id;
  guardar();
  if (redireccionarA) {
    cambiarTab(redireccionarA);
  } else {
    render();
  }
}

function agregarJugador(grupoId) {
  const input = document.getElementById('new-player-input');
  if (!input) return;
  const nombre = input.value.trim();
  if (!nombre) return;

  const grupo = appData.grupos.find(g => g.id === grupoId);
  if (!grupo) return;

  grupo.jugadores.push({ id: Date.now(), nombre: nombre, foto: '', puntos: 0 });
  input.value = '';
  guardar();
  render();
}

function abrirAjustesJugador(grupoId, jugadorId) {
  const grupo = appData.grupos.find(g => g.id === grupoId);
  if (!grupo) return;
  const jugador = grupo.jugadores.find(j => j.id === jugadorId);
  if (!jugador) return;

  const opcion = prompt(`Ajustes de "${jugador.nombre}":\n1. Cambiar nombre\n2. Cambiar foto de perfil (URL)\n\nIngresa 1 o 2:`);

  if (opcion === '1') {
    const nuevoNombre = prompt('Nuevo nombre del jugador:', jugador.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
      jugador.nombre = nuevoNombre.trim();
      guardar();
      render();
    }
  } else if (opcion === '2') {
    const nuevaFoto = prompt('URL de la foto de perfil (déjalo vacío para eliminarla):', jugador.foto || '');
    if (nuevaFoto !== null) {
      jugador.foto = nuevaFoto.trim();
      guardar();
      render();
    }
  }
}

function eliminarJugador(grupoId, jugadorId) {
  const grupo = appData.grupos.find(g => g.id === grupoId);
  if (grupo) {
    grupo.jugadores = grupo.jugadores.filter(j => j.id !== jugadorId);
    if (grupo.generado) {
      if (grupo.jugadores.length < 2) {
        grupo.partidas = [];
        grupo.generado = false;
        recalcularPuntos(grupo);
        guardar();
        render();
      } else {
        recalcularPartidas(grupoId);
      }
    } else {
      recalcularPuntos(grupo);
      guardar();
      render();
    }
  }
}

function restablecerPartidas(grupoId) {
  if (confirm('¿Restablecer el calendario y borrar los resultados jugados?')) {
    generarPartidas(grupoId, true);
  }
}

function recalcularPartidas(grupoId) {
  generarPartidas(grupoId, false);
}

function generarPartidas(grupoId, reset = true) {
  const grupo = appData.grupos.find(g => g.id === grupoId);
  if (!grupo) return;
  if (grupo.jugadores.length < 2) return alert('Mínimo 2 participantes para generar el torneo.');

  const partidasAnteriores = grupo.partidas || [];

  let players = [...grupo.jugadores];
  if (players.length % 2 !== 0) {
    players.push(null);
  }

  const n = players.length;
  const numRondas = n - 1;
  const half = n / 2;

  grupo.partidas = [];

  for (let r = 0; r < numRondas; r++) {
    for (let i = 0; i < half; i++) {
      const p1 = players[i];
      const p2 = players[n - 1 - i];

      if (p1 !== null && p2 !== null) {
        let resultado = '';
        if (!reset) {
          const jugada = partidasAnteriores.find(p =>
            !p.isDescanso &&
            p.resultado && p.resultado !== '' &&
            ((p.j1Id === p1.id && p.j2Id === p2.id) || (p.j1Id === p2.id && p.j2Id === p1.id))
          );
          if (jugada) {
            if (jugada.j1Id === p1.id && jugada.j2Id === p2.id) {
              resultado = jugada.resultado;
            } else {
              if (jugada.resultado === '1-0') resultado = '0-1';
              else if (jugada.resultado === '0-1') resultado = '1-0';
              else resultado = jugada.resultado;
            }
          }
        }

        grupo.partidas.push({
          id: Date.now() + Math.random(),
          jornada: r + 1,
          j1Id: p1.id,
          j2Id: p2.id,
          resultado: resultado
        });
      } else {
        const descansando = p1 || p2;
        if (descansando) {
          grupo.partidas.push({
            id: Date.now() + Math.random(),
            jornada: r + 1,
            descansaId: descansando.id,
            isDescanso: true
          });
        }
      }
    }
    players.splice(1, 0, players.pop());
  }

  grupo.generado = true;
  recalcularPuntos(grupo);
  guardar();
  render();
}

function actualizarResultado(grupoId, partidaId, resultado) {
  const grupo = appData.grupos.find(g => g.id === grupoId);
  if (!grupo) return;
  const partida = grupo.partidas.find(p => p.id === partidaId);
  if (partida) partida.resultado = resultado;

  recalcularPuntos(grupo);
  guardar();
  render();
}

function recalcularPuntos(grupo) {
  grupo.jugadores.forEach(j => j.puntos = 0);

  grupo.partidas.forEach(p => {
    if (p.isDescanso) return;
    const j1 = grupo.jugadores.find(j => j.id === p.j1Id);
    const j2 = grupo.jugadores.find(j => j.id === p.j2Id);

    if (j1 && j2) {
      if (p.resultado === '1-0') j1.puntos += 1;
      else if (p.resultado === '0-1') j2.puntos += 1;
      else if (p.resultado === '0.5-0.5') { j1.puntos += 0.5; j2.puntos += 0.5; }
    }
  });
}

function filtrarPartidas(val) {
  appData.busquedaPartidas = val;
  render();
  const input = document.getElementById('search-match-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function exportarDatos() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `torneos_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importarDatos(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && typeof parsed === 'object') {
        appData = { ...appData, ...parsed };
        if (!Array.isArray(appData.grupos)) appData.grupos = [];
        guardar();
        render();
        alert('Datos importados correctamente.');
      } else {
        alert('Archivo JSON no válido.');
      }
    } catch (err) {
      alert('Error al procesar el archivo JSON.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function borrarTodo() {
  if (confirm('¿Estás seguro de que deseas borrar todos los datos?')) {
    appData = { grupos: [], grupoSeleccionadoId: null, activeTab: 'dashboard', busquedaPartidas: '' };
    guardar();
    render();
  }
}

function renderBannerHTML(bannerUrl) {
  if (!bannerUrl) return '';
  return `<div style="width: 100%; height: 140px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px; border: 1px solid var(--card-border);">
    <img src="${bannerUrl}" alt="Banner del Torneo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
  </div>`;
}

function render() {
  const grupoActivo = appData.grupos.find(g => g.id === appData.grupoSeleccionadoId);

  const subHeader = document.getElementById('subheading-active-group');
  if (subHeader) {
    subHeader.innerHTML = grupoActivo 
      ? `<span class="badge badge-active"><i class="fa-solid fa-bolt"></i> Torneo Activo</span> <strong style="color: var(--text-main);">${grupoActivo.nombre}</strong>` 
      : 'Selecciona o crea un torneo para comenzar';
  }

  // Dashboard Stats
  const elTorneos = document.getElementById('stat-torneos');
  const elJugadores = document.getElementById('stat-jugadores');
  const elPartidas = document.getElementById('stat-partidas');
  if (elTorneos) elTorneos.innerText = appData.grupos.length;
  if (elJugadores) elJugadores.innerText = appData.grupos.reduce((a, g) => a + g.jugadores.length, 0);
  if (elPartidas) elPartidas.innerText = appData.grupos.reduce((a, g) => a + (g.partidas ? g.partidas.filter(p => !p.isDescanso).length : 0), 0);

  const recentCont = document.getElementById('dashboard-recent');
  if (recentCont) {
    if (!grupoActivo) {
      recentCont.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-trophy"></i></div>
          <p>No hay torneo seleccionado actualmente.</p>
          <button style="margin-top: 12px;" onclick="cambiarTab('crear')"><i class="fa-solid fa-plus"></i> Crear Nuevo Torneo</button>
        </div>`;
    } else {
      const partidasReales = grupoActivo.partidas.filter(p => !p.isDescanso);
      const completadas = partidasReales.filter(p => p.resultado !== '').length;
      const porcentaje = partidasReales.length ? Math.round((completadas / partidasReales.length) * 100) : 0;

      recentCont.innerHTML = `
        ${renderBannerHTML(grupoActivo.banner)}
        <h2><i class="fa-solid fa-fire" style="color: #f59e0b;"></i> ${grupoActivo.nombre}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="background: var(--input-bg); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Jugadores</span>
            <strong style="font-size: 1.2rem;">👥 ${grupoActivo.jugadores.length}</strong>
          </div>
          <div style="background: var(--input-bg); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Progreso</span>
            <strong style="font-size: 1.2rem;">🎯 ${porcentaje}%</strong>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
            <span>Partidas Completadas</span>
            <span><b>${completadas}</b> de <b>${partidasReales.length}</b></span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${porcentaje}%;"></div>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="cambiarTab('partidas')"><i class="fa-solid fa-gamepad"></i> Ir a Partidas</button>
          <button class="btn-secondary" onclick="cambiarTab('clasificacion')"><i class="fa-solid fa-ranking-star"></i> Ver Tabla</button>
        </div>
      `;
    }
  }

  // Lista de Torneos (Mis Torneos)
  const listaCont = document.getElementById('lista-grupos-container');
  if (listaCont) {
    if (appData.grupos.length === 0) {
      listaCont.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
          <p>Aún no has creado ningún torneo.</p>
        </div>`;
    } else {
      listaCont.innerHTML = appData.grupos.map(g => {
        const esSeleccionado = g.id === appData.grupoSeleccionadoId;
        return `
          <div class="card" style="padding: 0; margin-bottom: 16px; ${esSeleccionado ? 'border: 2px solid #10b981; box-shadow: 0 0 16px rgba(16, 185, 129, 0.2);' : ''}">
            ${g.banner ? `<div style="height: 110px; overflow: hidden;"><img src="${g.banner}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'"></div>` : ''}
            <div style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px;">
                  ${g.nombre} 
                  ${esSeleccionado ? '<span class="badge badge-active"><i class="fa-solid fa-check"></i> Activo</span>' : ''}
                </h3>
                <span style="color: var(--text-muted); font-size: 0.85rem;">
                  <i class="fa-solid fa-users"></i> ${g.jugadores.length} jugadores &nbsp;|&nbsp; 
                  <i class="fa-solid fa-calendar-days"></i> ${g.generado ? 'Calendario Generado' : 'Sin generar'}
                </span>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="seleccionarGrupo(${g.id}, 'partidas')"><i class="fa-solid fa-play"></i> Gestionar</button>
                <button class="btn-secondary" onclick="abrirAjustesGrupo(${g.id})"><i class="fa-solid fa-gear"></i> Ajustes</button>
                <button class="btn-danger btn-sm" onclick="eliminarGrupo(${g.id})"><i class="fa-solid fa-xmark"></i></button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Partidas
  const partidasCont = document.getElementById('partidas-container');
  if (partidasCont) {
    if (!grupoActivo) {
      partidasCont.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-hand-pointer"></i></div>
          <p>Selecciona un torneo en "Mis Torneos" para administrar sus enfrentamientos.</p>
        </div>`;
    } else {
      let enfrentamientosHTML = '';

      if (grupoActivo.generado) {
        const jornadasMap = {};
        const descansosMap = {};

        grupoActivo.partidas.forEach(p => {
          const jNum = p.jornada || 1;
          if (p.isDescanso) {
            descansosMap[jNum] = p.descansaId;
          } else {
            if (!jornadasMap[jNum]) jornadasMap[jNum] = [];
            jornadasMap[jNum].push(p);
          }
        });

        const q = (appData.busquedaPartidas || '').toLowerCase().trim();

        enfrentamientosHTML = `
          <div class="card">
            <h2><i class="fa-solid fa-calendar-week" style="color: #6366f1;"></i> Enfrentamientos por Jornada</h2>
            <div class="form-group" style="margin-bottom: 20px;">
              <input type="text" id="search-match-input" placeholder="🔍 Buscar jugador o jornada..." value="${appData.busquedaPartidas || ''}" oninput="filtrarPartidas(this.value)">
            </div>
            ${Object.keys(jornadasMap).map(jNum => {
              const descansaPlayer = grupoActivo.jugadores.find(j => j.id === descansosMap[jNum]);
              const descansaTexto = descansaPlayer ? `Descansa: ${descansaPlayer.nombre}` : '';
              const descansaCoincide = descansaTexto.toLowerCase().includes(q);

              const listPartidas = jornadasMap[jNum] || [];
              const partidasFiltradas = listPartidas.filter(p => {
                const j1 = grupoActivo.jugadores.find(j => j.id === p.j1Id);
                const j2 = grupoActivo.jugadores.find(j => j.id === p.j2Id);
                const n1 = j1 ? j1.nombre.toLowerCase() : '';
                const n2 = j2 ? j2.nombre.toLowerCase() : '';
                return n1.includes(q) || n2.includes(q) || `${n1} vs ${n2}`.includes(q);
              });

              if (!q || descansaCoincide || partidasFiltradas.length > 0) {
                const partidasAMostrar = q ? partidasFiltradas : listPartidas;
                return `
                  <div style="margin-bottom: 24px; background: rgba(0,0,0,0.15); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
                    <h4 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 1rem; font-weight: 700;"><i class="fa-solid fa-flag-checkered"></i> Jornada ${jNum}</h4>
                    ${descansaPlayer && (!q || descansaCoincide) ? `<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;"><i class="fa-solid fa-mug-hot"></i> <b>Descansa:</b> ${descansaPlayer.nombre}</p>` : ''}
                    ${partidasAMostrar.map(p => {
                      const j1 = grupoActivo.jugadores.find(j => j.id === p.j1Id);
                      const j2 = grupoActivo.jugadores.find(j => j.id === p.j2Id);
                      return `
                        <div class="pairing-item">
                          <span style="font-weight: 600;">${j1 ? j1.nombre : 'X'} <span style="color: #6366f1; font-weight: 800; font-size: 0.8rem; margin: 0 4px;">VS</span> ${j2 ? j2.nombre : 'X'}</span>
                          <select onchange="actualizarResultado(${grupoActivo.id}, ${p.id}, this.value)">
                            <option value="" ${p.resultado === '' ? 'selected' : ''}>⏳ Pendiente</option>
                            <option value="1-0" ${p.resultado === '1-0' ? 'selected' : ''}>🏆 Gana ${j1 ? j1.nombre : 'J1'}</option>
                            <option value="0.5-0.5" ${p.resultado === '0.5-0.5' ? 'selected' : ''}>🤝 Empate</option>
                            <option value="0-1" ${p.resultado === '0-1' ? 'selected' : ''}>🏆 Gana ${j2 ? j2.nombre : 'J2'}</option>
                          </select>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        `;
      }

      partidasCont.innerHTML = `
        <div class="card">
          ${renderBannerHTML(grupoActivo.banner)}
          <h2><i class="fa-solid fa-users-gear" style="color: #10b981;"></i> Jugadores de ${grupoActivo.nombre}</h2>
          <div class="form-group" style="margin-bottom: 16px;">
            <input type="text" id="new-player-input" placeholder="Nombre del jugador...">
            <button onclick="agregarJugador(${grupoActivo.id})"><i class="fa-solid fa-user-plus"></i> Añadir</button>
          </div>

          <ul class="player-list">
            ${grupoActivo.jugadores.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">No hay jugadores inscritos aún.</p>' : 
              grupoActivo.jugadores.map(j => `
                <li class="player-item">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    ${j.foto ? `<img src="${j.foto}" alt="${j.nombre}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">` : '<i class="fa-solid fa-circle-user" style="font-size: 1.4rem; color: var(--text-muted);"></i>'}
                    <span style="font-weight: 600;">${j.nombre}</span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-secondary btn-sm" onclick="abrirAjustesJugador(${grupoActivo.id}, ${j.id})"><i class="fa-solid fa-gear"></i></button>
                    <button class="btn-danger btn-sm" onclick="eliminarJugador(${grupoActivo.id}, ${j.id})"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </li>
              `).join('')
            }
          </ul>

          ${grupoActivo.generado ? `
            <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
              <button style="flex: 1;" onclick="recalcularPartidas(${grupoActivo.id})"><i class="fa-solid fa-rotate"></i> Recalcular (conservar resultados)</button>
              <button class="btn-danger" style="flex: 1;" onclick="restablecerPartidas(${grupoActivo.id})"><i class="fa-solid fa-arrows-rotate"></i> Restablecer</button>
            </div>
          ` : `
            <button class="btn-full" style="margin-top: 18px;" onclick="generarPartidas(${grupoActivo.id})"><i class="fa-solid fa-wand-magic-sparkles"></i> Generar Calendario por Jornadas</button>
          `}
        </div>

        ${enfrentamientosHTML}
      `;
    }
  }

  // Clasificación
  const clasifCont = document.getElementById('clasificacion-container');
  if (clasifCont) {
    if (!grupoActivo) {
      clasifCont.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-trophy"></i></div>
          <p>Selecciona un torneo para consultar la tabla de posiciones.</p>
        </div>`;
    } else if (!grupoActivo.generado) {
      clasifCont.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-chart-simple"></i></div>
          <p>Genera el calendario en la pestaña "Partidas" para activar la tabla de clasificación.</p>
        </div>`;
    } else {
      const ordenados = [...grupoActivo.jugadores].sort((a, b) => b.puntos - a.puntos);
      clasifCont.innerHTML = `
        <div class="card">
          ${renderBannerHTML(grupoActivo.banner)}
          <h2><i class="fa-solid fa-ranking-star" style="color: #f59e0b;"></i> Clasificación: ${grupoActivo.nombre}</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">Pos</th>
                <th>Jugador</th>
                <th style="text-align: right;">Puntos</th>
              </tr>
            </thead>
            <tbody>
              ${ordenados.map((j, i) => {
                let badgeClass = 'rank-badge';
                if (i === 0) badgeClass += ' rank-1';
                else if (i === 1) badgeClass += ' rank-2';
                else if (i === 2) badgeClass += ' rank-3';

                return `
                  <tr>
                    <td><span class="${badgeClass}">${i + 1}</span></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        ${j.foto ? `<img src="${j.foto}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">` : ''}
                        <span style="font-weight: 600;">${j.nombre}</span>
                      </div>
                    </td>
                    <td style="text-align: right;"><b style="font-size: 1.1rem; color: #10b981;">${j.puntos}</b> pts</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}