/**
 * PBDUCORTTEE — agendamento via WhatsApp
 *
 * Permite escolher mais de um serviço, soma o total e abre o WhatsApp com a mensagem pronta.
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
  const campoData = document.getElementById("data");
  const campoHorario = document.getElementById("horario");
  const mensagemErro = document.getElementById("erro");
  const totalEl = document.getElementById("total-servicos");
  const checkboxes = Array.from(document.querySelectorAll('input[name="servico"]'));

  /** Mostra uma mensagem de erro ao usuário (ou limpa, se vazia). */
  function mostrarErro(texto) {
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

  /** Converte minutos em "HH:MM", que é o valor que o campo de horário usa. */
  function paraValorHora(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    return `${h}:${m}`;
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

  /** Retorna os serviços marcados, com nome e preço. */
  function servicosSelecionados() {
    return checkboxes
      .filter((cb) => cb.checked)
      .map((cb) => ({ nome: cb.value, preco: Number(cb.dataset.preco) }));
  }

  /** Junta nomes em texto: "Cabelo", "Cabelo e Barba", "Cabelo, Barba e Luzes". */
  function juntarNomes(nomes) {
    if (nomes.length <= 1) return nomes.join("");
    return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
  }

  /** Atualiza o texto do total com a soma dos serviços marcados. */
  function atualizarTotal() {
    const total = servicosSelecionados().reduce((soma, s) => soma + s.preco, 0);
    totalEl.textContent = `Total: R$ ${total}`;
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

  /**
   * Lista os horários de início válidos para a data, em minutos.
   * Se a data for hoje, remove os horários que já passaram.
   */
  function horariosDoDia(dataIso) {
    const expediente = expedienteDo(dataIso);
    if (!expediente) return [];

    const eHoje = dataIso === hojeIso();
    const agora = minutosAgora();
    const lista = [];

    for (let m = expediente.inicio; m <= expediente.ultimoInicio; m += CONFIG.intervaloMinutos) {
      if (eHoje && m <= agora) continue;
      lista.push(m);
    }

    return lista;
  }

  /** Preenche o campo de horário com os horários válidos do dia escolhido. */
  function preencherHorarios(dataIso) {
    campoHorario.innerHTML = "";

    if (!dataIso) {
      campoHorario.add(new Option("Escolha primeiro a data", ""));
      campoHorario.disabled = true;
      return;
    }

    const minutosDisponiveis = horariosDoDia(dataIso);

    if (minutosDisponiveis.length === 0) {
      campoHorario.add(new Option("Sem horários disponíveis", ""));
      campoHorario.disabled = true;
      return;
    }

    campoHorario.add(new Option("Selecione um horário", ""));
    minutosDisponiveis.forEach((minutos) => {
      campoHorario.add(new Option(formatarHora(minutos), paraValorHora(minutos)));
    });
    campoHorario.disabled = false;
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
    if (horariosDoDia(valorIso).length === 0) {
      return "Não há mais horários disponíveis nesse dia. Escolha outra data.";
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
      return "Escolha um horário da lista.";
    }

    if (dataIso === hojeIso() && minutos <= minutosAgora()) {
      return "Esse horário de hoje já passou. Escolha outro horário.";
    }

    return "";
  }

  /** Monta o texto que vai para o WhatsApp, com os serviços e o total. */
  function montarMensagem(nome, servicos, data, horario) {
    const nomes = juntarNomes(servicos.map((s) => s.nome));
    const total = servicos.reduce((soma, s) => soma + s.preco, 0);

    return (
      `Olá! Meu nome é ${nome}.\n` +
      `Tem horário disponível para ${nomes} (total R$ ${total}), no dia ${formatarData(data)} às ${horario}?`
    );
  }

  // Ao escolher a data, valida e atualiza a lista de horários
  campoData.addEventListener("change", () => {
    const data = campoData.value;

    if (!data) {
      preencherHorarios("");
      return;
    }

    const erro = validarData(data);
    if (erro) {
      mostrarErro(erro);
      campoData.value = "";
      preencherHorarios("");
      return;
    }

    mostrarErro("");
    preencherHorarios(data);
  });

  // Ao marcar ou desmarcar um serviço, atualiza o total
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      atualizarTotal();
      mostrarErro("");
    });
  });

  // Envio do formulário
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const servicos = servicosSelecionados();
    const data = campoData.value;
    const horario = campoHorario.value;

    if (servicos.length === 0) {
      mostrarErro("Escolha pelo menos um serviço.");
      return;
    }

    if (!nome || !data || !horario) {
      mostrarErro("Preencha nome, data e horário.");
      return;
    }

    if (nome.length < 2) {
      mostrarErro("Informe seu nome.");
      return;
    }

    // Revalida no envio, porque o campo pode ter sido alterado por fora do formulário
    const erro = validarData(data) || validarHorario(data, horario);
    if (erro) {
      mostrarErro(erro);
      return;
    }

    mostrarErro("");

    const mensagem = montarMensagem(nome, servicos, data, horario);
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener");
  });

  // O calendário começa em hoje; os dias fechados são recusados pelo JS
  campoData.min = hojeIso();

  // Ao carregar, limpa a data se o navegador tiver preenchido uma data inválida
  if (campoData.value && validarData(campoData.value)) {
    campoData.value = "";
  }
  preencherHorarios(campoData.value);
  atualizarTotal();
})();