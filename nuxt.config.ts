// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(
  {
  compatibilityDate: '2026-06-03',
  css: ['bootstrap/dist/css/bootstrap.min.css'],
  modules: ['@pinia/nuxt'],

  devServer: {
    host: 'timesheet.atlas-pro24.local', // Listens on all local IP addresses
    port: 3000       // Optional: defaults to 3000
  }
})