// chatbot.js — Agenda de citas y WhatsApp para Franki Tattoo Studio
(function () {
  const WHATSAPP_PHONE = "593991548585";

  let chatState = {
    step: "initial",
    serviceType: null, // "Tatuaje", "Piercing", "Tienda"

    // Gestión de múltiples tatuajes
    tattooCount: 1,
    currentTattooIndex: 1,
    tattoos: [], // [{ index: 1, size: "", style: "", details: "" }]
    currentTattooTemp: { size: "", style: "", details: "" },

    // Gestión de perforaciones
    piercingCount: 1,
    currentPiercingIndex: 1,
    piercings: [], // ["Oreja: Hélix", "Nariz: Septum"]

    // Extras / Servicios adicionales
    extras: [], // ["Piercing: Septum", "Artesanía: Cuadro Dark Art"]

    // Salud / Alergias
    allergies: "Ninguna",

    // Datos del cliente
    customerName: "",
    customerPhone: "",
    selectedDate: "",
    selectedTime: "",
    confirmedAppointmentId: null,
  };

  function createChatbotUI() {
    if (document.getElementById("ft-chatbot-container")) return;

    const container = document.createElement("div");
    container.id = "ft-chatbot-container";
    container.innerHTML = `
      <div id="ft-chat-window" class="ft-chat-window ft-hidden">
        <div class="ft-chat-header">
          <div class="ft-chat-header-info">
            <div class="ft-avatar">⚡</div>
            <div>
              <h4>Franki Tattoo Studio</h4>
              <span class="ft-status"><span class="ft-dot"></span> Agenda en línea y WhatsApp</span>
            </div>
          </div>
          <button id="ft-chat-close" class="ft-chat-close-btn" title="Cerrar chat">✕</button>
        </div>
        
        <div id="ft-chat-messages" class="ft-chat-messages"></div>
        
        <div id="ft-chat-input-area" class="ft-chat-input-area ft-hidden">
          <input type="text" id="ft-chat-text-input" placeholder="Escribe tu respuesta aquí..." />
          <button id="ft-chat-send-btn" class="ft-chat-btn-send" title="Enviar">➔</button>
        </div>
      </div>

      <button id="ft-chat-toggle-btn" class="ft-chat-toggle-btn" title="Citas y WhatsApp Franki Tattoo">
        <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
          <path d="M16 2a13 13 0 0 0-11 20l-2 7 7-2a13 13 0 1 0 6-25zm0 24a11 11 0 0 1-5.5-1.5l-.4-.2-4 1 1-4-.2-.4A11 11 0 1 1 16 26zm6-8c-.3-.2-1.8-.9-2-1s-.4-.2-.6.2-.8 1-.9 1.2-.4.3-.7.1-1.3-.5-2.5-1.6c-.9-.8-1.5-1.8-1.7-2s-.2-.3 0-.5c.2-.2.4-.4.6-.6s.3-.4.4-.6.1-.4 0-.6-.6-1.5-.9-2c-.2-.6-.5-.5-.6-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 3 1.3 3.5 1.5 3.8 2.6 4 6.3 5.5c.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2-1 2.3-2s.3-1.8.2-2c-.2-.2-.5-.3-.8-.5z"/>
        </svg>
        <span class="ft-chat-badge">1</span>
      </button>
    `;

    document.body.appendChild(container);

    document.getElementById("ft-chat-toggle-btn").addEventListener("click", () => {
      toggleChat();
    });

    document.getElementById("ft-chat-close").addEventListener("click", () => {
      closeChat();
    });

    const textInput = document.getElementById("ft-chat-text-input");
    const sendBtn = document.getElementById("ft-chat-send-btn");

    function handleSend() {
      const val = textInput.value.trim();
      if (!val) return;
      textInput.value = "";
      processUserInput(val);
    }

    sendBtn.addEventListener("click", handleSend);
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    });
  }

  function toggleChat() {
    const win = document.getElementById("ft-chat-window");
    if (win.classList.contains("ft-hidden")) {
      openChat();
    } else {
      closeChat();
    }
  }

  function openChat(presetService) {
    const win = document.getElementById("ft-chat-window");
    win.classList.remove("ft-hidden");
    const badge = document.querySelector(".ft-chat-badge");
    if (badge) badge.style.display = "none";

    // Detectar contexto por URL si no viene preset explícito
    if (!presetService) {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("tatuajes")) {
        presetService = "Tatuaje";
      } else if (path.includes("piercings")) {
        presetService = "Piercing";
      }
    }

    if (presetService === "Tattoo" || presetService === "Tatuaje") {
      resetChat();
      handleSelectService("Tatuaje");
    } else if (presetService === "Piercing" || presetService === "Perforacion") {
      resetChat();
      handleSelectService("Piercing");
    } else if (chatState.step === "initial") {
      startConversation();
    }
  }

  function closeChat() {
    const win = document.getElementById("ft-chat-window");
    if (win) win.classList.add("ft-hidden");
  }

  function resetChat() {
    chatState = {
      step: "initial",
      serviceType: null,
      tattooCount: 1,
      currentTattooIndex: 1,
      tattoos: [],
      currentTattooTemp: { size: "", style: "", details: "" },
      piercingCount: 1,
      currentPiercingIndex: 1,
      piercings: [],
      extras: [],
      allergies: "Ninguna",
      customerName: "",
      customerPhone: "",
      selectedDate: "",
      selectedTime: "",
      confirmedAppointmentId: null,
    };
    const msgs = document.getElementById("ft-chat-messages");
    if (msgs) msgs.innerHTML = "";
    hideInput();
  }

  function startConversation() {
    resetChat();
    const path = window.location.pathname.toLowerCase();

    if (path.includes("tatuajes")) {
      addBotMessage("¡Hola! 🖤 Estás explorando el estudio de **Franki Tattoo** en Ibarra.");
      setTimeout(() => {
        addBotMessage("¿Te gustaría agendar una cita o cotizar tus diseños con Franki?");
        addOptionButtons([
          { text: "🖋️ Cotizar y Agendar Tatuaje(s)", value: "Tatuaje" },
          { text: "💎 Cita para Piercing", value: "Piercing" },
          { text: "🛍️ Pregunta sobre la Tienda", value: "Tienda" },
          { text: "💬 Hablar directo por WhatsApp", value: "DirectWhatsApp" }
        ], (val) => handleSelectService(val));
      }, 350);
    } else if (path.includes("piercings")) {
      addBotMessage("¡Hola! 💎 Bienvenido a la sección de **Piercings & Joyería** de Franki Tattoo.");
      setTimeout(() => {
        addBotMessage("¿Quieres agendar tu perforación o tienes dudas con alguna joya?");
        addOptionButtons([
          { text: "💎 Agendar Cita para Piercing(s)", value: "Piercing" },
          { text: "🖋️ Cita para Tatuaje", value: "Tatuaje" },
          { text: "💍 Consultar Joyería / Tienda", value: "Tienda" },
          { text: "💬 Hablar directo por WhatsApp", value: "DirectWhatsApp" }
        ], (val) => handleSelectService(val));
      }, 350);
    } else {
      addBotMessage("¡Hola! 🖤 Bienvenido a **Franki Tattoo Studio** en Ibarra.");
      setTimeout(() => {
        addBotMessage("¿Para qué te gustaría agendar tu cita o consulta hoy?");
        addOptionButtons([
          { text: "🎨 Cita para Tatuaje(s)", value: "Tatuaje" },
          { text: "💎 Cita para Piercing(s)", value: "Piercing" },
          { text: "🛍️ Tienda y Productos", value: "Tienda" },
          { text: "💬 Hablar directo por WhatsApp", value: "DirectWhatsApp" }
        ], (val) => handleSelectService(val));
      }, 350);
    }
  }

  function handleSelectService(service) {
    if (service === "DirectWhatsApp") {
      addUserMessage("💬 Deseo hablar directo por WhatsApp");
      setTimeout(() => {
        addBotMessage("¡Listo! Puedes chatear de inmediato con Franki en WhatsApp:");
        const directUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hola Franki Tattoo, deseo hacer una consulta.")}`;
        const msgs = document.getElementById("ft-chat-messages");
        const btnDiv = document.createElement("div");
        btnDiv.className = "ft-chat-cta-container";
        btnDiv.innerHTML = `
          <a href="${directUrl}" target="_blank" class="ft-chat-whatsapp-launch-btn">
            💬 Abrir WhatsApp con Franki Ahora ➔
          </a>
        `;
        msgs.appendChild(btnDiv);
        scrollToBottom();
        window.open(directUrl, "_blank");
      }, 300);
      return;
    }

    chatState.serviceType = service;

    if (service === "Tatuaje") {
      addUserMessage("🎨 Quiero agendar cita para Tatuaje(s)");
      chatState.step = "ask_tattoo_count";
      setTimeout(() => {
        addBotMessage("💡 **Aviso importante:** El precio final de cada tatuaje se cotiza de forma personalizada según el **tamaño, la zona del cuerpo y los detalles del diseño**.");
        setTimeout(() => {
          addBotMessage("**¿Cuántos tatuajes te gustaría hacerte en tu sesión?**");
          addOptionButtons([
            { text: "1️⃣ Solo 1 Tatuaje", value: "1" },
            { text: "2️⃣ 2 Tatuajes", value: "2" },
            { text: "3️⃣ 3 Tatuajes", value: "3" },
            { text: "➕ Más de 3 tatuajes", value: "4" }
          ], (count) => {
            chatState.tattooCount = parseInt(count, 10);
            addUserMessage(`${count} tatuaje${chatState.tattooCount > 1 ? 's' : ''}`);
            chatState.currentTattooIndex = 1;
            chatState.tattoos = [];
            askTattooSize(1);
          });
        }, 300);
      }, 300);
    } else if (service === "Piercing") {
      addUserMessage("💎 Quiero agendar cita para Piercing(s)");
      chatState.step = "ask_piercing_count";
      setTimeout(() => {
        addBotMessage("💡 **Aviso importante:** El costo de la perforación puede variar según la **zona anatómica y el modelo de joyería de acero quirúrgico** que elijas.");
        setTimeout(() => {
          addBotMessage("**¿Cuántas perforaciones te gustaría realizarte en la cita?**");
          addOptionButtons([
            { text: "1️⃣ 1 Perforación", value: "1" },
            { text: "2️⃣ 2 Perforaciones", value: "2" },
            { text: "3️⃣ 3 o más Perforaciones", value: "3" }
          ], (count) => {
            chatState.piercingCount = parseInt(count, 10);
            addUserMessage(`${count} perforación${chatState.piercingCount > 1 ? 'es' : ''}`);
            chatState.currentPiercingIndex = 1;
            chatState.piercings = [];
            askPiercingZone(1);
          });
        }, 300);
      }, 300);
    } else {
      addUserMessage("🛍️ Consulta de Tienda y Productos");
      chatState.step = "shop_query";
      setTimeout(() => {
        addBotMessage("Disponemos de **Vapes premium**, **Joyería de acero quirúrgico** y **Artesanías** exclusivas.");
        addBotMessage("¿Sobre qué producto te gustaría información?");
        addOptionButtons([
          { text: "💨 Vapes y Líquidos", value: "Vapes y Líquidos" },
          { text: "💍 Joyería de Acero Quirúrgico", value: "Joyería de Acero Quirúrgico" },
          { text: "🎨 Artesanías y Accesorios", value: "Artesanías Franki" }
        ], (item) => {
          chatState.extras.push(`Consulta Tienda: ${item}`);
          addUserMessage(item);
          askCustomerName();
        });
      }, 350);
    }
  }

  // ---------- FLUJO DE TATUAJES (MÚLTIPLES) ----------

  function askTattooSize(index) {
    chatState.step = "tattoo_size";
    chatState.currentTattooTemp = { size: "", style: "", details: "" };
    hideInput();

    setTimeout(() => {
      const totalText = chatState.tattooCount > 1 ? ` (Tatuaje ${index} de ${chatState.tattooCount})` : "";
      addBotMessage(`📏 **Tatuaje #${index}${totalText}**: ¿De qué tamaño aproximado lo deseas?`);
      addOptionButtons([
        { text: "📐 Pequeño (hasta 5 cm) — ej: muñeca, tobillo, dedos", value: "Pequeño (hasta 5cm)" },
        { text: "📐 Mediano (5 a 12 cm) — ej: antebrazo, pantorrilla, hombro", value: "Mediano (5-12cm)" },
        { text: "📐 Grande (13 a 20 cm) — ej: muslo, pectoral, costillas", value: "Grande (13-20cm)" },
        { text: "⚡ Proyecto Grande (+20 cm / Media manga / Manga)", value: "Proyecto Grande (+20cm)" },
        { text: "✍️ Escribir medida específica o zona", value: "CUSTOM_SIZE" }
      ], (size) => {
        if (size === "CUSTOM_SIZE") {
          addUserMessage("✍️ Deseo especificar la medida");
          addBotMessage("Por favor escribe la medida en cm y la zona del cuerpo:");
          showInput("Ej: 10 cm en el bíceps...");
        } else {
          chatState.currentTattooTemp.size = size;
          addUserMessage(`Tamaño: ${size}`);
          askTattooStyle(index);
        }
      });
    }, 350);
  }

  function askTattooStyle(index) {
    chatState.step = "tattoo_style";
    hideInput();

    setTimeout(() => {
      addBotMessage(`🎨 Para este **Tatuaje #${index}**: ¿Qué estilo o idea tienes en mente?`);
      addOptionButtons([
        { text: "📐 Geométrico & Blackwork", value: "Geométrico & Blackwork" },
        { text: "🌸 Línea Fina & Botánico (Fine Line)", value: "Línea Fina & Botánico" },
        { text: "✍️ Lettering & Caligrafía", value: "Lettering & Caligrafía" },
        { text: "💀 Dark Art & Ilustración Sombras", value: "Dark Art & Ilustración" },
        { text: "🐉 Oriental / Dragones & Mitología", value: "Oriental & Dragones" },
        { text: "🔄 Cover-up (Tapar otro tatuaje)", value: "Cover-up" },
        { text: "💡 Tengo otra idea (Escribir)", value: "CUSTOM_STYLE" }
      ], (style) => {
        if (style === "CUSTOM_STYLE") {
          addUserMessage("✍️ Escribir mi idea");
          addBotMessage("Escribe brevemente tu idea para este tatuaje:");
          showInput("Ej: Flores en técnica acuarela, mariposa con letras...");
        } else {
          chatState.currentTattooTemp.style = style;
          addUserMessage(`Estilo: ${style}`);
          finishTattooStep(index);
        }
      });
    }, 350);
  }

  function finishTattooStep(index) {
    chatState.tattoos.push({
      index: index,
      size: chatState.currentTattooTemp.size || "Medida no especificada",
      style: chatState.currentTattooTemp.style || "Estilo personalizado"
    });

    if (chatState.currentTattooIndex < chatState.tattooCount) {
      chatState.currentTattooIndex++;
      setTimeout(() => {
        addBotMessage(`✅ ¡Tatuaje #${index} guardado en la ficha! 📋`);
        askTattooSize(chatState.currentTattooIndex);
      }, 400);
    } else {
      setTimeout(() => {
        const plural = chatState.tattoos.length > 1 ? `los **${chatState.tattoos.length} tatuajes**` : "tu tatuaje";
        addBotMessage(`✅ ¡Excelente! Ya tenemos registrados ${plural} para tu cotización. 🎨`);
        askExtras();
      }, 400);
    }
  }

  // ---------- FLUJO DE PIERCINGS (MÚLTIPLES) ----------

  function askPiercingZone(index) {
    chatState.step = "piercing_zone";
    hideInput();

    setTimeout(() => {
      const totalText = chatState.piercingCount > 1 ? ` (${index} de ${chatState.piercingCount})` : "";
      addBotMessage(`💎 **Perforación #${index}${totalText}**: ¿En qué zona te gustaría?`);
      addOptionButtons([
        { text: "👂 Oreja (Lóbulo, Hélix, Tragus, Industrial, Daith)", value: "Oreja / Cartílago" },
        { text: "👃 Nariz (Nostril o Septum)", value: "Nariz (Nostril/Septum)" },
        { text: "👄 Boca / Labio (Labret, Medusa, Smile)", value: "Boca / Labio" },
        { text: "✨ Ceja o Puente", value: "Ceja / Puente" },
        { text: "🔘 Ombligo o Pezón", value: "Ombligo / Pezón" },
        { text: "💍 Solo cambio de Joyería", value: "Cambio de Joyería" },
        { text: "✍️ Otra zona (Escribir)", value: "CUSTOM_ZONE" }
      ], (zone) => {
        if (zone === "CUSTOM_ZONE") {
          addUserMessage("✍️ Especificar otra zona");
          addBotMessage("Escribe la zona exacta donde deseas la perforación:");
          showInput("Ej: Rook en oreja izquierda...");
        } else {
          addUserMessage(zone);
          finishPiercingStep(index, zone);
        }
      });
    }, 350);
  }

  function finishPiercingStep(index, zone) {
    chatState.piercings.push(zone);

    if (chatState.currentPiercingIndex < chatState.piercingCount) {
      chatState.currentPiercingIndex++;
      setTimeout(() => {
        addBotMessage(`✅ Perforación #${index} guardada.`);
        askPiercingZone(chatState.currentPiercingIndex);
      }, 400);
    } else {
      setTimeout(() => {
        addBotMessage("✅ ¡Perforaciones registradas con éxito! 💎");
        askExtras();
      }, 400);
    }
  }

  // ---------- PASO DE EXTRAS (PIERCING, ARTESANÍAS, NINGUNO) ----------

  function askExtras() {
    chatState.step = "ask_extras";
    hideInput();

    setTimeout(() => {
      addBotMessage("💡 **¿Te gustaría aprovechar tu sesión y agregar algo más a tu cita?**");
      addOptionButtons([
        { text: "💎 Agregar un Piercing / Perforación", value: "ADD_PIERCING" },
        { text: "🛍️ Agregar Joyería o Artesanía de la tienda", value: "ADD_SHOP" },
        { text: "✨ No, solo eso (Continuar)", value: "NO_EXTRAS" }
      ], (choice) => {
        if (choice === "ADD_PIERCING") {
          addUserMessage("💎 Me gustaría agregar un Piercing");
          addBotMessage("¿Qué zona te gustaría perforar?");
          addOptionButtons([
            { text: "👂 Oreja (Lóbulo / Hélix / Tragus / Industrial)", value: "Piercing: Oreja" },
            { text: "👃 Nariz (Nostril / Septum)", value: "Piercing: Nariz (Nostril/Septum)" },
            { text: "👄 Labio / Boca", value: "Piercing: Boca / Labio" },
            { text: "✨ Ceja / Ombligo / Pezón", value: "Piercing: Ceja/Ombligo/Pezón" },
            { text: "✍️ Otro piercing personalizado", value: "CUSTOM_PIERCING" }
          ], (pVal) => {
            if (pVal === "CUSTOM_PIERCING") {
              chatState.step = "extra_piercing_custom";
              addBotMessage("Escribe qué piercing deseas agregar:");
              showInput("Ej: Piercing Septum con argolla...");
            } else {
              chatState.extras.push(pVal);
              addUserMessage(pVal);
              addBotMessage("💎 ¡Piercing añadido a la ficha de cita!");
              askAllergies();
            }
          });
        } else if (choice === "ADD_SHOP") {
          addUserMessage("🛍️ Deseo agregar algo de la tienda");
          addBotMessage("¿Qué producto o diseño te interesa para tu visita?");
          addOptionButtons([
            { text: "💨 Vapes y Líquidos importados", value: "Tienda: Vapes / Líquidos" },
            { text: "💍 Joyería de Acero Quirúrgico Hipoalergénico", value: "Tienda: Joyería Acero Quirúrgico" },
            { text: "🎨 Cuadros / Lienzos Dark Art o Esculturas", value: "Tienda: Artesanías / Cuadros" }
          ], (sVal) => {
            chatState.extras.push(sVal);
            addUserMessage(sVal);
            addBotMessage("🛍️ ¡Anotado en tu ficha de visita!");
            askAllergies();
          });
        } else {
          addUserMessage("✨ No, solo eso (Continuar)");
          askAllergies();
        }
      });
    }, 400);
  }

  // ---------- DATOS DEL CLIENTE Y HORARIOS ----------

  function askCustomerName() {
    chatState.step = "customer_name";
    setTimeout(() => {
      addBotMessage("¡Perfecto! Para preparar tu ficha de cita, **¿cuál es tu nombre y apellido?**");
      showInput("Escribe tu nombre completo...");
    }, 350);
  }

  function askCustomerPhone() {
    chatState.step = "customer_phone";
    setTimeout(() => {
      addBotMessage(`Mucho gusto, **${chatState.customerName}** 👋`);
      addBotMessage("¿A qué **número de WhatsApp** te enviamos la confirmación y cotización directa de Franki?");
      showInput("Ej: 0991234567...");
    }, 350);
  }

  function askAllergies() {
    chatState.step = "ask_allergies";
    hideInput();
    setTimeout(() => {
      addBotMessage("🏥 **Por tu salud y seguridad:** ¿Tienes alguna alergia conocida (látex, metales como níquel, tintas, anestesia) o condición de piel/cicatrización?");
      addOptionButtons([
        { text: "🟢 No, ninguna alergia (Piel sana)", value: "NONE" },
        { text: "⚠️ Sí, tengo alergias (Escribir)", value: "CUSTOM_ALLERGY" }
      ], (val) => {
        if (val === "CUSTOM_ALLERGY") {
          chatState.step = "customer_allergies";
          addUserMessage("⚠️ Tengo alergias a considerar");
          addBotMessage("Por favor escribe a qué eres alérgico/a para que Franki tome las precauciones debidas en tu sesión (ej: guantes de nitrilo, acero quirúrgico hipoalergénico):");
          showInput("Ej: Alergia al látex, al níquel, piel muy sensible...");
        } else {
          chatState.allergies = "Ninguna";
          addUserMessage("🟢 No, ninguna alergia");
          askCustomerName();
        }
      });
    }, 350);
  }

  async function fetchRecommendedSlots() {
    chatState.step = "appointment_slot";
    hideInput();
    addBotMessage("Consultando disponibilidad de agenda en la base de datos... ⚡");

    const apiType = chatState.serviceType === "Piercing" ? "Piercing" : "Tattoo";

    try {
      const res = await fetch(`/api/appointments/recommended?type=${apiType}`);
      if (res.ok) {
        const slots = await res.json();
        if (slots && slots.length > 0) {
          setTimeout(() => {
            addBotMessage("📅 Estos son nuestros **horarios libres recomendados** más próximos:");
            const buttons = slots.map(s => ({
              text: `📅 ${s.etiqueta}`,
              value: JSON.stringify(s)
            }));
            buttons.push({ text: "🗓️ Consultar otra fecha", value: "CUSTOM_DATE" });

            addOptionButtons(buttons, (val) => {
              if (val === "CUSTOM_DATE") {
                askCustomDate();
              } else {
                const chosen = JSON.parse(val);
                addUserMessage(`📅 ${chosen.etiqueta}`);
                bookSlot(chosen.fecha, chosen.hora);
              }
            });
          }, 400);
          return;
        }
      }
    } catch (e) {
      console.warn("No se pudo consultar API de recomendaciones, usando selector manual", e);
    }

    askCustomDate();
  }

  function askCustomDate() {
    chatState.step = "custom_date";
    setTimeout(() => {
      addBotMessage("Por favor ingresa la fecha y hora que prefieras (ej: `2026-09-15 15:00`):");
      showInput("Ej: 2026-09-15 14:00");
    }, 350);
  }

  async function handleCustomDateInput(text) {
    let dateStr = "";
    let timeStr = "14:00";

    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const latMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);

    if (isoMatch) {
      dateStr = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    } else if (latMatch) {
      dateStr = `${latMatch[3]}-${latMatch[2].padStart(2, '0')}-${latMatch[1].padStart(2, '0')}`;
    }

    if (timeMatch) {
      timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    if (!dateStr) {
      addBotMessage("⚠️ Por favor escribe la fecha con formato claro, por ejemplo: `2026-09-15 15:00`");
      showInput("Ej: 2026-09-15 15:00");
      return;
    }

    await bookSlot(dateStr, timeStr);
  }

  async function bookSlot(date, time) {
    chatState.selectedDate = date;
    chatState.selectedTime = time;

    hideInput();
    addBotMessage(`Verificando disponibilidad para el **${date} a las ${time}**... ⏳`);

    const apiType = chatState.serviceType === "Piercing" ? "Piercing" : "Tattoo";

    // Resumen de notas para el sistema y la base de datos
    const notesParts = [];
    if (chatState.tattoos.length > 0) {
      const tatDetails = chatState.tattoos.map(t => `#${t.index} [${t.size} - ${t.style}]`).join(", ");
      notesParts.push(`Tatuajes (${chatState.tattoos.length}): ${tatDetails}`);
    }
    if (chatState.piercings.length > 0) {
      notesParts.push(`Piercings (${chatState.piercings.length}): ${chatState.piercings.join(", ")}`);
    }
    if (chatState.extras.length > 0) {
      notesParts.push(`Extras: ${chatState.extras.join(", ")}`);
    }
    if (chatState.allergies && chatState.allergies !== "Ninguna") {
      notesParts.push(`Alergias: ${chatState.allergies}`);
    } else {
      notesParts.push(`Alergias: Ninguna`);
    }
    notesParts.push(`Tel: ${chatState.customerPhone}`);

    const fullNotes = notesParts.join(" | ");

    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: chatState.customerName,
          telefono: chatState.customerPhone,
          fecha: date,
          hora: time,
          tipoServicio: apiType,
          notas: fullNotes
        })
      });

      const data = await res.json();

      if (res.status === 409 || data.ocupado) {
        setTimeout(() => {
          addBotMessage(`⚠️ **Esa fecha y horario (${date} a las ${time}) ya se encuentra ocupada por otra cita.**`);
          addBotMessage("Nuestra agenda te sugiere estos **horarios libres más próximos**:");

          if (data.sugerencias && data.sugerencias.length > 0) {
            const buttons = data.sugerencias.map(s => ({
              text: `📅 ${s.etiqueta}`,
              value: JSON.stringify(s)
            }));
            buttons.push({ text: "🗓️ Probar otra fecha", value: "CUSTOM_DATE" });

            addOptionButtons(buttons, (val) => {
              if (val === "CUSTOM_DATE") {
                askCustomDate();
              } else {
                const chosen = JSON.parse(val);
                addUserMessage(`📅 ${chosen.etiqueta}`);
                bookSlot(chosen.fecha, chosen.hora);
              }
            });
          } else {
            askCustomDate();
          }
        }, 400);
        return;
      }

      if (res.ok && data.exito) {
        chatState.confirmedAppointmentId = data.idCita;
        setTimeout(() => {
          const friendlyDate = formatFriendlyDate(date, time);
          addBotMessage("✅ **¡Cita registrada con éxito en el sistema!**");
          addBotMessage(`🆔 **Cita ${data.idCita}**\n📅 **Día y Hora:** ${friendlyDate}\n👤 **Cliente:** ${chatState.customerName}\n📱 **Teléfono:** ${chatState.customerPhone}`);
          finalizeChat(data);
        }, 400);
        return;
      }

      addBotMessage(`⚠️ ${data.mensaje || "Ocurrió un inconveniente al validar la fecha."}`);
      askCustomDate();

    } catch (err) {
      console.error("Error al conectar con la agenda:", err);
      addBotMessage("⚠️ Hubo un detalle de red, pero podemos coordinar tu cita directamente por WhatsApp:");
      finalizeChat({ fechaHoraTexto: `${date} a las ${time}` });
    }
  }

  function formatFriendlyDate(dateStr, timeStr) {
    if (!dateStr) return timeStr || "Horario a coordinar";
    try {
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const dayName = days[d.getDay()];
        const monthName = months[month];
        return `${dayName} ${day} de ${monthName} — ${timeStr || "14:00"}`;
      }
    } catch (e) {
      console.warn(e);
    }
    return `${dateStr} a las ${timeStr || ""}`;
  }

  function finalizeChat(appointmentData) {
    chatState.step = "finished";
    hideInput();

    const citaNum = chatState.confirmedAppointmentId ? `Cita ${chatState.confirmedAppointmentId}` : "Pendiente";
    const fechaHora = formatFriendlyDate(chatState.selectedDate, chatState.selectedTime);

    setTimeout(() => {
      addBotMessage("🔔 **Ficha lista para enviar a Franki Tattoo**:\n\n📌 *Ten en cuenta:* Franki revisará tu solicitud y te indicará la cotización exacta y el abono de reserva necesario para separar tu fecha en la agenda.");

      // Formato del mensaje para WhatsApp de Franki
      let msg = `*¡HOLA FRANKI TATTOO!* ⚡\n`;
      msg += `*NUEVA CITA REGISTRADA EN EL SISTEMA*\n\n`;
      if (chatState.confirmedAppointmentId) {
        msg += `🆔 *Cita ${chatState.confirmedAppointmentId}*\n`;
      }
      msg += `👤 *Cliente:* ${chatState.customerName}\n`;
      msg += `📱 *Teléfono / WhatsApp:* ${chatState.customerPhone}\n`;
      msg += `📅 *Día y Horario:* ${fechaHora}\n`;
      msg += `🏥 *Alergias / Salud:* ${chatState.allergies === "Ninguna" ? "🟢 Ninguna" : `⚠️ ${chatState.allergies}`}\n\n`;

      msg += `📋 *DETALLES DE LA SESIÓN:*\n`;

      if (chatState.tattoos.length > 0) {
        msg += `🖋️ *Tatuajes a cotizar (${chatState.tattoos.length}):*\n`;
        chatState.tattoos.forEach(t => {
          msg += `  • *Tatuaje #${t.index}:* ${t.size} — ${t.style}\n`;
        });
      }

      if (chatState.piercings.length > 0) {
        msg += `💎 *Piercings (${chatState.piercings.length}):*\n`;
        chatState.piercings.forEach((p, idx) => {
          msg += `  • *Perforación #${idx + 1}:* ${p}\n`;
        });
      }

      if (chatState.extras.length > 0) {
        msg += `✨ *Servicios / Productos adicionales:*\n`;
        chatState.extras.forEach(ext => {
          msg += `  • ${ext}\n`;
        });
      }

      msg += `\n💡 *Nota:* El valor final y el abono de reserva se acuerdan directamente con Franki según el diseño, tamaño y zona del cuerpo.\n`;
      msg += `💵 *Cotización y Abono:* Por definir con Franki\n`;
      msg += `\n✅ Por favor confírmame disponibilidad y presupuesto para enviarte el abono de reserva. ¡Muchas gracias!`;

      const encoded = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;

      const msgs = document.getElementById("ft-chat-messages");
      const btnDiv = document.createElement("div");
      btnDiv.className = "ft-chat-cta-container";
      btnDiv.innerHTML = `
        <a href="${waUrl}" target="_blank" class="ft-chat-whatsapp-launch-btn">
          💬 Enviar Ficha a Franki por WhatsApp Ahora ➔
        </a>
        <button class="ft-chat-restart-btn">🔄 Agendar otra cita</button>
      `;
      msgs.appendChild(btnDiv);
      scrollToBottom();

      btnDiv.querySelector(".ft-chat-restart-btn").addEventListener("click", () => {
        startConversation();
      });

      // Abrir WhatsApp en nueva pestaña
      window.open(waUrl, "_blank");
    }, 500);
  }

  function processUserInput(text) {
    addUserMessage(text);

    if (chatState.step === "tattoo_size") {
      chatState.currentTattooTemp.size = text;
      askTattooStyle(chatState.currentTattooIndex);
    } else if (chatState.step === "tattoo_style") {
      chatState.currentTattooTemp.style = text;
      finishTattooStep(chatState.currentTattooIndex);
    } else if (chatState.step === "piercing_zone") {
      finishPiercingStep(chatState.currentPiercingIndex, text);
    } else if (chatState.step === "extra_piercing_custom") {
      chatState.extras.push(`Piercing: ${text}`);
      addBotMessage("💎 ¡Piercing añadido a la ficha de cita!");
      askAllergies();
    } else if (chatState.step === "customer_allergies") {
      chatState.allergies = text;
      addBotMessage("✅ Anotado en tu ficha para tomar todas las precauciones de salud e insumos debidos.");
      setTimeout(() => {
        askCustomerName();
      }, 350);
    } else if (chatState.step === "customer_name") {
      chatState.customerName = text;
      askCustomerPhone();
    } else if (chatState.step === "customer_phone") {
      chatState.customerPhone = text;
      if (chatState.serviceType === "Tienda") {
        finalizeChat({ fechaHoraTexto: "Consulta sobre catálogo de tienda" });
      } else {
        fetchRecommendedSlots();
      }
    } else if (chatState.step === "custom_date") {
      handleCustomDateInput(text);
    }
  }

  function showInput(placeholder) {
    const inputArea = document.getElementById("ft-chat-input-area");
    const textInput = document.getElementById("ft-chat-text-input");
    inputArea.classList.remove("ft-hidden");
    textInput.placeholder = placeholder || "Escribe tu respuesta...";
    textInput.focus();
  }

  function hideInput() {
    const inputArea = document.getElementById("ft-chat-input-area");
    if (inputArea) inputArea.classList.add("ft-hidden");
  }

  function addBotMessage(html) {
    const msgs = document.getElementById("ft-chat-messages");
    const div = document.createElement("div");
    div.className = "ft-msg ft-msg-bot";
    div.innerHTML = formatMarkdown(html);
    msgs.appendChild(div);
    scrollToBottom();
  }

  function addUserMessage(text) {
    const msgs = document.getElementById("ft-chat-messages");
    const div = document.createElement("div");
    div.className = "ft-msg ft-msg-user";
    div.textContent = text;
    msgs.appendChild(div);
    scrollToBottom();
  }

  function addOptionButtons(options, onSelect) {
    const msgs = document.getElementById("ft-chat-messages");
    const container = document.createElement("div");
    container.className = "ft-options-list";

    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "ft-opt-btn";
      b.textContent = opt.text;
      b.addEventListener("click", () => {
        container.querySelectorAll("button").forEach((btn) => btn.disabled = true);
        onSelect(opt.value);
      });
      container.appendChild(b);
    });

    msgs.appendChild(container);
    scrollToBottom();
  }

  function formatMarkdown(str) {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  function scrollToBottom() {
    const msgs = document.getElementById("ft-chat-messages");
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  document.addEventListener("DOMContentLoaded", () => {
    createChatbotUI();

    const oldFloat = document.querySelector(".whatsapp-float");
    if (oldFloat) {
      oldFloat.remove();
    }
  });

  window.openChatbot = function (type) {
    openChat(type);
  };
})();
