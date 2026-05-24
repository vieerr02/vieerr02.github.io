// --- LÓGICA CON PUBLICIDAD, RACHAS Y DESCARGA NATIVA ---

// Captura de elementos de la Interfaz
const balanceTotal = document.getElementById('balance-total');
const conceptoInput = document.getElementById('concepto');
const montoInput = document.getElementById('monto');
const listaTransacciones = document.getElementById('lista-transacciones');
const btnIngreso = document.getElementById('btn-ingreso');
const btnGasto = document.getElementById('btn-gasto');
const bloqueoPremium = document.getElementById('bloqueo-premium');
const bannerInferior = document.getElementById('banner-inferior');
const contenedorPublicidad = document.getElementById('contenedor-publicidad');
const contenedorReporte = document.getElementById('contenedor-reporte');
const btnComprar = document.getElementById('btn-comprar');
const contadorRacha = document.getElementById('contador-racha');
const btnInstalar = document.getElementById('btn-instalar');

// Variables de Estado de la Aplicación
let esPremium = JSON.parse(localStorage.getItem('fpro_premium')) || false;
let transacciones = JSON.parse(localStorage.getItem('fpro_transacciones')) || [];
let eventoInstalacion = null;

// --- SISTEMA INTELIGENTE DE RACHAS (STREAKS) ---
function verificarYActualizarRacha() {
    const hoy = new Date().toDateString();
    const ultimaConexion = localStorage.getItem('fpro_ultima_conexion');
    let rachaActual = parseInt(localStorage.getItem('fpro_racha_dias')) || 0;

    if (!ultimaConexion) {
        // Primera vez que entra a la app
        rachaActual = 1;
        localStorage.setItem('fpro_racha_dias', 1);
        localStorage.setItem('fpro_ultima_conexion', hoy);
    } else if (ultimaConexion !== hoy) {
        const fechaHoy = new Date(hoy);
        const fechaUltima = new Date(ultimaConexion);
        const diferenciaTiempo = fechaHoy - fechaUltima;
        const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));

        if (diferenciaDias === 1) {
            // Entró el día de ayer consecutivo, aumentamos racha
            rachaActual += 1;
            localStorage.setItem('fpro_racha_dias', rachaActual);
            localStorage.setItem('fpro_ultima_conexion', hoy);
        } else if (diferenciaDias > 1) {
            // Pasaron más de 48 horas, racha rota
            rachaActual = 1;
            localStorage.setItem('fpro_racha_dias', 1);
            localStorage.setItem('fpro_ultima_conexion', hoy);
        }
    }
    
    // Pintar los días de racha en el fueguito de arriba
    if (contadorRacha) contadorRacha.textContent = rachaActual;
}

// --- INSTALACIÓN DESDE EL NAVEGADOR (PWA) ---
window.addEventListener('beforeinstallprompt', (e) => {
    // Evita que el navegador lance la alerta por defecto de forma invasiva
    e.preventDefault();
    eventoInstalacion = e;
    // Muestra nuestro botón de diseño moderno arriba para motivarlos a descargar
    if (btnInstalar) btnInstalar.classList.remove('hidden');
});

if (btnInstalar) {
    btnInstalar.addEventListener('click', () => {
        if (!eventoInstalacion) return;
        eventoInstalacion.prompt(); // Abre la ventana nativa de instalación
        eventoInstalacion.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('El usuario aceptó descargar FinanzasPro');
                btnInstalar.classList.add('hidden'); // Ocultar si ya descargó
            }
            eventoInstalacion = null;
        });
    });
}

