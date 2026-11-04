# PBDUCORTTEE

Site institucional da barbearia PBDUCORTTEE, em Balneário Gaivota (SC).

## Funcionalidades

- Apresentação, sobre, serviços e preços
- Galeria de trabalhos
- Agendamento que abre o WhatsApp com serviço, data e horário preenchidos
- Contato e localização

## Tecnologias

HTML, CSS e JavaScript puros. Não há frameworks nem etapa de build.

## Estrutura

```
pbducorttee/
├── index.html
├── README.md
├── .gitignore
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── agendamento.js
    └── img/
        ├── logo.png
        └── fotos/
```

## Como visualizar localmente

Abra o arquivo `index.html` no navegador.

## Configuração

- **WhatsApp e horário de atendimento:** objeto `CONFIG` em `assets/js/agendamento.js`.
- **Serviços e preços:** estão em dois lugares no `index.html`, nos cards da seção "Serviços e Preços" e nas opções do campo "Serviço" do formulário. Ao alterar um preço, atualize os dois.

## Publicação

O site é publicado com GitHub Pages, a partir da branch `main`, pasta `/ (root)`.

Cada `push` na `main` atualiza o site em alguns minutos.

## Créditos

Desenvolvido por Arthur Fernandes.