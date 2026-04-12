# Sistema de Temas (Dark/Light Mode)

O Koda utiliza um sistema de temas dinâmico que permite alternar entre os modos **Light** e **Dark**, garantindo acessibilidade e conforto visual para os usuários.

---

## 🏗 Arquitetura do Sistema

O sistema de temas é construído sobre três pilares fundamentais:
1.  **CSS Variables:** O estilo não é fixo; ele depende de variáveis globais que mudam conforme o tema selecionado.
2.  **Context API:** Um contexto global (`ThemeContext.tsx`) gerencia e persiste a preferência do usuário.
3.  **Data Attribute:** O tema atual é injetado no elemento raiz (`html`) através do atributo `data-theme`.

---

## 🎨 Variáveis de Estilo (`global.css`)

Todas as cores fundamentais da interface são definidas via variáveis CSS. Ao criar novos componentes, **nunca utilize cores hexadecimais fixas**. Use as variáveis abaixo:

| Variável | Uso Recomendado |
| :--- | :--- |
| `--bg-color` | Fundo principal das páginas. |
| `--sidebar-bg` | Cor de fundo da barra lateral. |
| `--card-bg` | Fundo de containers, modais e cards. |
| `--text-color` | Cor do texto principal (títulos, parágrafos). |
| `--text-secondary` | Cor de textos informativos ou desativados. |
| `--border-color` | Cor para bordas de inputs, tabelas e divisores. |
| `--input-bg` | Fundo específico para campos de formulário. |

---

## 💻 Como Utilizar no Desenvolvimento

### Em Arquivos CSS
Ao estilizar um componente, referencie as variáveis para que ele se adapte automaticamente:

```css
.meu-componente {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
}
```

### No React (via Contexto)
Se precisar saber o tema atual via JavaScript (ex: para mudar o ícone do botão de toggle ou parâmetros de um gráfico):

```tsx
import { useTheme } from '../../contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();

return (
  <button onClick={toggleTheme}>
    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
  </button>
);
```

---

## 💾 Persistência e Aplicação
- **LocalStorage:** A preferência do usuário ('light' ou 'dark') é salva na chave `@KodaWeb:theme`.
- **Efeito Visual:** O `ThemeContext` aplica automaticamente o atributo `data-theme` ao `document.documentElement`, o que faz com que o CSS mude instantaneamente sem recarregar a página.

---

## 🛠 Guia de Adição de Novos Temas
Para adicionar um novo tema futuramente (ex: 'high-contrast'):
1.  Adicione as definições de variáveis correspondentes no `global.css` sob o seletor `[data-theme="high-contrast"]`.
2.  Atualize o tipo `Theme` no `ThemeContext.tsx` para incluir o novo valor.

---
*Mantenha a interface coesa utilizando sempre o sistema de variáveis.*
