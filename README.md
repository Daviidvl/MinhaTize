# 🩹 Minha Tize - Calculadora de Tirzepatida

Calculadora web responsiva para usuários de Tirzepatida que utilizam seringas de insulina para aplicações fracionadas.

## 🎯 Objetivo

Informar quantas **unidades (UI)** devem ser aspiradas na seringa com base na concentração da ampola e na dose desejada.

## ✨ Funcionalidades

- ✅ Cálculo instantâneo de dosagem
- ✅ 3 opções de concentração de ampola
- ✅ 6 opções de dose desejada
- ✅ 3 tipos de seringa
- ✅ Orientação visual de uso
- ✅ Validação de segurança
- ✅ PWA instalável (iOS, Android)
- ✅ Responsivo e otimizado para mobile
- ✅ Acessível (WCAG 2.1 AA)
- ✅ Zero tracking

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abre automaticamente em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

### Testes

```bash
# Rodar testes
npm test

# Ver testes com UI
npm run test:ui

# Cobertura de testes
npm run test:coverage
```

## 📱 Plataformas Suportadas

- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ Navegadores desktop modernos
- ✅ Instalável na tela inicial (PWA)

## 🎨 Identidade Visual

Baseada no Guia Clínico da Tirzepatida 3.0:

- **Azul principal**: `#0A2F7A`
- **Azul escuro**: `#041F5A`
- **Dourado**: `#C89B3C`
- **Fundo**: `#F5F7FB`

## 🔧 Stack Tecnológico

- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para styling
- **Vitest** + React Testing Library para testes
- **PWA** com Service Worker

## 📐 Fórmula Matemática

```
1. Concentração = mg ÷ mL
2. Volume = doseDesejada ÷ concentração
3. UI = volume × 100
4. UI = Math.round(UI)
```

### Exemplo

```
Ampola: 15mg / 0.5mL
Dose: 7.5mg

Concentração: 15 ÷ 0.5 = 30 mg/mL
Volume: 7.5 ÷ 30 = 0.25 mL
UI: 0.25 × 100 = 25 UI

Resultado: 25 UI
```

## ⚠️ Aviso Legal

**Esta calculadora possui finalidade exclusivamente educativa e informativa.**

Os resultados apresentados são estimativas matemáticas baseadas nos dados informados pelo usuário. Qualquer ajuste de dose deve ser realizado com acompanhamento médico.

**Minha Tize não substitui orientação médica, farmacêutica ou nutricional.**

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
npm run build
# Fazer deploy da pasta `dist`
```

## 📊 Testes

A aplicação possui cobertura de testes de **80%+** incluindo:

- Testes unitários da calculadora
- Testes de integração dos componentes
- Testes de acessibilidade
- Validação de edge cases

## 🎯 Funcionalidades Planejadas (Phase 2)

- 📊 Histórico de cálculos
- 📈 Gráfico de progressão
- 📱 Push notifications
- 🌍 Suporte multilíngue
- 🔐 Sistema de contas (opcional)

## 📄 Licença

MIT © 2026

## 🤝 Contribuindo

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para usuários de Tirzepatida**
