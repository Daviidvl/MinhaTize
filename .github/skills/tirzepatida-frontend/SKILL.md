---
name: tirzepatida-frontend
description: "Skill para desenvolvimento de aplicações frontend de controle de aplicação de tirzepatida. Use quando: implementar interfaces para agendamento, rastreamento e monitoramento de medicação com tirzepatida."
---

# Tirzepatida Control Application - Frontend Skill

## Visão Geral

Esta skill fornece estrutura, padrões, componentes reutilizáveis e templates para o desenvolvimento do frontend de aplicações de controle e gerenciamento de tirzepatida.

## 📦 Projetos Baseados Nesta Skill

### 1. **Minha Tize - Calculadora de Tirzepatida** ✅ COMPLETO

Calculadora web responsiva para usuários de Tirzepatida que utilizam seringas de insulina.

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS
**Status**: MVP Pronto para Deploy
**Localização**: `c:\Users\david\OneDrive\Documentos\GitHub\MinhaTize`

Veja [README do Projeto](../../README.md) para detalhes completos.

## Estrutura de Pastas Recomendada

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── OverviewCard.tsx
│   │   └── Charts.tsx
│   ├── medication/
│   │   ├── ScheduleManager.tsx
│   │   ├── DoseTracker.tsx
│   │   ├── MedicationHistory.tsx
│   │   └── ApplicationLog.tsx
│   ├── health-monitoring/
│   │   ├── VitalsTracker.tsx
│   │   ├── WeightTracker.tsx
│   │   ├── SymptomLog.tsx
│   │   └── HealthMetrics.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Modal.tsx
│   │   ├── Notification.tsx
│   │   └── LoadingSpinner.tsx
│   └── settings/
│       ├── UserProfile.tsx
│       ├── Preferences.tsx
│       └── PrivacySettings.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── SchedulePage.tsx
│   ├── HistoryPage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── medication.service.ts
│   ├── health.service.ts
│   └── user.service.ts
├── hooks/
│   ├── useMedication.ts
│   ├── useHealth.ts
│   ├── useAuth.ts
│   └── useFetch.ts
├── context/
│   ├── AuthContext.ts
│   ├── MedicationContext.ts
│   └── HealthContext.ts
├── types/
│   ├── index.ts
│   ├── medication.types.ts
│   ├── health.types.ts
│   └── api.types.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   └── components/
├── utils/
│   ├── dates.ts
│   ├── formatting.ts
│   ├── validation.ts
│   └── storage.ts
├── constants/
│   └── index.ts
└── App.tsx
```

## Funcionalidades Principais (Minha Tize)

### ✅ Implementadas
- **Cálculo de Dosagem**: Fórmula de conversão automática
- **3 Concentrações**: 15mg/0.5mL, 30mg/1mL, 60mg/2mL
- **6 Doses Predefinidas**: 2.5mg até 15mg
- **3 Tipos de Seringa**: 30 UI, 50 UI, 100 UI
- **Validação de Segurança**: Previne doses maiores que capacidade
- **Orientação Visual**: Instruções de como aspirar na seringa
- **PWA**: Instalável em iPhone e Android
- **Responsivo**: Otimizado para mobile-first
- **Acessível**: WCAG 2.1 AA completo
- **Testes**: Cobertura 80%+ com Vitest

### 🎯 Próximas Fases (Planejadas)

**Phase 2**:
- Histórico de cálculos (localStorage)
- Gráfico de progressão visual
- Exportação de dados
- Suporte multilíngue

**Phase 3**:
- Backend para sincronização
- Sistema de contas (opcional)
- Push notifications
- Integração com smartwatch

## Padrões de Desenvolvimento

### Componentes
- **Funcionais**: Usar React Hooks
- **Tipagem**: TypeScript strict mode
- **Props**: Sempre tipar props com interfaces/types
- **Acessibilidade**: WCAG 2.1 AA

### Estado
- Context API para estado global (auth, medicação)
- useReducer para lógica complexa
- Custom hooks para lógica reutilizável

### Requisições API
- Axios com interceptores
- Tratamento centralizado de erros
- Retry logic para falhas
- Loading states consistentes

### Testes
- Testes unitários (Jest)
- Testes de integração (React Testing Library)
- Cobertura mínima: 80%

## Stack Tecnológico (Confirmado)

- **Framework**: React 18+
- **Linguagem**: TypeScript 5+
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Context API + React Hooks
- **Formulários**: HTML nativo
- **Validação**: Lógica customizada (sem libs externas)
- **Testes**: Vitest + React Testing Library
- **PWA**: Service Worker nativo
- **Deploy**: Vercel (recomendado)
- **Versionamento**: Git + GitHub

## Padrões de Desenvolvimento

### Componentes
- **Funcionais**: React Hooks obrigatório
- **Tipagem**: TypeScript strict mode
- **Props**: Sempre tipar com interfaces/types
- **Acessibilidade**: WCAG 2.1 AA
- **Mobile-first**: Responsive design garantido

### Lógica de Negócio
- Funções puras para cálculos (`utils/calculator.ts`)
- Custom hooks para comportamentos reutilizáveis
- Context API para estado global
- useReducer para fluxos complexos

### Testes
- **Testes Unitários**: Funções de utilidade (100% cobertura)
- **Testes Integração**: Componentes React
- **Testes E2E**: Futuros (Playwright)
- **Target**: Cobertura mínima 80%

## Estrutura de Diretórios (Implementada)

```
MinhaTize/
├── src/
│   ├── components/
│   │   ├── Calculator.tsx      # Componente principal
│   │   ├── Result.tsx          # Exibição de resultado
│   │   ├── Header.tsx          # Cabeçalho
│   │   └── Footer.tsx          # Rodapé com aviso legal
│   ├── utils/
│   │   └── calculator.ts       # Lógica de cálculo (100% testado)
│   ├── types.ts                # Interfaces TypeScript
│   ├── App.tsx                 # App principal
│   ├── index.css               # Estilos globais + Tailwind
│   ├── main.tsx                # Entry point React
│   └── __tests__/
│       ├── calculator.test.ts  # Testes unitários (30+ testes)
│       └── Calculator.test.tsx # Testes do componente
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── icon-192.svg            # Ícone 192x192
│   └── icon-512.svg            # Ícone 512x512
├── index.html                  # HTML raiz
├── package.json                # Dependencies + scripts
├── vite.config.ts              # Config Vite
├── vitest.config.ts            # Config Vitest
├── tsconfig.json               # Config TypeScript
├── tailwind.config.js          # Config Tailwind
├── postcss.config.js           # Config PostCSS
├── vercel.json                 # Config Vercel
├── .env.example                # Variáveis de exemplo
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentação
```
