# 🏆 God Level Coder Challenge — Lirou Analytics

## 🎯 O Desafio

Donos de restaurantes lidam com múltiplos canais de venda (presencial, iFood, Rappi, app próprio) e grandes volumes de dados sobre vendas, produtos, clientes e operações.  
Porém, ferramentas genéricas como Power BI não respondem perguntas específicas de gestão nem permitem explorar dados de forma personalizada.

> **Como empoderar donos de restaurantes a criarem suas próprias análises e visualizarem seus dados de forma intuitiva?**

---

## 🚀 A Solução — Lirou Analytics

O **Lirou Analytics** é uma plataforma interativa de visualização e análise de dados voltada para o setor de *food service*.  
Ela permite que donos de restaurantes:

- 📊 Visualizem métricas relevantes (faturamento, produtos mais vendidos, horários de pico)
- 🧩 Criem dashboards personalizados sem precisar escrever código
- 🔁 Compare períodos e identifiquem tendências
- 💡 Extraiam insights de dados complexos de forma simples e acessível

---

## 🎥 Demonstração em Vídeo

🔗 **YouTube:** [https://youtu.be/TW9kW5q1J9U](https://youtu.be/TW9kW5q1J9U)  
🌐 **Deploy:** [http://lirouanalytics.site/](http://lirouanalytics.site/)  
📄 **Requisitos Funcionais e Não Funcionais:** [Documento no Google Docs](https://docs.google.com/document/d/1i-XpzbtEctp6G6wXaoaCfrKMDRf-QLdON1BCzh8ksMg/edit?usp=sharing)

---

## 🧱 Estrutura do Projeto

A solução foi projetada com uma arquitetura modular e escalável, composta por **Frontend**, **Backend**, **Banco de Dados** e **Nginx**.

```text
├── .gitignore
├── AVALIACAO.md
├── DADOS.md
├── database-schema.sql
├── deploy.sh
├── docker-compose.yml
├── Dockerfile
├── FAQ.md
├── generate_data.py
├── nginx-proxy.conf
├── PROBLEMA.md
├── QUICKSTART.md
├── README.md
├── requirements.txt
│
├── backend
│   ├── Dockerfile
│   ├── requirements.txt
│   │
│   └── app
│       ├── api
│       │   └── endpoints
│       │       ├── analytics.py         → Endpoints de análises e métricas
│       │       ├── debug.py             → Testes e diagnósticos de API
│       │       ├── products.py          → Consultas e listagem de produtos
│       │       ├── sales.py             → Consultas e filtros de vendas
│       │       └── __init__.py
│       │
│       ├── core
│       │   ├── config.py                → Configurações gerais e variáveis de ambiente
│       │   ├── database.py              → Conexão com PostgreSQL via SQLAlchemy
│       │   └── __init__.py
│       │
│       ├── models
│       │   ├── schemas.py               → Modelos Pydantic (validação de dados)
│       │   └── __init__.py
│       │
│       ├── services
│       │   ├── analytics_service.py     → Lógica de geração de insights e KPIs
│       │   ├── query_builder.py         → Construção dinâmica de queries SQL
│       │   └── __init__.py
│       │
│       └── utils
│           ├── helpers.py               → Funções auxiliares (formatação, cálculos)
│           └── __init__.py
│
├── frontend
│   ├── index.html                       → Tela inicial (modo simples)
│   ├── simple-mode.html                 → Dashboard básico
│   ├── advanced-mode.html               → Dashboard avançado (customização)
│   ├── nginx.conf                       → Configuração do servidor Nginx
│   ├── Dockerfile
│   │
│   ├── css
│   │   ├── style.css                    → Estilos globais
│   │   ├── components.css               → Componentes UI
│   │   ├── simple-mode.css              → Layout modo simples
│   │   ├── advanced-mode.css            → Layout modo avançado
│   │   └── charts.css                   → Estilos dos gráficos
│   │
│   └── js
│       ├── api.js                       → Comunicação com o backend (REST)
│       ├── app.js                       → Inicialização e controle da interface
│       ├── charts.js                    → Renderização de gráficos interativos
│       ├── advanced-mode.js             → Lógica de dashboards customizados
│       ├── simple-mode.js               → Lógica de visualização básica
│       ├── client.js                    → Gestão de estados e filtros do usuário
│       └── utils.js                     → Funções utilitárias (formatação, datas)
│
└── nginx-app
    ├── nginx
    │   ├── default.conf                 → Configuração padrão do proxy reverso
    │   └── nginx.conf                   → Roteamento e cache do front
    │
    └── src
        ├── index.html                   → Página inicial servida pelo Nginx
        ├── css
        │   └── styles.css
        └── js
            └── app.js