// --- RENDERIZACIÓN DE LA APLICACIÓN ---
function rediseñarPantalla() {
    listaTransacciones.innerHTML = '';
    let saldoTotal = 0;
    let gastosPorCategoria = {};
    let sumaGastosTotales = 0;

    transacciones.forEach((t) => {
        saldoTotal += (t.tipo === 'ingreso') ? t.monto : -t.monto;

        if (t.tipo === 'gasto') {
            const cat = t.concepto.charAt(0).toUpperCase() + t.concepto.slice(1).toLowerCase();
            gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + t.monto;
            sumaGastosTotales += t.monto;
        }

        const li = document.createElement('li');
        li.className = "flex justify-between items-center py-3 text-sm";
        const color = (t.tipo === 'ingreso') ? 'text-green-600' : 'text-red-600';
        const signo = (t.tipo === 'ingreso') ? '+' : '-';

        li.innerHTML = `
            <div>
                <p class="font-medium">${t.concepto}</p>
                <p class="text-xs text-gray-400">${t.fecha}</p>
            </div>
            <span class="font-bold ${color}">${signo}$${t.monto.toFixed(2)}</span>
        `;
        listaTransacciones.appendChild(li);
    });

    balanceTotal.textContent = `$${saldoTotal.toFixed(2)}`;
    balanceTotal.className = "text-4xl font-extrabold mt-1 " + (saldoTotal >= 0 ? 'text-green-500' : 'text-red-500');

    // Construcción de barras de progreso CSS
    if (sumaGastosTotales > 0) {
        if (contenedorReporte) {
            contenedorReporte.innerHTML = '';
            Object.keys(gastosPorCategoria).forEach((categoria) => {
                const montoCat = gastosPorCategoria[categoria];
                const porcentaje = Math.round((montoCat / sumaGastosTotales) * 100);

                const divBarra = document.createElement('div');
                divBarra.className = "space-y-1";
                divBarra.innerHTML = `
                    <div class="flex justify-between text-xs font-medium">
                        <span>${categoria}</span>
                        <span class="text-gray-500">$${montoCat.toFixed(2)} (${porcentaje}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${porcentaje}%"></div>
                    </div>
                `;
                contenedorReporte.appendChild(divBarra);
            });
        }
    } else {
        if (contenedorReporte) {
            contenedorReporte.innerHTML = '<p class="text-gray-400 text-xs text-center py-6">Registra gastos para ver el análisis analítico.</p>';
        }
    }

    // Comprobación Premium
    if (esPremium) {
        if (bloqueoPremium) bloqueoPremium.classList.add('hidden');
        if (contenedorPublicidad) contenedorPublicidad.style.display = 'none';
        if (bannerInferior) {
            bannerInferior.textContent = "✨ Modo Premium Activo — Sin Anuncios";
            bannerInferior.className = "bg-green-600 text-white p-3 rounded-xl text-xs font-medium shadow-md text-center";
        }
    } else {
        if (bloqueoPremium) bloqueoPremium.classList.remove('hidden');
        if (contenedorPublicidad) contenedorPublicidad.style.display = 'block';
    }
}

// --- CONTROLADOR DE MOVIMIENTOS ---
function registrarMovimiento(tipo) {
    const txtConcepto = conceptoInput.value.trim();
    const valMonto = parseFloat(montoInput.value);

    if (txtConcepto === '' || isNaN(valMonto) || valMonto <= 0) {
        alert('Por favor, introduce un concepto válido y un monto mayor a cero.');
        return;
    }

    const nuevoItem = {
        concepto: txtConcepto,
        monto: valMonto,
        tipo: tipo,
        fecha: new Date().toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    transacciones.unshift(nuevoItem);
    
    // Guardar en almacenamiento para conservar el progreso
    try {
        localStorage.setItem('fpro_transacciones', JSON.stringify(transacciones));
    } catch(e) { console.log("Espacio limitado"); }

    rediseñarPantalla();

    conceptoInput.value = '';
    montoInput.value = '';
}

function activarPremium() {
    esPremium = true;
    localStorage.setItem('fpro_premium', 'true');
    rediseñarPantalla();
    alert('¡Suscripción Exitosa! Cuenta Pro Activada sin anuncios.');
}

// Asignación de clics de forma nativa
if (btnIngreso) btnIngreso.onclick = function() { registrarMovimiento('ingreso'); };
if (btnGasto) btnGasto.onclick = function() { registrarMovimiento('gasto'); };
if (btnComprar) btnComprar.onclick = function() { activarPremium(); };

// Ejecución inicial al abrir la app
verificarYActualizarRacha();
rediseñarPantalla();