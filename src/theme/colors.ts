// Paleta extraída do frontend Next.js (fonte de verdade da identidade visual):
// src/app/login/login.css e src/app/registro/registro.css
export const colors = {
  // Verdes principais
  primary: "#34c35c", // .login-section / .left-section (tela de login)
  brandPanel: "#14542f", // .registro-brand-panel (painel esquerdo do cadastro)
  action: "#18a64f", // .submit-button (cadastro)
  actionPressed: "#128c42", // .submit-button:hover
  actionDisabled: "#8fc9a7", // .submit-button:disabled
  accent: "#45dd83", // .brand-dot / .brand-copy li::before
  tabActiveText: "#16964b", // .profile-tabs button.active
  inputFocus: "#1ba653", // .form-field input:focus

  // Fundo
  background: "#eaf5e5", // body (tela de login)
  white: "#ffffff",
  tabsBackground: "#eef1ef", // .profile-tabs

  // Texto
  textDark: "#1f1f1f", // .form-heading h2
  textMuted: "#777777", // .form-heading p / .login-link
  textLabel: "#666666", // .form-field label
  whiteMuted: "rgba(255, 255, 255, 0.68)", // .brand-copy p
  whiteFaint: "rgba(255, 255, 255, 0.58)", // .brand-stat
  whiteSoft: "rgba(255, 255, 255, 0.82)", // .brand-copy ul
  loginMuted: "#585860",
  loginLink: "#628b68",
  loginBtnText: "#4caf50", // .btn-login / .btn-google (cor exata do CSS, distinta de "primary")
  appleBorder: "#000000", // .btn-apple

  // Formulário
  border: "#d9dede", // .form-field input
  placeholder: "#b6b6b6",

  // Erros
  error: "#c73b3b",
  errorBorder: "#f0b5b5",
  errorBackground: "#fff0f0",
  errorText: "#ad2525",
} as const;
