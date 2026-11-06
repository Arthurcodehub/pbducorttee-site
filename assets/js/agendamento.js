/**
 * PBDUCORTTEE — agendamento via WhatsApp
 *
 * Valida o formulário conforme o horário de cada dia e abre o WhatsApp com a mensagem pronta.
 * Não há checagem de disponibilidade: quem confirma o horário é a barbearia.
 */

(function () {
  "use strict";

  // Configurações do negócio. Mudou algo? Altere só aqui.
  const CONFIG = {
    whatsapp: "554896437573",
    intervaloMinutos: 30, // intervalo entre horários de início
    // Horário por dia da semana (0 = domingo). null = fechado.
    horarios: {
      0: null,
      1: { abre: "13:30", fecha: "18:00" },
      2: null,
      3: { abre: "13:30", fecha: "18:00" },
      4: { abre: "13:30", fecha: "21:00" },
      5: { abre: "13:30", fecha: "21:00" },
      6: { abre: "10:00", fecha: "18:00" },
    },
  };

  const form = document.getElementById("form-agendamento");

  // Se o formulário não existir na página, não faz nada
  if (!form) return;

  const campoNome = document.getElementById("nome");
  const campoServico = document.getElementById("servico");
  const campoData = document.getElementById("data");
  const campoHorario = document.getElementById("horario");
  const mensagemErro = document.getElementById("erro");

  /** Mostra uma mensagem de erro ao usuário (ou limpa, se vazia). */
  function mostrarErro(texto) {
    // Protege contra o elemento não existir na página
    if (mensagemErro) {
      mensagemErro.textContent = texto;
    }
  }

  /** Converte "HH:MM" em minutos desde meia-noite. */
  function paraMinutos(valorHora) {
    const [h, m] = valorHora.split(":").map(Number);
    return h * 60 + m;
  }

  /** Converte minutos em texto legível, como "13h" ou "18h30". */
  function formatarHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
  }

  /** Retorna a data de hoje no formato "AAAA-MM-DD", no horário local. */
  function hojeIso() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  /** Retorna o horário atual em minutos desde meia-noite. */
  function minutosAgora() {
    const agora = new Date();
    return agora.getHours() * 60 + agora.getMinutes();
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

  /** Remove o preço do valor do select: "Nevou (R$ 180)" vira "Nevou". */
  function nomeDoServico(valorSelect) {
    return valorSelect.split(" (")[0];
  }

  /**
   * Retorna o expediente do dia escolhido, com o horário de início
   * e o último horário possível. Retorna null se a barbearia estiver fechada.
   */
  function expedienteDo(valorIso) {
    const horario = CONFIG.horarios[parseData(valorIso).getDay()];
    if (!horario) return null;

    return {
      inicio: paraMinutos(horario.abre),
      // O último atendimento começa um intervalo antes do fechamento
      ultimoInicio: paraMinutos(horario.fecha) - CONFIG.intervaloMinutos,
    };
  }

  /** Retorna a mensagem de erro para a data, ou "" se estiver válida. */
  function validarData(valorIso) {
    // Comparar strings "AAAA-MM-DD" funciona porque a ordem é cronológica
    if (valorIso < hojeIso()) {
      return "Escolha uma data de hoje em diante.";
    }
    if (!expedienteDo(valorIso)) {
      return "Não atendemos nesse dia. Escolha outra data.";
    }
    return "";
  }

  /** Retorna a mensagem de erro para o horário, ou "" se estiver válido. */
  function validarHorario(dataIso, valorHora) {
    const expediente = expedienteDo(dataIso);
    if (!expediente) {
      return "Não atendemos nesse dia. Escolha outra data.";
    }

    const minutos = paraMinutos(valorHora);
    const dentroDoExpediente = minutos >= expediente.inicio && minutos <= expediente.ultimoInicio;
    const blocoValido = minutos % CONFIG.intervaloMinutos === 0;

    if (!dentroDoExpediente || !blocoValido) {
      return `Escolha um horário entre ${formatarHora(expediente.inicio)} e ${formatarHora(expediente.ultimoInicio)} para esse dia, em intervalos de ${CONFIG.intervaloMinutos} minutos.`;
    }

    if (dataIso === hojeIso() && minutos <= minutosAgora()) {
      return "Esse horário de hoje já passou. Escolha outro horário.";
    }

    return "";
  }

  /** Monta o texto que vai para o WhatsApp. */
  function montarMensagem(nome, servico, data, horario) {
    return (
      `Olá! Meu nome é ${nome}.\n` +
      `Tem horário disponível para ${servico}, no dia ${formatarData(data)} às ${horario}?`
    );
  }

  // Validação ao escolher a data
  campoData.addEventListener("change", () => {
    if (!campoData.value) return;

    const erro = validarData(campoData.value);
    if (erro) {
      mostrarErro(erro);
      campoData.value = "";
      return;
    }

    mostrarErro("");
  });

  // Validação ao escolher o horário
  campoHorario.addEventListener("change", () => {
    if (!campoHorario.value) return;

    if (!campoData.value) {
      mostrarErro("Escolha primeiro a data.");
      campoHorario.value = "";
      return;
    }

    const erro = validarHorario(campoData.value, campoHorario.value);
    if (erro) {
      mostrarErro(erro);
      campoHorario.value = "";
      return;
    }

    mostrarErro("");
  });

  // Envio do formulário
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const servico = campoServico.value;
    const data = campoData.value;
    const horario = campoHorario.value;

    if (!nome || !servico || !data || !horario) {
      mostrarErro("Preencha todos os campos.");
      return;
    }

    if (nome.length < 2) {
      mostrarErro("Informe seu nome.");
      return;
    }

    // Revalida tudo no envio, porque a data e o horário podem ter sido digitados à mão
    const erro = validarData(data) || validarHorario(data, horario);
    if (erro) {
      mostrarErro(erro);
      return;
    }

    mostrarErro("");

    const mensagem = montarMensagem(nome, nomeDoServico(servico), data, horario);
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener");
  });

  // O calendário começa em hoje; os dias fechados são recusados pelo JS
  campoData.min = hojeIso();
})();