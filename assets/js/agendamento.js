/**
 * PBDUCORTTEE — agendamento via WhatsApp
 *
 * Valida o formulário e abre o WhatsApp com a mensagem pronta.
 * Não há checagem de disponibilidade: quem confirma o horário é a barbearia.
 */

(function () {
  "use strict";

  // Configurações do negócio. Mudou algo? Altere só aqui.
  const CONFIG = {
    whatsapp: "554896437573",
    horaInicial: "08:00",
    horaFinal: "19:00",
    diaFechado: 0, // 0 = domingo (padrão do JavaScript)
  };

  const form = document.getElementById("form-agendamento");
  const campoData = document.getElementById("data");
  const campoHorario = document.getElementById("horario");
  const mensagemErro = document.getElementById("erro");

  // Se o formulário não existir na página, não faz nada
  if (!form) return;

  /** Mostra uma mensagem de erro ao usuário (ou limpa, se vazia). */
  function mostrarErro(texto) {
    mensagemErro.textContent = texto;
  }

  /** Converte "AAAA-MM-DD" em um Date local, sem o bug de fuso horário. */
  function parseData(valorIso) {
    const [ano, mes, dia] = valorIso.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /** Converte "AAAA-MM-DD" em "DD/MM/AAAA". */
  function formatarData(valorIso) {
    const [ano, mes, dia] = valorIso.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  /** Define a data mínima como hoje, para não agendar no passado. */
  function definirDataMinima() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    campoData.min = `${ano}-${mes}-${dia}`;
  }

  /** Retorna true se a data for domingo. */
  function ehDiaFechado(valorIso) {
    return parseData(valorIso).getDay() === CONFIG.diaFechado;
  }

  /** Retorna true se o horário estiver dentro do funcionamento e em blocos de 30 min. */
  function horarioValido(valorHora) {
    const [h, m] = valorHora.split(":").map(Number);
    const [hInicial] = CONFIG.horaInicial.split(":").map(Number);
    const [hFinal] = CONFIG.horaFinal.split(":").map(Number);

    const dentroDoExpediente = h >= hInicial && h <= hFinal;
    const blocoDe30 = m === 0 || m === 30;
    return dentroDoExpediente && blocoDe30;
  }

  /** Monta o texto que vai para o WhatsApp. */
  function montarMensagem(nome, servico, data, horario) {
    return (
      `Olá! Meu nome é ${nome}.\n` +
      `Gostaria de agendar: ${servico}\n` +
      `Data: ${formatarData(data)}\n` +
      `Horário: ${horario}`
    );
  }

  // Validação ao escolher a data
  campoData.addEventListener("change", () => {
    if (!campoData.value) return;

    if (ehDiaFechado(campoData.value)) {
      mostrarErro("Não atendemos aos domingos. Escolha outro dia.");
      campoData.value = "";
      return;
    }

    mostrarErro("");
  });

  // Validação ao escolher o horário
  campoHorario.addEventListener("change", () => {
    if (!campoHorario.value) return;

    if (!horarioValido(campoHorario.value)) {
      mostrarErro(
        `Escolha um horário entre ${CONFIG.horaInicial} e ${CONFIG.horaFinal}, em intervalos de 30 minutos.`
      );
      campoHorario.value = "";
      return;
    }

    mostrarErro("");
  });

  // Envio do formulário
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const servico = document.getElementById("servico").value;
    const data = campoData.value;
    const horario = campoHorario.value;

    if (!nome || !servico || !data || !horario) {
      mostrarErro("Preencha todos os campos.");
      return;
    }

    if (ehDiaFechado(data)) {
      mostrarErro("Não atendemos aos domingos. Escolha outro dia.");
      return;
    }

    if (!horarioValido(horario)) {
      mostrarErro("Escolha um horário dentro do expediente.");
      return;
    }

    mostrarErro("");

    const mensagem = montarMensagem(nome, servico, data, horario);
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener");
  });

  definirDataMinima();
})();