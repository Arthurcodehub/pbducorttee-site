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
    horaInicial: "13:00",
    horaFinal: "19:00", // horário de fechamento
    intervaloMinutos: 30, // intervalo entre horários de início
    diaFechado: 0, // 0 = domingo (padrão do JavaScript)
  };

  const form = document.getElementById("form-agendamento");

  // Se o formulário não existir na página, não faz nada
  if (!form) return;

  const campoNome = document.getElementById("nome");
  const campoServico = document.getElementById("servico");
  const campoData = document.getElementById("data");
  const campoHorario = document.getElementById("horario");
  const mensagemErro = document.getElementById("erro");

  const minutosInicial = paraMinutos(CONFIG.horaInicial);
  // O último atendimento começa um intervalo antes do fechamento
  const ultimoInicio = paraMinutos(CONFIG.horaFinal) - CONFIG.intervaloMinutos;

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

  /** Retorna a mensagem de erro para a data, ou "" se estiver válida. */
  function validarData(valorIso) {
    if (parseData(valorIso).getDay() === CONFIG.diaFechado) {
      return "Não atendemos aos domingos. Escolha outro dia.";
    }
    // Comparar strings "AAAA-MM-DD" funciona porque a ordem é cronológica
    if (valorIso < hojeIso()) {
      return "Escolha uma data de hoje em diante.";
    }
    return "";
  }

  /** Retorna a mensagem de erro para o horário, ou "" se estiver válido. */
  function validarHorario(dataIso, valorHora) {
    const minutos = paraMinutos(valorHora);
    const faixaPermitida = `Escolha um horário entre ${formatarHora(minutosInicial)} e ${formatarHora(ultimoInicio)}, em intervalos de ${CONFIG.intervaloMinutos} minutos.`;

    const dentroDoExpediente = minutos >= minutosInicial && minutos <= ultimoInicio;
    const blocoValido = minutos % CONFIG.intervaloMinutos === 0;

    if (!dentroDoExpediente || !blocoValido) {
      return faixaPermitida;
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

  /** Define a data mínima como hoje, para o calendário já começar nos dias válidos. */
  function definirDataMinima() {
    campoData.min = hojeIso();
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

  definirDataMinima();
})();